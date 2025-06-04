// models/nutrition.model.js
const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, required: true },
  fats: { type: Number, required: true },
  fiber: { type: Number },
  sugar: { type: Number },
  servingSize: { type: String, required: true },
  servingUnit: { type: String, required: true },
  category: { type: String }
});

const mealSchema = new mongoose.Schema({
  type: { type: String, required: true, enum: ['breakfast', 'lunch', 'dinner', 'snack'] },
  items: [foodItemSchema],
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFats: { type: Number, default: 0 }
});

const nutritionLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  meals: [mealSchema],
  waterIntake: { type: Number, default: 0 }, // in ml
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFats: { type: Number, default: 0 },
  dailyGoals: {
    calories: { type: Number },
    protein: { type: Number },
    carbs: { type: Number },
    fats: { type: Number },
    water: { type: Number }
  },
  notes: { type: String }
}, { timestamps: true });

// Calculate meal totals before saving
nutritionLogSchema.pre('save', function(next) {
  this.totalCalories = this.meals.reduce((sum, meal) => sum + meal.totalCalories, 0);
  this.totalProtein = this.meals.reduce((sum, meal) => sum + meal.totalProtein, 0);
  this.totalCarbs = this.meals.reduce((sum, meal) => sum + meal.totalCarbs, 0);
  this.totalFats = this.meals.reduce((sum, meal) => sum + meal.totalFats, 0);
  next();
});

const FoodItem = mongoose.model('FoodItem', foodItemSchema);
const NutritionLog = mongoose.model('NutritionLog', nutritionLogSchema);

module.exports = { FoodItem, NutritionLog };