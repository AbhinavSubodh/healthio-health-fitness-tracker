const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema
const Schema = new mongoose.Schema({ input: mongoose.Schema.Types.Mixed }, { timestamps: true });
const Model = mongoose.model('WellnessHub', Schema);

// POST endpoint
router.post('/', async (req, res) => {
    try {
        const data = new Model({ input: req.body.userStats });
        await data.save();

        // Dummy response
        res.json({ wellnessScore: 82, advice: "Stay hydrated and reduce screen time." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
