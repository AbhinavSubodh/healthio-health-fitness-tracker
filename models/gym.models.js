// models/gym.model.js
const mongoose = require('mongoose');

const gymSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, required: true }
  },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  contactInfo: {
    phone: { type: String },
    email: { type: String },
    website: { type: String }
  },
  hours: [{
    day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
    open: { type: String },
    close: { type: String }
  }],
  amenities: [{ type: String }],
  classes: [{
    name: { type: String },
    description: { type: String },
    instructor: { type: String },
    schedule: [{
      day: { type: String },
      time: { type: String },
      duration: { type: Number } // in minutes
    }]
  }],
  membershipOptions: [{
    name: { type: String },
    price: { type: Number },
    duration: { type: String }, // 'monthly', 'yearly', etc.
    features: [{ type: String }]
  }],
  ratings: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, min: 1, max: 5 },
    review: { type: String },
    date: { type: Date, default: Date.now }
  }],
  averageRating: { type: Number, default: 0 },
  photos: [{ type: String }], // URLs to photos
  verified: { type: Boolean, default: false }
});

const membershipSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
  membershipType: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
  membershipId: { type: String }, // ID provided by the gym
  paymentInfo: {
    amount: { type: Number },
    frequency: { type: String },
    lastPayment: { type: Date },
    nextPayment: { type: Date }
  },
  checkIns: [{
    date: { type: Date, default: Date.now },
    duration: { type: Number } // in minutes
  }]
});

const gymClassBookingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  gym: { type: mongoose.Schema.Types.ObjectId, ref: 'Gym', required: true },
  class: {
    name: { type: String, required: true },
    instructor: { type: String },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    duration: { type: Number } // in minutes
  },
  status: { type: String, enum: ['booked', 'attended', 'cancelled', 'missed'], default: 'booked' },
  bookingDate: { type: Date, default: Date.now },
  notes: { type: String }
});

// Create index for geospatial queries
gymSchema.index({ location: '2dsphere' });

// Calculate average rating when a new rating is added
gymSchema.pre('save', function(next) {
  if (this.ratings && this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, rating) => sum + rating.rating, 0);
    this.averageRating = totalRating / this.ratings.length;
  }
  next();
});

const Gym = mongoose.model('Gym', gymSchema);
const Membership = mongoose.model('Membership', membershipSchema);
const GymClassBooking = mongoose.model('GymClassBooking', gymClassBookingSchema);

module.exports = { Gym, Membership, GymClassBooking };