const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema
const Schema = new mongoose.Schema({ input: mongoose.Schema.Types.Mixed }, { timestamps: true });
const Model = mongoose.model('GymConnect', Schema);

// POST endpoint
router.post('/', async (req, res) => {
    try {
        const data = new Model({ input: req.body.userId });
        await data.save();

        // Dummy response
        res.json({ gymsNearby: ["FitZone Gym", "MuscleForge", "HealthFirst Club"] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
