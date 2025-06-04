// controllers/gym.controller.js
const { Gym, Membership, GymClassBooking } = require('../models/gym.model');

// Gym Controllers
exports.searchGyms = async (req, res) => {
  try {
    const { lat, lng, radius, amenities, classes, rating } = req.query;
    
    let filter = {};
    
    // Geospatial search if coordinates provided
    if (lat && lng && radius) {
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseFloat(radius) * 1000 // Convert km to meters
        }
      };
    }
    
    // Filter by amenities
    if (amenities) {
      const amenitiesList = amenities.split(',');
      filter.amenities = { $all: amenitiesList };
    }
    
    // Filter by classes
    if (classes) {
      const classesList = classes.split(',');
      filter['classes.name'] = { $in: classesList };
    }
    
    // Filter by minimum rating
    if (rating) {
      filter.averageRating = { $gte: parseFloat(rating) };
    }
    
    const gyms = await Gym.find(filter)
      .select('name address location contactInfo hours amenities classes averageRating photos');
      
    res.status(200).json(gyms);
  } catch (error) {
    res.status(500).json({ message: 'Error searching gyms', error: error.message });
  }
};

exports.getGymDetails = async (req, res) => {
  try {
    const { gymId } = req.params;
    
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }
    
    res.status(200).json(gym);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gym details', error: error.message });
  }
};

exports.rateGym = async (req, res) => {
  try {
    const { gymId } = req.params;
    const { rating, review } = req.body;
    
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }
    
    // Check if user already rated this gym
    const existingRatingIndex = gym.ratings.findIndex(r => r.user.toString() === req.userId);
    
    if (existingRatingIndex !== -1) {
      // Update existing rating
      gym.ratings[existingRatingIndex].rating = rating;
      gym.ratings[existingRatingIndex].review = review;
      gym.ratings[existingRatingIndex].date = new Date();
    } else {
      // Add new rating
      gym.ratings.push({
        user: req.userId,
        rating,
        review,
        date: new Date()
      });
    }
    
    await gym.save();
    res.status(200).json({ message: 'Rating submitted successfully', gym });
  } catch (error) {
    res.status(500).json({ message: 'Error rating gym', error: error.message });
  }
};

// Membership Controllers
exports.addMembership = async (req, res) => {
  try {
    const { gymId, membershipType, startDate, endDate, membershipId, paymentInfo } = req.body;
    
    // Check if gym exists
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }
    
    // Check if user already has an active membership at this gym
    const existingMembership = await Membership.findOne({
      user: req.userId,
      gym: gymId,
      status: 'active'
    });
    
    if (existingMembership) {
      return res.status(400).json({ message: 'User already has an active membership at this gym' });
    }
    
    // Create new membership
    const membership = new Membership({
      user: req.userId,
      gym: gymId,
      membershipType,
      startDate,
      endDate,
      membershipId,
      paymentInfo
    });
    
    await membership.save();
    res.status(201).json(membership);
  } catch (error) {
    res.status(500).json({ message: 'Error adding membership', error: error.message });
  }
};

exports.getUserMemberships = async (req, res) => {
  try {
    const memberships = await Membership.find({ user: req.userId })
      .populate('gym', 'name address contactInfo')
      .sort({ startDate: -1 });
      
    res.status(200).json(memberships);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching memberships', error: error.message });
  }
};

exports.checkInToGym = async (req, res) => {
  try {
    const { membershipId } = req.params;
    
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    
    if (membership.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    if (membership.status !== 'active') {
      return res.status(400).json({ message: 'Membership is not active' });
    }
    
    // Add check-in
    membership.checkIns.push({
      date: new Date(),
      duration: 0 // Duration will be updated on check-out
    });
    
    await membership.save();
    res.status(200).json({ message: 'Checked in successfully', membership });
  } catch (error) {
    res.status(500).json({ message: 'Error checking in', error: error.message });
  }
};

exports.checkOutFromGym = async (req, res) => {
  try {
    const { membershipId } = req.params;
    const { duration } = req.body;
    
    const membership = await Membership.findById(membershipId);
    if (!membership) {
      return res.status(404).json({ message: 'Membership not found' });
    }
    
    if (membership.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Update the duration of the latest check-in
    if (membership.checkIns.length > 0) {
      const latestCheckIn = membership.checkIns[membership.checkIns.length - 1];
      latestCheckIn.duration = duration;
      
      await membership.save();
      res.status(200).json({ message: 'Checked out successfully', membership });
    } else {
      res.status(400).json({ message: 'No check-in found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking out', error: error.message });
  }
};

// Class Booking Controllers
exports.bookClass = async (req, res) => {
  try {
    const { gymId, className, instructor, date, time, duration } = req.body;
    
    // Check if gym exists
    const gym = await Gym.findById(gymId);
    if (!gym) {
      return res.status(404).json({ message: 'Gym not found' });
    }
    
    // Check if user has an active membership
    const membership = await Membership.findOne({
      user: req.userId,
      gym: gymId,
      status: 'active'
    });
    
    if (!membership) {
      return res.status(400).json({ message: 'User does not have an active membership at this gym' });
    }
    
    // Create booking
    const booking = new GymClassBooking({
      user: req.userId,
      gym: gymId,
      class: {
        name: className,
        instructor,
        date,
        time,
        duration
      }
    });
    
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error booking class', error: error.message });
  }
};

exports.getUserClassBookings = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = { user: req.userId };
    
    if (status) {
      filter.status = status;
    }
    
    const bookings = await GymClassBooking.find(filter)
      .populate('gym', 'name address')
      .sort({ 'class.date': 1 });
      
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching bookings', error: error.message });
  }
};

exports.updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;
    
    const booking = await GymClassBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    if (booking.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    booking.status = status;
    await booking.save();
    
    res.status(200).json({ message: 'Booking status updated', booking });
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status', error: error.message });
  }
};