// routes/gym.routes.js
const express = require('express');
const gymController = require('../controllers/gym.controller');
const authMiddleware = require('../middleware/auth.middleware');
const { Gym, Membership, Class, Booking, WorkoutBuddy } = require('../models/gym.models');

const router = express.Router();

// All routes are protected
router.use(authMiddleware);

// Gym routes
router.get('/search', gymController.searchGyms);
router.get('/:gymId', gymController.getGymDetails);
router.post('/:gymId/rate', gymController.rateGym);

// Membership routes
router.post('/memberships', gymController.addMembership);
router.get('/memberships', gymController.getUserMemberships);
router.post('/memberships/:membershipId/check-in', gymController.checkInToGym);
router.post('/memberships/:membershipId/check-out', gymController.checkOutFromGym);

// Class Booking routes
router.post('/classes/book', gymController.bookClass);
router.get('/classes/bookings', gymController.getUserClassBookings);
router.patch('/classes/bookings/:bookingId', gymController.updateBookingStatus);

router.post('/gym', async (req, res) => {
    try {
        const gym = new Gym({
            name: req.body.name,
            address: req.body.address,
            city: req.body.city,
            state: req.body.state,
            zipCode: req.body.zipCode,
            phone: req.body.phone,
            email: req.body.email,
            website: req.body.website,
            description: req.body.description,
            amenities: req.body.amenities,
            hours: req.body.hours,
            coordinates: req.body.coordinates
        });
        await gym.save();
        res.status(201).json(gym);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/gym', async (req, res) => {
    try {
        const gyms = await Gym.find().sort({ name: 1 });
        res.json(gyms);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/membership', async (req, res) => {
    try {
        const membership = new Membership({
            user: req.user.id,
            gym: req.body.gym,
            startDate: req.body.startDate,
            endDate: req.body.endDate,
            type: req.body.type,
            price: req.body.price,
            duration: req.body.duration
        });
        await membership.save();
        res.status(201).json(membership);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/membership', async (req, res) => {
    try {
        const memberships = await Membership.find({ user: req.user.id }).populate('gym');
        res.json(memberships);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/class', async (req, res) => {
    try {
        const class_ = new Class({
            gym: req.body.gym,
            name: req.body.name,
            description: req.body.description,
            instructor: req.body.instructor,
            capacity: req.body.capacity,
            duration: req.body.duration,
            schedule: req.body.schedule,
            price: req.body.price,
            photos: req.body.photos
        });
        await class_.save();
        res.status(201).json(class_);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/booking', async (req, res) => {
    try {
        const booking = new Booking({
            user: req.user.id,
            gym: req.body.gym,
            class: req.body.class,
            date: req.body.date,
            membershipId: req.body.membershipId
        });
        await booking.save();
        res.status(201).json(booking);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/booking', async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('gym class');
        res.json(bookings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;