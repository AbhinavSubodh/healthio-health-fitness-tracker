const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema
const Schema = new mongoose.Schema({ input: mongoose.Schema.Types.Mixed }, { timestamps: true });
const Model = mongoose.model('SleepCycle', Schema);

// POST endpoint
router.post('/', async (req, res) => {
    try {
        const data = new Model({ input: req.body.sleepData });
        await data.save();

        // Dummy response
        res.json({ sleepScore: 76, tip: "Try to go to bed by 10 PM for better rest." });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
