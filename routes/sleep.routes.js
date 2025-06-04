// routes/sleep.routes.js
const express = require('express');
const sleepController = require('../controllers/sleep.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { SleepLog, SleepGoal } = require('../models/sleep.model');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

router.post('/log', async (req, res) => {
    try {
        const log = new SleepLog({
            user: req.user.id,
            date: req.body.date,
            sleepTime: req.body.sleepTime,
            wakeTime: req.body.wakeTime,
            quality: req.body.quality,
            deepSleepDuration: req.body.deepSleepDuration,
            remSleepDuration: req.body.remSleepDuration,
            lightSleepDuration: req.body.lightSleepDuration,
            awakeTime: req.body.awakeTime,
            notes: req.body.notes
        });
        await log.save();
        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/log', async (req, res) => {
    try {
        const logs = await SleepLog.find({ user: req.user.id }).sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/goal', async (req, res) => {
    try {
        const goal = new SleepGoal({
            user: req.user.id,
            targetDuration: req.body.targetDuration,
            targetBedtime: req.body.targetBedtime,
            targetWakeTime: req.body.targetWakeTime,
            notes: req.body.notes
        });
        await goal.save();
        res.status(201).json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/goal', async (req, res) => {
    try {
        const goal = await SleepGoal.findOne({ user: req.user.id });
        res.json(goal);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;