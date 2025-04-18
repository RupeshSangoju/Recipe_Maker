require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Groq = require('groq-sdk');
const bcrypt = require('bcrypt');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const Recipe = require('./models/Recipe');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL||'http://localhost:3000',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-user-id'],
  credentials: true
}));
app.use(express.json());

// Serve static images from server/images/
app.use('/images', express.static(path.join(__dirname, 'images')));

// Create images folder if it doesn’t exist
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Initialize Groq
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// NEW: MongoDB collection for Colab URL
const urlCollection = mongoose.connection.collection('colab_urls');

// NEW: Cached COLAB_FLASK_URL
let COLAB_FLASK_URL = null;

// NEW: Fetch Colab URL from MongoDB
async function getColabUrl() {
  try {
    const urlDoc = await urlCollection.findOne({ type: 'colab_url' }, { sort: { timestamp: -1 } });
    return urlDoc ? urlDoc.ngrok_url : null;
  } catch (error) {
    console.error('Failed to fetch Colab URL from MongoDB:', error.message);
    return null;
  }
}

// NEW: Update COLAB_FLASK_URL and verify
async function updateColabUrl() {
  if (!COLAB_FLASK_URL) {
    COLAB_FLASK_URL = await getColabUrl();
    if (COLAB_FLASK_URL) {
      console.log(`Initialized COLAB_FLASK_URL to: ${COLAB_FLASK_URL}`);
    } else {
      console.log('Colab URL not found in MongoDB - waiting for Colab to start');
    }
  }
  try {
    const response = await axios.get(`${COLAB_FLASK_URL}/get-url`, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 5000
    });
    COLAB_FLASK_URL = response.data.ngrok_url;
    console.log(`Verified and updated COLAB_FLASK_URL to: ${COLAB_FLASK_URL}`);
  } catch (error) {
    console.error('Failed to verify Colab URL:', error.message);
    COLAB_FLASK_URL = null; // Reset if unreachable
  }
}

// Generate Image Function with Cache
async function getDishImage(description, recipeId) {
  const cachedRecipe = await Recipe.findOne({ _id: recipeId });
  if (cachedRecipe && cachedRecipe.imageUrl && cachedRecipe.imageUrl !== 'https://via.placeholder.com/300?text=Image+Failed') {
    return cachedRecipe.imageUrl;
  }

  await updateColabUrl();
  if (!COLAB_FLASK_URL) {
    console.error('No Colab URL available - using fallback');
    return 'https://via.placeholder.com/300?text=Image+Failed';
  }

  const prompt = `${description}, chaotic food art, vibrant colors, surreal style`;
  try {
    const response = await axios.post(`${COLAB_FLASK_URL}/generate-image`, {
      prompt,
      recipe_id: recipeId
    }, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 30000
    });

    const tempImageUrl = response.data.image_url;
    const imageResponse = await axios.get(tempImageUrl, {
      responseType: 'arraybuffer',
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    const imagePath = path.join(imagesDir, `${recipeId}.jpg`);
    fs.writeFileSync(imagePath, Buffer.from(imageResponse.data));
    const imageUrl = `http://localhost:${PORT}/images/${recipeId}.jpg`;
    return imageUrl;
  } catch (error) {
    console.error('Image generation error:', error.message);
    return 'https://via.placeholder.com/300?text=Image+Failed';
  }
}

// Middleware to get user ID
const getUserId = (req, res, next) => {
  req.userId = req.headers['x-user-id'];
  if (!req.userId) return res.status(401).json({ error: 'Unauthorized' });
  next();
};

// Signup Endpoint
app.post('/api/signup', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ error: 'Username or email taken' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword });
    await newUser.save();
    res.status(201).json({ message: 'User created', userId: newUser._id });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login Endpoint
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    res.json({ username: user.username, email: user.email, userId: user._id });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Generate Recipe Endpoint
app.post('/api/generate-recipe', getUserId, async (req, res) => {
  const { ingredients, difficultyMode, language, cookingStyle, servingSize, theme } = req.body;
  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return res.status(400).json({ error: 'Ingredients required' });
  }

  const tone = difficultyMode ? 'chaotic and humorous' : 'clear and concise';
  const messages = [
    { role: 'system', content: 'You are a recipe generator. Always return responses in JSON format.' },
    {
      role: 'user',
      content: `
        Generate a ${theme ? `${theme}-themed` : ''} ${cookingStyle} recipe for ${servingSize} servings using these ingredients: ${ingredients.join(', ')}.
        Provide a brief description, detailed steps with optional cooking times (e.g., "5 minutes"), and use a ${tone} tone.
        Return the response in ${language} (translate if not English).
        Format as: { "description": "...", "steps": [{"instruction": "...", "time": "X minutes"}] }
      `,
    },
  ];

  try {
    const groqResponse = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const parsedResponse = JSON.parse(groqResponse.choices[0].message.content);
    const { description, steps } = parsedResponse;
    if (!description || !steps || !Array.isArray(steps)) {
      throw new Error('Invalid Groq response');
    }

    const formattedSteps = steps.map((step, index) => ({
      stepNumber: index + 1,
      instruction: step.instruction,
      time: step.time || null,
    }));

    const recipeId = new mongoose.Types.ObjectId().toString();
    const imageUrl = await getDishImage(description, recipeId);

    const response = {
      recipe: description,
      steps: formattedSteps,
      imageUrl,
    };

    const newRecipe = new Recipe({ userId: req.userId, ...req.body, ...response, _id: recipeId });
    await newRecipe.save();

    res.json({ ...response, recipeId: newRecipe._id });
  } catch (error) {
    console.error('Recipe generation error:', error);
    res.status(500).json({ error: 'Failed to generate recipe', details: error.message });
  }
});

app.post('/api/generate-from-name', getUserId, async (req, res) => {
  const { recipeName, language, servingSize } = req.body;
  if (!recipeName) return res.status(400).json({ error: 'Recipe name required' });

  const messages = [
    { role: 'system', content: 'You are a recipe generator. Return JSON with ingredients and steps.' },
    {
      role: 'user',
      content: `
        Generate a recipe for "${recipeName}" for ${servingSize} servings.
        Provide a list of ingredients and detailed steps with optional times.
        Return in ${language} (translate if not English).
        Format as: { "ingredients": ["item1", ...], "steps": [{"instruction": "...", "time": "X minutes"}] }
      `,
    },
  ];

  try {
    const groqResponse = await groq.chat.completions.create({
      messages,
      model: 'llama3-8b-8192',
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const { ingredients, steps } = JSON.parse(groqResponse.choices[0].message.content);
    if (!ingredients || !steps) throw new Error('Invalid Groq response');

    const formattedSteps = steps.map((step, index) => ({
      stepNumber: index + 1,
      instruction: step.instruction,
      time: step.time || null,
    }));

    const recipeId = new mongoose.Types.ObjectId().toString();
    const imageUrl = await getDishImage(recipeName, recipeId);

    const response = {
      recipe: recipeName,
      ingredients,
      steps: formattedSteps,
      imageUrl,
    };

    const newRecipe = new Recipe({ userId: req.userId, ...req.body, ...response, _id: recipeId });
    await newRecipe.save();

    res.json({ ...response, recipeId });
  } catch (error) {
    console.error('Recipe name generation error:', error);
    res.status(500).json({ error: 'Failed to generate recipe', details: error.message });
  }
});

// Recipe History Endpoint
app.get('/api/recipes/history', getUserId, async (req, res) => {
  try {
    const recipes = await Recipe.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50);
    res.json(recipes);
  } catch (error) {
    console.error('History error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// Share Recipe Endpoint
app.get('/api/recipes/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ error: 'Recipe not found' });
    res.json({
      recipe: recipe.recipe,
      steps: recipe.steps,
      imageUrl: recipe.imageUrl,
      ingredients: recipe.ingredients,
    });
  } catch (error) {
    console.error('Share recipe error:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// Start Server 
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));