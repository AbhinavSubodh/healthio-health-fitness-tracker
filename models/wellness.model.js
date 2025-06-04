// models/wellness.model.js
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { 
    name: { type: String, required: true },
    credentials: { type: String },
    profilePicture: { type: String }
  },
  category: { type: String, required: true },
  tags: [{ type: String }],
  publishDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date },
  featuredImage: { type: String },
  readTime: { type: Number }, // in minutes
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  views: { type: Number, default: 0 },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    content: { type: String },
    date: { type: Date, default: Date.now },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
  }],
  isVerified: { type: Boolean, default: false }
});

const challengeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  duration: { type: Number, required: true }, // in days
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  tasks: [{
    day: { type: Number },
    title: { type: String },
    description: { type: String },
    isCompleted: { type: Boolean, default: false }
  }],
  startDate: { type: Date },
  endDate: { type: Date },
  image: { type: String },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: true }
});

const userChallengeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challenge: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date },
  progress: { type: Number, default: 0 }, // percentage
  completedTasks: [{
    day: { type: Number },
    completedDate: { type: Date },
    notes: { type: String }
  }],
  status: { type: String, enum: ['active', 'completed', 'abandoned'], default: 'active' }
});

const meditationSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  duration: { type: Number, required: true }, // in minutes
  category: { type: String },
  audioUrl: { type: String, required: true },
  imageUrl: { type: String },
  tags: [{ type: String }],
  popularity: { type: Number, default: 0 },
  isPublic: { type: Boolean, default: true }
});

const userMeditationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  meditation: { type: mongoose.Schema.Types.ObjectId, ref: 'Meditation', required: true },
  date: { type: Date, default: Date.now },
  duration: { type: Number }, // actual duration in minutes
  completed: { type: Boolean, default: true },
  rating: { type: Number, min: 1, max: 5 },
  notes: { type: String }
});

const Article = mongoose.model('Article', articleSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);
const UserChallenge = mongoose.model('UserChallenge', userChallengeSchema);
const Meditation = mongoose.model('Meditation', meditationSchema);
const UserMeditation = mongoose.model('UserMeditation', userMeditationSchema);

module.exports = { Article, Challenge, UserChallenge, Meditation, UserMeditation };