// models/consult.model.js
const mongoose = require('mongoose');

const expertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  specialization: { type: String, required: true },
  qualifications: [{ type: String }],
  certifications: [{
    name: { type: String },
    issuingBody: { type: String },
    year: { type: Number },
    expiryDate: { type: Date }
  }],
  experience: { type: Number }, // in years
  bio: { type: String },
  profilePicture: { type: String },
  hourlyRate: { type: Number, required: true },
  availability: [{
    day: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true }
  }],
  rating: { type: Number, default: 0 },
  reviews: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    rating: { type: Number, required: true },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  isVerified: { type: Boolean, default: false },
  languages: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const consultationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expert: { type: mongoose.Schema.Types.ObjectId, ref: 'Expert', required: true },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  status: { type: String, enum: ['scheduled', 'completed', 'cancelled'], default: 'scheduled' },
  type: { type: String, required: true },
  userNotes: { type: String },
  expertNotes: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const messageSchema = new mongoose.Schema({
  consultation: { type: mongoose.Schema.Types.ObjectId, ref: 'Consultation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

expertSchema.pre('save', function(next) {
  if (this.reviews && this.reviews.length > 0) {
    this.rating = this.reviews.reduce((sum, review) => sum + review.rating, 0) / this.reviews.length;
  }
  next();
});

const Expert = mongoose.model('Expert', expertSchema);
const Consultation = mongoose.model('Consultation', consultationSchema);
const Message = mongoose.model('Message', messageSchema);

module.exports = { Expert, Consultation, Message };