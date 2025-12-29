const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 8080;

// Initialize Gemini
// Model options:
// - gemini-1.5-flash (recommended for free tier - better limits)
// - gemini-1.5-flash-latest
// - gemini-2.0-flash (newer but stricter free tier limits)
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-1.5-flash";
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
    const retryMatch = errorString.match(/retryDelay["\s:]+"?(\d+(?:\.\d+)?)s/i);
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
  } catch (e) {
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
        const retryDelay = extractRetryDelay(error) || Math.pow(2, attempt) * 1000; // Exponential backoff fallback
        
        console.warn(
          `Quota exceeded (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${retryDelay}ms...`
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

app.post("/api/generate-recipe", async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients) {
      return res
        .status(400)
        .json({ success: false, error: "No ingredients provided" });
    }

    // Track usage
    usageStats.totalRequests++;
    usageStats.lastRequestTime = new Date().toISOString();

    const prompt = `You are a creative chef. Create a delicious recipe using these ingredients: ${ingredients}

Please provide:
1. A creative recipe name
2. List of ingredients with measurements
3. Step-by-step cooking instructions
4. Estimated cooking time
5. Serving size

Make the recipe practical and delicious!`;

    const recipe = await generateContentWithRetry(prompt);
    
    // Track success
    usageStats.successfulRequests++;

    res.json({ success: true, recipe });
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
      errorMessage += `The free tier has daily and per-minute limits. Current model: ${GEMINI_MODEL}. `;
      errorMessage += "If this persists, consider switching to gemini-1.5-flash or enabling billing. Check your quota at https://ai.dev/usage";
      
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
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred while generating the recipe",
    });
  }
});

const server = app.listen(port, () => {
  console.log(`Chomptron AI Recipe Generator running on port ${port}`);
});

module.exports = server;
