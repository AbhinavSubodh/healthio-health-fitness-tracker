const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema
const Schema = new mongoose.Schema({ input: mongoose.Schema.Types.Mixed }, { timestamps: true });
const Model = mongoose.model('FitnessZone', Schema);

// POST endpoint
router.post('/', async (req, res) => {
    try {
        const data = new Model({ input: req.body.goal });
        await data.save();

        // Dummy response
        res.json({ workoutPlan: ["Push-ups", "Jumping jacks", "Squats"], duration: "30 mins" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
