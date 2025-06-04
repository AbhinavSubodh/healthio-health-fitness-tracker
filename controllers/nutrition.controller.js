// controllers/nutrition.controller.js
const { FoodItem, NutritionLog } = require('../models/nutrition.model');

// Food Item Controllers
exports.createFoodItem = async (req, res) => {
  try {
    const foodItem = new FoodItem(req.body);
    await foodItem.save();
    res.status(201).json(foodItem);
  } catch (error) {
    res.status(500).json({ message: 'Error creating food item', error: error.message });
  }
};

exports.getFoodItems = async (req, res) => {
  try {
    const { category, query } = req.query;
    let filter = {};
    
    if (category) filter.category = category;
    if (query) filter.name = { $regex: query, $options: 'i' };
    
    const foodItems = await FoodItem.find(filter);
    res.status(200).json(foodItems);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching food items', error: error.message });
  }
};

// Nutrition Log Controllers
exports.createNutritionLog = async (req, res) => {
  try {
    const { date, meals, waterIntake, dailyGoals, notes } = req.body;
    
    // Check if log already exists for this date
    let nutritionLog = await NutritionLog.findOne({ 
      user: req.userId, 
      date: { 
        $gte: new Date(date).setHours(0,0,0,0), 
        $lt: new Date(date).setHours(23,59,59,999) 
      } 
    });
    
    if (nutritionLog) {
      // Update existing log
      nutritionLog.meals = meals || nutritionLog.meals;
      nutritionLog.waterIntake = waterIntake || nutritionLog.waterIntake;
      nutritionLog.dailyGoals = dailyGoals || nutritionLog.dailyGoals;
      nutritionLog.notes = notes || nutritionLog.notes;
    } else {
      // Create new log
      nutritionLog = new NutritionLog({
        user: req.userId,
        date,
        meals,
        waterIntake,
        dailyGoals,
        notes
      });
    }
    
    await nutritionLog.save();
    res.status(201).json(nutritionLog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating nutrition log', error: error.message });
  }
};

exports.getNutritionLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { user: req.userId };
    
    if (startDate && endDate) {
      filter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    const nutritionLogs = await NutritionLog.find(filter)
      .populate('meals.foods.foodItem')
      .sort({ date: -1 });
      
    res.status(200).json(nutritionLogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching nutrition logs', error: error.message });
  }
};

exports.getNutritionSummary = async (req, res) => {
  try {
    const { period } = req.query; // 'week', 'month', 'year'
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const logs = await NutritionLog.find({
      user: req.userId,
      date: { $gte: startDate }
    }).populate('meals.foods.foodItem');
    
    // Calculate averages and totals
    const summary = {
      averageCalories: 0,
      averageProtein: 0,
      averageCarbs: 0,
      averageFat: 0,
      averageWaterIntake: 0,
      daysTracked: logs.length,
      goalAchievementRate: 0
    };
    
    if (logs.length > 0) {
      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0, totalWater = 0;
      let goalsMet = 0;
      
      logs.forEach(log => {
        let dailyCalories = 0, dailyProtein = 0, dailyCarbs = 0, dailyFat = 0;
        
        log.meals.forEach(meal => {
          dailyCalories += meal.totalCalories || 0;
          dailyProtein += meal.totalProtein || 0;
          dailyCarbs += meal.totalCarbs || 0;
          dailyFat += meal.totalFat || 0;
        });
        
        totalCalories += dailyCalories;
        totalProtein += dailyProtein;
        totalCarbs += dailyCarbs;
        totalFat += dailyFat;
        totalWater += log.waterIntake || 0;
        
        // Check if daily goals were met
        if (log.dailyGoals) {
          if (
            dailyCalories <= (log.dailyGoals.calories || Infinity) &&
            dailyProtein >= (log.dailyGoals.protein || 0) &&
            dailyCarbs <= (log.dailyGoals.carbs || Infinity) &&
            dailyFat <= (log.dailyGoals.fat || Infinity) &&
            log.waterIntake >= (log.dailyGoals.water || 0)
          ) {
            goalsMet++;
          }
        }
      });
      
      summary.averageCalories = totalCalories / logs.length;
      summary.averageProtein = totalProtein / logs.length;
      summary.averageCarbs = totalCarbs / logs.length;
      summary.averageFat = totalFat / logs.length;
      summary.averageWaterIntake = totalWater / logs.length;
      summary.goalAchievementRate = (goalsMet / logs.length) * 100;
    }
    
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Error generating nutrition summary', error: error.message });
  }
};