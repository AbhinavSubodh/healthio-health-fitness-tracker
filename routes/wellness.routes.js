// routes/wellness.routes.js
const express = require('express');
const wellnessController = require('../controllers/wellness.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { Article, Challenge, MeditationSession, MoodLog } = require('../models/wellness.model');

const router = express.Router();

// Public routes
router.get('/articles', wellnessController.getArticles);
router.get('/articles/:articleId', wellnessController.getArticleById);
router.get('/challenges', wellnessController.getChallenges);
router.get('/challenges/:challengeId', wellnessController.getChallengeById);
router.get('/meditations', wellnessController.getMeditations);
router.get('/meditations/:meditationId', wellnessController.getMeditationById);

// Protected routes
router.use(authMiddleware);

// Article interaction routes
router.post('/articles/:articleId/like', wellnessController.likeArticle);
router.post('/articles/:articleId/comment', wellnessController.commentOnArticle);

// Challenge routes
router.post('/challenges/:challengeId/join', wellnessController.joinChallenge);
router.patch('/challenges/:challengeId/progress', wellnessController.updateChallengeProgress);
router.get('/user/challenges', wellnessController.getUserChallenges);

// Meditation routes
router.post('/meditations/:meditationId/log', wellnessController.logMeditation);
router.get('/user/meditations', wellnessController.getUserMeditations);
router.get('/user/meditation-stats', wellnessController.getMeditationStats);

router.post('/mood', async (req, res) => {
    try {
        const log = new MoodLog({
            user: req.user.id,
            mood: req.body.mood,
            notes: req.body.notes,
            activities: req.body.activities,
            duration: req.body.duration
        });
        await log.save();
        res.status(201).json(log);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/mood', async (req, res) => {
    try {
        const logs = await MoodLog.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;