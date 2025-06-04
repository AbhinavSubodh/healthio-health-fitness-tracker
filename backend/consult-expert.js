const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// Schema
const Schema = new mongoose.Schema({ input: mongoose.Schema.Types.Mixed }, { timestamps: true });
const Model = mongoose.model('ConsultExpert', Schema);

// POST endpoint
router.post('/', async (req, res) => {
    try {
        const data = new Model({ input: req.body.symptoms });
        await data.save();

        // Dummy response
        res.json({ expert: "Dr. Smith", availableSlots: ["10:30 AM", "1:00 PM", "3:45 PM"] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
