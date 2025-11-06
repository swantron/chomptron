const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const port = process.env.PORT || 8080;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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
  res.status(200).json({ status: "ready", service: "chomptron" });
});

app.post("/api/generate-recipe", async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients) {
      return res
        .status(400)
        .json({ success: false, error: "No ingredients provided" });
    }

    const prompt = `You are a creative chef. Create a delicious recipe using these ingredients: ${ingredients}

Please provide:
1. A creative recipe name
2. List of ingredients with measurements
3. Step-by-step cooking instructions
4. Estimated cooking time
5. Serving size

Make the recipe practical and delicious!`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const recipe = response.text();

    res.json({ success: true, recipe });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const server = app.listen(port, () => {
  console.log(`Chomptron AI Recipe Generator running on port ${port}`);
});

module.exports = server;
