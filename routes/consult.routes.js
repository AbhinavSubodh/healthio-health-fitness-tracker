// routes/consult.routes.js
const express = require('express');
const consultController = require('../controllers/consult.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { Expert, Consultation, Message } = require('../models/consult.model');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Expert routes
router.get('/experts', consultController.searchExperts);
router.get('/experts/:expertId', consultController.getExpertDetails);
router.get('/experts/:expertId/availability', consultController.getExpertAvailability);
router.post('/experts/:expertId/rate', consultController.rateExpert);

// Consultation routes
router.post('/consultations', consultController.bookConsultation);
router.get('/consultations/user', consultController.getUserConsultations);
router.get('/consultations/expert', consultController.getExpertConsultations);
router.patch('/consultations/:consultationId', consultController.updateConsultationStatus);

// Message routes
router.post('/messages', consultController.sendMessage);
router.get('/messages/:consultationId', consultController.getMessages);

router.post('/expert', async (req, res) => {
    try {
        const expert = new Expert({
            user: req.user.id,
            specialization: req.body.specialization,
            qualifications: req.body.qualifications,
            experience: req.body.experience,
            bio: req.body.bio,
            hourlyRate: req.body.hourlyRate,
            availability: req.body.availability
        });
        await expert.save();
        res.status(201).json(expert);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/expert', async (req, res) => {
    try {
        const experts = await Expert.find().populate('user', 'username email');
        res.json(experts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/consultation', async (req, res) => {
    try {
        const consultation = new Consultation({
            user: req.user.id,
            expert: req.body.expert,
            date: req.body.date,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            type: req.body.type,
            userNotes: req.body.userNotes
        });
        await consultation.save();
        res.status(201).json(consultation);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/consultation', async (req, res) => {
    try {
        const consultations = await Consultation.find({ user: req.user.id }).populate('expert');
        res.json(consultations);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/message', async (req, res) => {
    try {
        const message = new Message({
            consultation: req.body.consultation,
            sender: req.user.id,
            content: req.body.content
        });
        await message.save();
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/message/:consultationId', async (req, res) => {
    try {
        const messages = await Message.find({ consultation: req.params.consultationId }).populate('sender', 'username');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;