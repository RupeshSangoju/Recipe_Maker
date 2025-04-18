const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  ingredients: [String],
  recipe: String,
  steps: [{ stepNumber: Number, instruction: String, time: String }],
  imageUrl: String,
  cookingStyle: String,
  servingSize: Number,
  language: String,
  difficultyMode: Boolean,
  theme: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Recipe', recipeSchema);