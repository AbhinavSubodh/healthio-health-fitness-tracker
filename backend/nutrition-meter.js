const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema
const Schema = new mongoose.Schema({ input: mongoose.Schema.Types.Mixed }, { timestamps: true });
const Model = mongoose.model('NutritionMeter', Schema);

// POST endpoint
router.post('/', async (req, res) => {
    try {
        const data = new Model({ input: req.body.foodItems });
        await data.save();

        // Dummy response
        res.json({ calories: 450, protein: '20g', carbs: '50g', fat: '15g' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
