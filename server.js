const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = process.env.PORT || 8080;

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

app.use(express.json());
app.use(express.static('.'));

app.post('/api/generate-recipe', async (req, res) => {
  try {
    const { ingredients } = req.body;
    
    if (!ingredients) {
      return res.status(400).json({ success: false, error: 'No ingredients provided' });
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
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Recipe Rover running on port ${port}`);
});
