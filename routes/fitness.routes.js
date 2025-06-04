// routes/fitness.routes.js
const express = require('express');
const router = express.Router();
const { Exercise, Workout, WorkoutLog } = require('../models/fitness.model');
const auth = require('../middleware/auth.middleware');

router.post('/exercise', auth, async (req, res) => {
    try {
        const exercise = new Exercise({
            name: req.body.name,
            type: req.body.type,
            muscleGroup: req.body.muscleGroup,
            equipment: req.body.equipment,
            difficulty: req.body.difficulty,
            instructions: req.body.instructions,
            videoUrl: req.body.videoUrl
        });
        await exercise.save();
        res.status(201).json(exercise);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/exercise', async (req, res) => {
    try {
        const exercises = await Exercise.find().sort({ name: 1 });
        res.json(exercises);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/workout', auth, async (req, res) => {
    try {
        const workout = new Workout({
            user: req.user.id,
            name: req.body.name,
            type: req.body.type,
            exercises: req.body.exercises,
            duration: req.body.duration
        });
        await workout.save();
        res.status(201).json(workout);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/workout', auth, async (req, res) => {
    try {
        const workouts = await Workout.find({ user: req.user.id }).populate('exercises.exercise');
        res.json(workouts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/log', auth, async (req, res) => {
    try {
        const log = new WorkoutLog({
            user: req.user.id,
            workout: req.body.workout,
            date: req.body.date,
            exercises: req.body.exercises,
            duration: req.body.duration,
            notes: req.body.notes
        });
        await log.save();
        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/log', auth, async (req, res) => {
    try {
        const logs = await WorkoutLog.find({ user: req.user.id }).populate('workout exercises.exercise').sort({ date: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;