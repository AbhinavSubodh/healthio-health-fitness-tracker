// models/sleep.model.js
const mongoose = require('mongoose');

const sleepLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  sleepTime: { type: Date, required: true },
  wakeTime: { type: Date, required: true },
  duration: { type: Number }, // in minutes, calculated
  quality: { type: Number, required: true, min: 1, max: 5 },
  deepSleepDuration: { type: Number }, // in minutes
  remSleepDuration: { type: Number }, // in minutes
  lightSleepDuration: { type: Number }, // in minutes
  awakeTime: { type: Number }, // in minutes
  sleepCycles: { type: Number },
  disturbances: [{
    time: { type: Date },
    duration: { type: Number }, // in minutes
    reason: { type: String }
  }],
  factors: {
    caffeine: { type: Boolean, default: false },
    alcohol: { type: Boolean, default: false },
    exercise: { type: Boolean, default: false },
    stress: { type: Number, min: 1, max: 10 },
    screenTime: { type: Boolean, default: false }
  },
  notes: { type: String }
});

const sleepGoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetDuration: { type: Number, required: true },
  targetBedtime: { type: String, required: true },
  targetWakeTime: { type: String, required: true },
  duration: { type: Number },
  notes: { type: String }
});

// Calculate sleep duration before saving
sleepLogSchema.pre('save', function(next) {
  const sleepTime = new Date(this.sleepTime);
  const wakeTime = new Date(this.wakeTime);
  let duration = (wakeTime - sleepTime) / (1000 * 60);

  if (wakeTime < sleepTime) {
    duration += 24 * 60;
  }

  this.duration = duration;
  next();
});

const SleepLog = mongoose.model('SleepLog', sleepLogSchema);
const SleepGoal = mongoose.model('SleepGoal', sleepGoalSchema);

module.exports = { SleepLog, SleepGoal };