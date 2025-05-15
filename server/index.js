require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Groq = require('groq-sdk');
const axios = require('axios');
const puppeteer = require('puppeteer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
if (!process.env.GROQ_API_KEY) {
  console.error('GROQ_API_KEY is not set in environment variables');
  process.exit(1);
}
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use('/images', express.static(path.join(__dirname, 'images')));

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model('User', userSchema);

// Recipe Schema
const recipeSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  recipe: { type: String, required: true },
  steps: [{ stepNumber: Number, instruction: String, time: String }],
  ingredients: [String],
  cookingStyle: String,
  imageUrl: String,
});
const Recipe = mongoose.model('Recipe', recipeSchema);

// Middleware to get userId
const getUserId = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) return res.status(401).json({ error: 'User ID required' });
  req.userId = userId;
  next();
};

// Image Generation with Puppeteer
async function getDishImage(dishName, recipeId) {
  const outputPath = path.join(__dirname, 'images', `${recipeId}.jpg`);
  try {
    // Ensure images directory exists
    const imagesDir = path.join(__dirname, 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage'],
      // Use default executable path or Render's cache
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    });
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?hl=en&tbm=isch&q=${encodeURIComponent(dishName)}`, {
      waitUntil: 'networkidle2',
      timeout: 60000, // Increase timeout
    });
    await page.evaluate(() => window.scrollBy(0, 1000));
    const imageUrl = await page.evaluate(() => {
      const images = document.querySelectorAll('img');
      for (let img of images) {
        const src = img.src;
        if (src && !src.startsWith('data:image') && src.includes('http')) return src;
      }
      return null;
    });
    await browser.close();

    if (!imageUrl) {
      console.error('No valid image found for:', dishName);
      throw new Error('No image found');
    }

    const response = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 30000 });
    fs.writeFileSync(outputPath, response.data);
    const imageUrlPath = `/images/${recipeId}.jpg`;
    console.log(`Generated image URL: ${imageUrlPath}`);
    return imageUrlPath;
  } catch (error) {
    console.error('Image generation error:', error.message);
    return 'https://via.placeholder.com/300?text=Image+Not+Found';
  }
}

// Generate Recipe Endpoint
app.post('/api/generate-recipe', getUserId, async (req, res) => {
  const { ingredients, difficultyMode, language, cookingStyle, servingSize } = req.body;
  try {
    const languageNames = {
      en: 'English',
      es: 'Spanish',
      fr: 'French',
      hi: 'Hindi',
    };
    const recipeText = `
      Generate a recipe using ${ingredients.join(', ')} for ${servingSize} servings.
      ${difficultyMode ? 'Make it challenging for experienced chefs.' : 'Keep it simple.'}
      Use ${cookingStyle} cooking style.
      Provide the recipe entirely in ${languageNames[language] || 'English'}, including ingredient names, instructions, and any descriptive text. Do not use English unless explicitly requested.
      Format as JSON: { "recipe": "name", "ingredients": ["item1", "item2", ...], "steps": [{"instruction": "...", "time": "X minutes" | null}] }
      Ensure ingredients are a simple string array, not objects. Ensure valid JSON with proper brackets.
    `;
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'You are a recipe generator. Return valid JSON in the specified language.' },
        { role: 'user', content: recipeText },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    let recipeData;
    try {
      recipeData = JSON.parse(response.choices[0].message.content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message, 'Raw response:', response.choices[0].message.content);
      throw new Error('Invalid JSON response from Groq');
    }

    if (!recipeData.recipe || !Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.steps)) {
      throw new Error('Invalid recipe data structure');
    }

    const formattedSteps = recipeData.steps.map((step, index) => ({
      stepNumber: index + 1,
      instruction: step.instruction,
      time: step.time || null,
    }));

    const recipe = new Recipe({
      userId: req.userId,
      recipe: recipeData.recipe,
      steps: formattedSteps,
      ingredients,
      cookingStyle,
      imageUrl: 'https://via.placeholder.com/300?text=Image+Loading',
    });
    await recipe.save();

    const imageUrl = await getDishImage(recipeData.recipe, recipe._id);
    await Recipe.updateOne({ _id: recipe._id }, { imageUrl });

    res.json({
      recipe: recipeData.recipe,
      ingredients: recipeData.ingredients,
      steps: formattedSteps,
      imageUrl,
      recipeId: recipe._id,
    });
  } catch (error) {
    console.error('Recipe generation error:', error.message);
    res.status(500).json({ error: 'Failed to generate recipe', details: error.message });
  }
});

// Generate Recipe from Name Endpoint
app.post('/api/generate-from-name', getUserId, async (req, res) => {
  const { recipeName, language, servingSize } = req.body;
  if (!recipeName) return res.status(400).json({ error: 'Recipe name required' });

  const languageNames = {
    en: 'English',
    es: 'Spanish',
    fr: 'French',
    hi: 'Hindi',
  };
  const messages = [
    { role: 'system', content: 'You are a recipe generator. Return valid JSON in the specified language.' },
    {
      role: 'user',
      content: `
        Generate a recipe for "${recipeName}" for ${servingSize} servings.
        Provide a list of ingredients and detailed steps with optional times.
        Provide the recipe entirely in ${languageNames[language] || 'English'}, including ingredient names, instructions, and any descriptive text. Do not use English unless explicitly requested.
        Format as JSON: { "recipe": "name", "ingredients": ["item1", "item2", ...], "steps": [{"instruction": "...", "time": "X minutes" | null}] }
        Ensure ingredients are a simple string array, not objects. Ensure valid JSON with proper brackets.
      `,
    },
  ];

  try {
    const groqResponse = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    let recipeData;
    try {
      recipeData = JSON.parse(groqResponse.choices[0].message.content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message, 'Raw response:', groqResponse.choices[0].message.content);
      throw new Error('Invalid JSON response from Groq');
    }

    if (!recipeData.recipe || !Array.isArray(recipeData.ingredients) || !Array.isArray(recipeData.steps)) {
      throw new Error('Invalid recipe data structure');
    }

    const formattedSteps = recipeData.steps.map((step, index) => ({
      stepNumber: index + 1,
      instruction: step.instruction,
      time: step.time || null,
    }));

    const recipeId = new mongoose.Types.ObjectId().toString();
    const imageUrl = await getDishImage(recipeName, recipeId);

    const response = {
      recipe: recipeData.recipe,
      ingredients: recipeData.ingredients,
      steps: formattedSteps,
      imageUrl,
      recipeId,
    };

    const newRecipe = new Recipe({ userId: req.userId, ...req.body, ...response, _id: recipeId });
    await newRecipe.save();

    res.json(response);
  } catch (error) {
    console.error('Recipe name generation error:', error.message);
    res.status(500).json({ error: 'Failed to generate recipe', details: error.message });
  }
});

// Authentication Endpoints
app.post('/api/signup', async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    res.status(400).json({ error: 'User already exists' });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ userId: user._id });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));