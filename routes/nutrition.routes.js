// routes/nutrition.routes.js
const express = require('express');
const nutritionController = require('../controllers/nutrition.controller');
const authMiddleware = require('../middleware/auth.middleware');
const NutritionLog = require('../models/nutrition.model');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Food Item routes
router.post('/food-items', nutritionController.createFoodItem);
router.get('/food-items', nutritionController.getFoodItems);

// Nutrition Log routes
router.post('/food', async (req, res) => {
    try {
        const foodItem = {
            name: req.body.name,
            calories: req.body.calories,
            protein: req.body.protein,
            carbs: req.body.carbs,
            fats: req.body.fats,
            servingSize: req.body.servingSize,
            servingUnit: req.body.servingUnit
        };

        const log = await NutritionLog.findOne({ user: req.user.id, date: req.body.date });
        if (log) {
            log.meals.push({
                type: req.body.mealType,
                items: [foodItem]
            });
            await log.save();
            res.json(log);
        } else {
            const newLog = new NutritionLog({
                user: req.user.id,
                date: req.body.date,
                meals: [{
                    type: req.body.mealType,
                    items: [foodItem]
                }]
            });
            await newLog.save();
            res.status(201).json(newLog);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/log', async (req, res) => {
    try {
        const logs = await NutritionLog.find({ user: req.user.id }).sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/water', async (req, res) => {
    try {
        const log = await NutritionLog.findOne({ user: req.user.id, date: req.body.date });
        if (log) {
            log.waterIntake = req.body.amount;
            await log.save();
            res.json(log);
        } else {
            const newLog = new NutritionLog({
                user: req.user.id,
                date: req.body.date,
                waterIntake: req.body.amount
            });
            await newLog.save();
            res.status(201).json(newLog);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;