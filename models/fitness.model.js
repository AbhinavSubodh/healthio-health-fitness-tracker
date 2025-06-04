// models/fitness.model.js
const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['cardio', 'strength', 'flexibility', 'balance'], required: true },
  muscleGroups: [{ type: String }],
  description: { type: String },
  instructions: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'] },
  equipment: [{ type: String }],
  imageUrl: { type: String },
  videoUrl: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const workoutSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'all levels'] },
  duration: { type: Number }, // in minutes
  caloriesBurned: { type: Number },
  exercises: [{
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    sets: { type: Number },
    reps: { type: Number },
    duration: { type: Number }, // in seconds
    restTime: { type: Number }, // in seconds
    notes: { type: String }
  }],
  tags: [{ type: String }],
  imageUrl: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isPublic: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const workoutLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workout: { type: mongoose.Schema.Types.ObjectId, ref: 'Workout' },
  date: { type: Date, default: Date.now },
  duration: { type: Number }, // in minutes
  caloriesBurned: { type: Number },
  completedExercises: [{
    exercise: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
    sets: [{ 
      weight: { type: Number },
      reps: { type: Number },
      completed: { type: Boolean, default: true }
    }],
    duration: { type: Number }, // for cardio exercises
    distance: { type: Number }, // for cardio exercises
    notes: { type: String }
  }],
  rating: { type: Number, min: 1, max: 5 },
  notes: { type: String },
  feelingScore: { type: Number, min: 1, max: 10 },
  createdAt: { type: Date, default: Date.now }
});

const Exercise = mongoose.model('Exercise', exerciseSchema);
const Workout = mongoose.model('Workout', workoutSchema);
const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

module.exports = { Exercise, Workout, WorkoutLog };