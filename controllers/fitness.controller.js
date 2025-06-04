// controllers/fitness.controller.js
const { Exercise, Workout, WorkoutLog } = require('../models/fitness.model');

// Exercise Controllers
exports.createExercise = async (req, res) => {
  try {
    const exercise = new Exercise(req.body);
    await exercise.save();
    res.status(201).json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Error creating exercise', error: error.message });
  }
};

exports.getExercises = async (req, res) => {
  try {
    const { type, muscleGroup, difficulty, equipment, query } = req.query;
    let filter = {};
    
    if (type) filter.type = type;
    if (muscleGroup) filter.muscleGroups = muscleGroup;
    if (difficulty) filter.difficulty = difficulty;
    if (equipment) filter.equipment = equipment;
    if (query) filter.name = { $regex: query, $options: 'i' };
    
    const exercises = await Exercise.find(filter);
    res.status(200).json(exercises);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exercises', error: error.message });
  }
};

// Workout Controllers
exports.createWorkout = async (req, res) => {
  try {
    const workout = new Workout({
      ...req.body,
      createdBy: req.userId
    });
    await workout.save();
    res.status(201).json(workout);
  } catch (error) {
    res.status(500).json({ message: 'Error creating workout', error: error.message });
  }
};

exports.getWorkouts = async (req, res) => {
  try {
    const { difficulty, duration, query } = req.query;
    let filter = { $or: [{ isPublic: true }, { createdBy: req.userId }] };
    
    if (difficulty) filter.difficulty = difficulty;
    if (duration) {
      if (duration === 'short') filter.duration = { $lte: 30 };
      else if (duration === 'medium') filter.duration = { $gt: 30, $lte: 60 };
      else if (duration === 'long') filter.duration = { $gt: 60 };
    }
    if (query) filter.name = { $regex: query, $options: 'i' };
    
    const workouts = await Workout.find(filter)
      .populate('exercises.exercise')
      .populate('createdBy', 'name');
      
    res.status(200).json(workouts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workouts', error: error.message });
  }
};

// Workout Log Controllers
exports.logWorkout = async (req, res) => {
  try {
    const workoutLog = new WorkoutLog({
      ...req.body,
      user: req.userId
    });
    await workoutLog.save();
    res.status(201).json(workoutLog);
  } catch (error) {
    res.status(500).json({ message: 'Error logging workout', error: error.message });
  }
};

exports.getWorkoutLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { user: req.userId };
    
    if (startDate && endDate) {
      filter.date = { 
        $gte: new Date(startDate), 
        $lte: new Date(endDate) 
      };
    }
    
    const workoutLogs = await WorkoutLog.find(filter)
      .populate('workout')
      .populate('completedExercises.exercise')
      .sort({ date: -1 });
      
    res.status(200).json(workoutLogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching workout logs', error: error.message });
  }
};

exports.getFitnessStats = async (req, res) => {
  try {
    const { period } = req.query; // 'week', 'month', 'year'
    
    let startDate = new Date();
    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate.setFullYear(startDate.getFullYear() - 1);
    }
    
    const logs = await WorkoutLog.find({
      user: req.userId,
      date: { $gte: startDate }
    });
    
    // Calculate statistics
    const stats = {
      totalWorkouts: logs.length,
      totalDuration: 0,
      totalCaloriesBurned: 0,
      workoutsByType: {},
      averageDuration: 0,
      averageCaloriesBurned: 0,
      mostFrequentExercises: [],
      progressByExercise: {}
    };
    
    if (logs.length > 0) {
      // Process workout logs
      const exerciseCounts = {};
      const exerciseProgress = {};
      
      logs.forEach(log => {
        stats.totalDuration += log.duration || 0;
        stats.totalCaloriesBurned += log.caloriesBurned || 0;
        
        // Count workout types
        if (log.workout && log.workout.tags) {
          log.workout.tags.forEach(tag => {
            stats.workoutsByType[tag] = (stats.workoutsByType[tag] || 0) + 1;
          });
        }
        
        // Track exercise frequency and progress
        log.completedExercises.forEach(ex => {
          const exId = ex.exercise.toString();
          exerciseCounts[exId] = (exerciseCounts[exId] || 0) + 1;
          
          // Track progress for strength exercises
          if (ex.sets && ex.sets.length > 0) {
            if (!exerciseProgress[exId]) {
              exerciseProgress[exId] = {
                name: ex.exercise.name,
                dates: [],
                weights: [],
                reps: []
              };
            }
            
            // Calculate average weight and reps for this session
            let totalWeight = 0, totalReps = 0;
            ex.sets.forEach(set => {
              totalWeight += set.weight || 0;
              totalReps += set.reps || 0;
            });
            
            const avgWeight = totalWeight / ex.sets.length;
            const avgReps = totalReps / ex.sets.length;
            
            exerciseProgress[exId].dates.push(log.date);
            exerciseProgress[exId].weights.push(avgWeight);
            exerciseProgress[exId].reps.push(avgReps);
          }
        });
      });
      
      // Calculate averages
      stats.averageDuration = stats.totalDuration / logs.length;
      stats.averageCaloriesBurned = stats.totalCaloriesBurned / logs.length;
      
      // Get most frequent exercises
      stats.mostFrequentExercises = Object.entries(exerciseCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id, count]) => ({ exerciseId: id, count }));
      
      // Format progress data
      stats.progressByExercise = exerciseProgress;
    }
    
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error generating fitness stats', error: error.message });
  }
};