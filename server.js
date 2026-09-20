// watchtron white-box tracing. Must be required before express/http so the
// OpenTelemetry instrumentation can patch them. No-op unless WATCHTRON_OTLP_ENDPOINT is set.
require("@swantron/otel-bootstrap/register");
const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { syntheticMarkerMiddleware } = require("@swantron/otel-bootstrap");
const { McpServer } = require("@modelcontextprotocol/server");
const {
  NodeStreamableHTTPServerTransport,
} = require("@modelcontextprotocol/node");
const { z } = require("zod");
const fs = require("fs");

const app = express();
// Stamp synthetic run ids from watchtron probes onto the server span.
app.use(syntheticMarkerMiddleware());
const port = process.env.PORT || 8080;

// Initialize Gemini
// Model options (as of May 2026):
// - gemini-3.1-flash-lite (RECOMMENDED - stable, budget-friendly free tier)
// - gemini-3.5-flash (stable, highest capability in flash family)
// - gemini-2.5-flash-lite (previous gen, still available)
// - gemini-2.5-flash (previous gen, still available)
//
// If you see "limit: 0" errors, try enabling billing (pay-as-you-go) even if you
// stay within free usage - this unlocks Tier 1 quotas.
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.1-flash-lite";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

// Usage tracking (in-memory, resets on restart)
let usageStats = {
  totalRequests: 0,
  successfulRequests: 0,
  quotaErrors: 0,
  otherErrors: 0,
  lastRequestTime: null,
  model: GEMINI_MODEL,
};

// Simple in-memory recipe cache (per-instance, helps with concurrent requests)
// Note: Serverless instances are ephemeral, but this helps with burst traffic on same instance
const recipeCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 100; // Limit cache size

// Helper to create cache key from ingredients
const createCacheKey = (ingredients, dietaryPrefs = {}) => {
  const normalized = ingredients.toLowerCase().trim().replace(/\s+/g, " ");
  const prefs = Object.keys(dietaryPrefs)
    .filter((k) => dietaryPrefs[k])
    .sort()
    .join(",");
  return `${normalized}|${prefs}`;
};

console.log(`Initialized Gemini with model: ${GEMINI_MODEL}`);

app.use(express.json());
app.use(express.static("."));

// Serve sitemap.xml with correct content type
app.get("/sitemap.xml", (req, res) => {
  res.set("Content-Type", "application/xml");
  res.sendFile(__dirname + "/sitemap.xml");
});

// Serve robots.txt with correct content type
app.get("/robots.txt", (req, res) => {
  res.set("Content-Type", "text/plain");
  res.sendFile(__dirname + "/robots.txt");
});

// Health check endpoint for Cloud Run
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", service: "chomptron" });
});

// Readiness check - verifies AI service is configured
app.get("/ready", (req, res) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      status: "not ready",
      error: "GEMINI_API_KEY not configured",
    });
  }
  res.status(200).json({
    status: "ready",
    service: "chomptron",
    model: GEMINI_MODEL,
  });
});

// Usage stats endpoint to help monitor quota
app.get("/api/usage", (req, res) => {
  res.json({
    ...usageStats,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Helper function to sleep for a given duration
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper function to extract retry delay from error
const extractRetryDelay = (error) => {
  try {
    // Check if error has retry info in the message or details
    const errorString = JSON.stringify(error);
    const retryMatch = errorString.match(
      /retryDelay["\s:]+"?(\d+(?:\.\d+)?)s/i,
    );
    if (retryMatch) {
      return Math.ceil(parseFloat(retryMatch[1]) * 1000); // Convert to milliseconds
    }
    // Check error.details for retry info
    if (error.details) {
      for (const detail of error.details) {
        if (detail["@type"] === "type.googleapis.com/google.rpc.RetryInfo") {
          const delay = detail.retryDelay;
          if (delay) {
            // Parse duration string like "33s" or seconds number
            if (typeof delay === "string") {
              const match = delay.match(/(\d+(?:\.\d+)?)s/);
              if (match) return Math.ceil(parseFloat(match[1]) * 1000);
            }
            return Math.ceil(parseFloat(delay) * 1000);
          }
        }
      }
    }
  } catch {
    // Fallback if parsing fails
  }
  return null;
};

// Helper function to check if error is a quota/rate limit error
const isQuotaError = (error) => {
  const errorMessage = error.message || "";
  const errorCode = error.code || error.status || "";
  return (
    errorCode === 429 ||
    errorMessage.includes("429") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("Too Many Requests")
  );
};

// Helper function to generate content with retry logic
const generateContentWithRetry = async (prompt, maxRetries = 3) => {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;

      // If it's a quota error, extract retry delay and wait
      if (isQuotaError(error) && attempt < maxRetries) {
        const retryDelay =
          extractRetryDelay(error) || Math.pow(2, attempt) * 1000; // Exponential backoff fallback

        console.warn(
          `Quota exceeded (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${retryDelay}ms...`,
        );

        await sleep(retryDelay);
        continue;
      }

      // If not a quota error or max retries reached, throw
      throw error;
    }
  }

  throw lastError;
};

// Shared by both the REST route and the MCP tool: cache lookup, prompt
// build, Gemini call with retry, cache write. Callers own their own
// usage tracking and error presentation.
async function generateRecipe(ingredients, dietaryPreferences = {}) {
  const cacheKey = createCacheKey(ingredients, dietaryPreferences);
  const cached = recipeCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`Cache hit for: ${ingredients.substring(0, 50)}...`);
    return { recipe: cached.recipe, cached: true };
  }

  const dietaryNotes = [];
  if (dietaryPreferences.vegan) dietaryNotes.push("vegan");
  if (dietaryPreferences.vegetarian) dietaryNotes.push("vegetarian");
  if (dietaryPreferences.glutenFree) dietaryNotes.push("gluten-free");
  if (dietaryPreferences.dairyFree) dietaryNotes.push("dairy-free");
  if (dietaryPreferences.nutFree) dietaryNotes.push("nut-free");
  if (dietaryPreferences.shellfishFree) dietaryNotes.push("shellfish-free");
  if (dietaryPreferences.eggFree) dietaryNotes.push("egg-free");
  if (dietaryPreferences.soyFree) dietaryNotes.push("soy-free");

  const dietaryString =
    dietaryNotes.length > 0
      ? `\n\nIMPORTANT: This recipe must be ${dietaryNotes.join(", ")}. Do not include any ingredients that violate these dietary restrictions.`
      : "";

  const prompt = `You are a creative chef. Create a delicious recipe using these ingredients: ${ingredients}${dietaryString}

Please provide the recipe in the following structured format:

**Recipe Name:** [Creative recipe name]

**Serving Size:** [Number] servings

**Prep Time:** [Time in minutes]
**Cook Time:** [Time in minutes]
**Total Time:** [Total time]

**Ingredients:**
- [Ingredient 1 with measurement]
- [Ingredient 2 with measurement]
- [Continue list...]

**Instructions:**
1. [Step 1]
2. [Step 2]
3. [Continue steps...]

**Tips:** [Optional cooking tips or variations]

Make the recipe practical and delicious!`;

  const recipe = await generateContentWithRetry(prompt);

  if (recipeCache.size >= MAX_CACHE_SIZE) {
    const firstKey = recipeCache.keys().next().value;
    recipeCache.delete(firstKey);
  }
  recipeCache.set(cacheKey, { recipe, timestamp: Date.now() });

  return { recipe, cached: false };
}

app.post("/api/generate-recipe", async (req, res) => {
  try {
    const { ingredients, dietaryPreferences = {} } = req.body;

    if (!ingredients) {
      return res
        .status(400)
        .json({ success: false, error: "No ingredients provided" });
    }

    checkRestBudget(req);

    // Track usage
    usageStats.totalRequests++;
    usageStats.lastRequestTime = new Date().toISOString();

    const { recipe, cached } = await generateRecipe(
      ingredients,
      dietaryPreferences,
    );
    usageStats.successfulRequests++;

    res.json({ success: true, recipe, cached });
  } catch (error) {
    console.error("Error:", error);

    // Handle quota/rate limit errors with user-friendly messages
    if (isQuotaError(error)) {
      usageStats.quotaErrors++;

      const retryDelay = extractRetryDelay(error);
      const retrySeconds = retryDelay ? Math.ceil(retryDelay / 1000) : null;

      let errorMessage = "API quota exceeded. ";
      if (retrySeconds) {
        errorMessage += `Please try again in ${retrySeconds} seconds. `;
      }
      errorMessage += `Current model: ${GEMINI_MODEL}. `;

      // Provide helpful guidance based on the error
      if (error.message && error.message.includes("limit: 0")) {
        errorMessage +=
          "⚠️ Seeing 'limit: 0'? This often means the model was removed from fully free tier. ";
        errorMessage +=
          "Try switching to gemini-3.1-flash-lite or enable billing (pay-as-you-go) to unlock Tier 1 quotas. ";
      } else {
        errorMessage += "The free tier has daily and per-minute limits. ";
        if (GEMINI_MODEL !== "gemini-3.1-flash-lite") {
          errorMessage +=
            "Consider switching to gemini-3.1-flash-lite for better free tier limits. ";
        }
        errorMessage += "You can also enable billing to access higher limits. ";
      }
      errorMessage += "Check your quota at https://ai.dev/usage";

      return res.status(429).json({
        success: false,
        error: errorMessage,
        retryAfter: retrySeconds,
        quotaExceeded: true,
        model: GEMINI_MODEL,
        usageStats: {
          totalRequests: usageStats.totalRequests,
          quotaErrors: usageStats.quotaErrors,
        },
      });
    }

    // Track other errors
    usageStats.otherErrors++;

    // Generic error handling
    const status = error.status === 429 ? 429 : 500;
    res.status(status).json({
      success: false,
      error: error.message || "An error occurred while generating the recipe",
    });
  }
});

// MCP tool exposure. Separate budget from the website's own usageStats —
// this bounds the *incremental* Gemini quota an MCP client (Claude, ChatGPT,
// etc.) can consume, independent of real chomptron.com traffic. Persisted to
// a file so a process restart on the same Cloud Run instance does not reset
// the counter; a brand-new instance still starts at zero (no shared DB).
const MCP_DAILY_LIMIT = parseInt(
  process.env.MCP_DAILY_RECIPE_LIMIT || "20",
  10,
);
const MCP_BUDGET_FILE =
  process.env.MCP_BUDGET_FILE || "/tmp/chomptron-mcp-budget.json";
const REST_HOURLY_LIMIT = parseInt(
  process.env.REST_HOURLY_RECIPE_LIMIT || "30",
  10,
);
let mcpCallsToday = 0;
let mcpWindowStart = Date.now();
const restHits = new Map();

function loadMcpBudget() {
  try {
    const raw = JSON.parse(fs.readFileSync(MCP_BUDGET_FILE, "utf8"));
    if (typeof raw.count === "number" && typeof raw.windowStart === "number") {
      if (Date.now() - raw.windowStart < 24 * 60 * 60 * 1000) {
        mcpCallsToday = raw.count;
        mcpWindowStart = raw.windowStart;
      }
    }
  } catch {
    // First boot, or tmp wiped — start a fresh window.
  }
}

function saveMcpBudget() {
  try {
    fs.writeFileSync(
      MCP_BUDGET_FILE,
      JSON.stringify({ count: mcpCallsToday, windowStart: mcpWindowStart }),
    );
  } catch (err) {
    console.warn("Could not persist MCP budget:", err.message);
  }
}

loadMcpBudget();

function checkMcpBudget() {
  if (Date.now() - mcpWindowStart > 24 * 60 * 60 * 1000) {
    mcpCallsToday = 0;
    mcpWindowStart = Date.now();
  }
  if (mcpCallsToday >= MCP_DAILY_LIMIT) {
    throw new Error(
      `Daily MCP recipe limit (${MCP_DAILY_LIMIT}) reached — try again tomorrow, or use chomptron.com directly.`,
    );
  }
  mcpCallsToday++;
  saveMcpBudget();
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

function checkRestBudget(req) {
  const ip = clientIp(req);
  const now = Date.now();
  const rec = restHits.get(ip);
  if (!rec || now - rec.start > 60 * 60 * 1000) {
    restHits.set(ip, { count: 1, start: now });
    return;
  }
  if (rec.count >= REST_HOURLY_LIMIT) {
    const err = new Error(
      `Hourly recipe limit (${REST_HOURLY_LIMIT}) reached for this address — try again later.`,
    );
    err.status = 429;
    throw err;
  }
  rec.count++;
}

const mcpServer = new McpServer({ name: "chomptron", version: "1.0.0" });

mcpServer.registerTool(
  "generate_recipe",
  {
    title: "Generate a recipe",
    description:
      "Given ingredients on hand (and optional dietary restrictions), generate a complete recipe: name, servings, timing, ingredient list, and steps.",
    inputSchema: {
      ingredients: z
        .string()
        .describe("Ingredients on hand, comma-separated or free text"),
      dietaryPreferences: z
        .object({
          vegan: z.boolean().optional(),
          vegetarian: z.boolean().optional(),
          glutenFree: z.boolean().optional(),
          dairyFree: z.boolean().optional(),
          nutFree: z.boolean().optional(),
          shellfishFree: z.boolean().optional(),
          eggFree: z.boolean().optional(),
          soyFree: z.boolean().optional(),
        })
        .optional(),
    },
    annotations: { readOnlyHint: true, openWorldHint: true },
  },
  async ({ ingredients, dietaryPreferences }) => {
    checkMcpBudget();
    const { recipe } = await generateRecipe(ingredients, dietaryPreferences);
    return { content: [{ type: "text", text: recipe }] };
  },
);

app.post("/mcp", async (req, res) => {
  const transport = new NodeStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await mcpServer.connect(transport);
  await transport.handleRequest(req, res, req.body);
});

const server = app.listen(port, () => {
  console.log(`Chomptron AI Recipe Generator running on port ${port}`);
});

module.exports = server;
