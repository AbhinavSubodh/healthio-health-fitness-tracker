// controllers/consult.controller.js
const { Expert, Consultation, Message } = require('../models/consult.model');
const User = require('../models/user.model');
const mongoose = require('mongoose');

// Expert Controllers
exports.searchExperts = async (req, res) => {
  try {
    const { specialization, rating, language, availability } = req.query;

    let filter = { isVerified: true };

    if (specialization) {
      filter.specialization = { $regex: specialization, $options: 'i' };
    }

    if (rating) {
      filter.rating = { $gte: parseFloat(rating) };
    }

    if (language) {
      filter.languages = language;
    }

    if (availability) {
      const [day, time] = availability.split(',');
      filter['availability.day'] = day;
      filter['availability.slots.startTime'] = { $lte: time };
      filter['availability.slots.endTime'] = { $gte: time };
      filter['availability.slots.isBooked'] = false;
    }

    const experts = await Expert.find(filter)
      .populate('user', 'name email')
      .select('-availability.slots.isBooked');

    res.status(200).json(experts);
  } catch (error) {
    res.status(500).json({ message: 'Error searching experts', error: error.message });
  }
};

exports.getExpertDetails = async (req, res) => {
  try {
    const { expertId } = req.params;

    const expert = await Expert.findById(expertId)
      .populate('user', 'name email')
      .select('-availability.slots.isBooked');

    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    res.status(200).json(expert);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expert details', error: error.message });
  }
};

exports.getExpertAvailability = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { date } = req.query;

    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const dayAvailability = expert.availability.find(a => a.day === dayOfWeek);

    if (!dayAvailability) {
      return res.status(200).json({ available: false, slots: [] });
    }

    const bookedConsultations = await Consultation.find({
      expert: expertId,
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59, 999)
      },
      status: { $ne: 'cancelled' }
    }).select('startTime endTime');

    const availableSlots = dayAvailability.slots.filter(slot => {
      return !bookedConsultations.some(consultation => {
        return (
          (slot.startTime >= consultation.startTime && slot.startTime < consultation.endTime) ||
          (slot.endTime > consultation.startTime && slot.endTime <= consultation.endTime) ||
          (slot.startTime <= consultation.startTime && slot.endTime >= consultation.endTime)
        );
      }) && !slot.isBooked;
    });

    res.status(200).json({
      available: availableSlots.length > 0,
      slots: availableSlots
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching expert availability', error: error.message });
  }
};

exports.rateExpert = async (req, res) => {
  try {
    const { expertId } = req.params;
    const { consultationId, rating, review } = req.body;

    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    if (consultationId) {
      const consultation = await Consultation.findById(consultationId);
      if (!consultation || consultation.user.toString() !== req.userId) {
        return res.status(403).json({ message: 'Unauthorized or invalid consultation' });
      }

      consultation.rating = {
        value: rating,
        feedback: review,
        date: new Date()
      };
      await consultation.save();
    }

    const existingReviewIndex = expert.reviews.findIndex(r => r.user.toString() === req.userId);

    if (existingReviewIndex !== -1) {
      expert.reviews[existingReviewIndex].rating = rating;
      expert.reviews[existingReviewIndex].review = review;
      expert.reviews[existingReviewIndex].date = new Date();
    } else {
      expert.reviews.push({
        user: req.userId,
        rating,
        review,
        date: new Date()
      });
    }

    await expert.save();
    res.status(200).json({ message: 'Rating submitted successfully', expert });
  } catch (error) {
    res.status(500).json({ message: 'Error rating expert', error: error.message });
  }
};

// Consultation Controllers
exports.bookConsultation = async (req, res) => {
  try {
    const { expertId, date, startTime, endTime, consultationType, notes } = req.body;

    const expert = await Expert.findById(expertId);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const dayAvailability = expert.availability.find(a => a.day === dayOfWeek);

    if (!dayAvailability) {
      return res.status(400).json({ message: 'Expert is not available on this day' });
    }

    const isSlotAvailable = dayAvailability.slots.some(slot =>
      slot.startTime === startTime && slot.endTime === endTime && !slot.isBooked
    );

    if (!isSlotAvailable) {
      return res.status(400).json({ message: 'Selected time slot is not available' });
    }

    const existingConsultation = await Consultation.findOne({
      expert: expertId,
      date: {
        $gte: new Date(date).setHours(0, 0, 0, 0),
        $lt: new Date(date).setHours(23, 59, 59, 999)
      },
      startTime,
      endTime,
      status: { $ne: 'cancelled' }
    });

    if (existingConsultation) {
      return res.status(400).json({ message: 'This time slot is already booked' });
    }

    const consultation = new Consultation({
      user: req.userId,
      expert: expertId,
      date: new Date(date),
      startTime,
      endTime,
      consultationType,
      notes: { userNotes: notes },
      payment: {
        amount: expert.consultationFee,
        status: 'pending'
      },
      meetingLink: `https://healthio.com/meet/${new mongoose.Types.ObjectId()}`
    });

    await consultation.save();

    const slotIndex = dayAvailability.slots.findIndex(slot =>
      slot.startTime === startTime && slot.endTime === endTime
    );

    if (slotIndex !== -1) {
      dayAvailability.slots[slotIndex].isBooked = true;
      await expert.save();
    }

    res.status(201).json(consultation);
  } catch (error) {
    res.status(500).json({ message: 'Error booking consultation', error: error.message });
  }
};

exports.getUserConsultations = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = { user: req.userId };

    if (status) {
      filter.status = status;
    }

    const consultations = await Consultation.find(filter)
      .populate({
        path: 'expert',
        select: 'specialization rating',
        populate: {
          path: 'user',
          select: 'name profilePicture'
        }
      })
      .sort({ date: -1 });

    res.status(200).json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultations', error: error.message });
  }
};

exports.getExpertConsultations = async (req, res) => {
  try {
    const expert = await Expert.findOne({ user: req.userId });
    if (!expert) {
      return res.status(403).json({ message: 'User is not registered as an expert' });
    }

    const { status } = req.query;
    let filter = { expert: expert._id };

    if (status) {
      filter.status = status;
    }

    const consultations = await Consultation.find(filter)
      .populate('user', 'name profilePicture')
      .sort({ date: -1 });

    res.status(200).json(consultations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching consultations', error: error.message });
  }
};

exports.updateConsultationStatus = async (req, res) => {
  try {
    const { consultationId } = req.params;
    const { status, notes } = req.body;

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const expert = await Expert.findById(consultation.expert);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    const isUser = consultation.user.toString() === req.userId;
    const isExpert = expert.user.toString() === req.userId;

    if (!isUser && !isExpert) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    if (isExpert && notes) {
      consultation.notes.expertNotes = notes;
    }

    if (status === 'completed' && consultation.status !== 'completed') {
      expert.consultationCount += 1;
      await expert.save();
    }

    consultation.status = status;
    await consultation.save();

    res.status(200).json({ message: 'Consultation status updated', consultation });
  } catch (error) {
    res.status(500).json({ message: 'Error updating consultation status', error: error.message });
  }
};

// Message Controllers
exports.sendMessage = async (req, res) => {
  try {
    const { consultationId, content, attachments } = req.body;

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const expert = await Expert.findById(consultation.expert);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    const isUser = consultation.user.toString() === req.userId;
    const isExpert = expert.user.toString() === req.userId;

    if (!isUser && !isExpert) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const sender = req.userId;
    const receiver = isUser ? expert.user : consultation.user;

    const message = new Message({
      consultation: consultationId,
      sender,
      receiver,
      content,
      attachments
    });

    await message.save();
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message', error: error.message });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    const expert = await Expert.findById(consultation.expert);
    if (!expert) {
      return res.status(404).json({ message: 'Expert not found' });
    }

    const isUser = consultation.user.toString() === req.userId;
    const isExpert = expert.user.toString() === req.userId;

    if (!isUser && !isExpert) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const messages = await Message.find({ consultation: consultationId })
      .populate('sender', 'name profilePicture')
      .populate('receiver', 'name profilePicture')
      .sort({ timestamp: 1 });

    await Message.updateMany(
      { consultation: consultationId, receiver: req.userId, isRead: false },
      { isRead: true }
    );

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages', error: error.message });
  }
};
