// controllers/wellness.controller.js
const { Article, Challenge, UserChallenge, Meditation, UserMeditation } = require('../models/wellness.model');

// Article Controllers
exports.getArticles = async (req, res) => {
  try {
    const { category, tag, query, limit, page } = req.query;
    let filter = { isVerified: true };
    
    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (query) filter.title = { $regex: query, $options: 'i' };
    
    const pageSize = parseInt(limit) || 10;
    const currentPage = parseInt(page) || 1;
    const skip = (currentPage - 1) * pageSize;
    
    const articles = await Article.find(filter)
      .select('title summary author category tags publishDate featuredImage readTime likes views')
      .sort({ publishDate: -1 })
      .skip(skip)
      .limit(pageSize);
      
    const totalArticles = await Article.countDocuments(filter);
    
    res.status(200).json({
      articles,
      currentPage,
      totalPages: Math.ceil(totalArticles / pageSize),
      totalArticles
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching articles', error: error.message });
  }
};

exports.getArticleById = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Increment view count
    article.views += 1;
    await article.save();
    
    res.status(200).json(article);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching article', error: error.message });
  }
};

exports.likeArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Check if user already liked the article
    const alreadyLiked = article.likes.includes(req.userId);
    
    if (alreadyLiked) {
      // Unlike
      article.likes = article.likes.filter(id => id.toString() !== req.userId);
    } else {
      // Like
      article.likes.push(req.userId);
    }
    
    await article.save();
    res.status(200).json({ 
      message: alreadyLiked ? 'Article unliked' : 'Article liked',
      likes: article.likes.length
    });
  } catch (error) {
    res.status(500).json({ message: 'Error liking article', error: error.message });
  }
};

exports.commentOnArticle = async (req, res) => {
  try {
    const { articleId } = req.params;
    const { content } = req.body;
    
    const article = await Article.findById(articleId);
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    
    // Add comment
    article.comments.push({
      user: req.userId,
      content,
      date: new Date()
    });
    
    await article.save();
    
    // Populate user info for the new comment
    const populatedArticle = await Article.findById(articleId)
      .populate('comments.user', 'name profilePicture');
      
    res.status(201).json({
      message: 'Comment added successfully',
      comments: populatedArticle.comments
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding comment', error: error.message });
  }
};

// Challenge Controllers
exports.getChallenges = async (req, res) => {
  try {
    const { category, difficulty, query } = req.query;
    let filter = { isPublic: true };
    
    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (query) filter.name = { $regex: query, $options: 'i' };
    
    const challenges = await Challenge.find(filter)
      .select('name description category duration difficulty image participants')
      .sort({ participants: -1 });
      
    res.status(200).json(challenges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenges', error: error.message });
  }
};

exports.getChallengeById = async (req, res) => {
  try {
    const { challengeId } = req.params;
    
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Check if user is participating
    const userChallenge = await UserChallenge.findOne({
      user: req.userId,
      challenge: challengeId
    });
    
    res.status(200).json({
      challenge,
      userParticipation: userChallenge ? {
        startDate: userChallenge.startDate,
        progress: userChallenge.progress,
        status: userChallenge.status
      } : null
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching challenge', error: error.message });
  }
};

exports.joinChallenge = async (req, res) => {
  try {
    const { challengeId } = req.params;
    
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Check if user is already participating
    const existingParticipation = await UserChallenge.findOne({
      user: req.userId,
      challenge: challengeId,
      status: { $ne: 'abandoned' }
    });
    
    if (existingParticipation) {
      return res.status(400).json({ message: 'User is already participating in this challenge' });
    }
    
    // Calculate end date
    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + challenge.duration);
    
    // Create user challenge
    const userChallenge = new UserChallenge({
      user: req.userId,
      challenge: challengeId,
      startDate,
      endDate
    });
    
    await userChallenge.save();
    
    // Add user to challenge participants
    if (!challenge.participants.includes(req.userId)) {
      challenge.participants.push(req.userId);
      await challenge.save();
    }
    
    res.status(201).json({
      message: 'Successfully joined challenge',
      userChallenge
    });
  } catch (error) {
    res.status(500).json({ message: 'Error joining challenge', error: error.message });
  }
};

exports.updateChallengeProgress = async (req, res) => {
  try {
    const { challengeId } = req.params;
    const { taskDay, completed, notes } = req.body;
    
    // Find user's challenge participation
    const userChallenge = await UserChallenge.findOne({
      user: req.userId,
      challenge: challengeId
    });
    
    if (!userChallenge) {
      return res.status(404).json({ message: 'User is not participating in this challenge' });
    }
    
    // Get the challenge to check task validity
    const challenge = await Challenge.findById(challengeId);
    if (!challenge) {
      return res.status(404).json({ message: 'Challenge not found' });
    }
    
    // Validate task day
    if (taskDay < 1 || taskDay > challenge.duration) {
      return res.status(400).json({ message: 'Invalid task day' });
    }
    
    // Check if task is already completed
    const taskIndex = userChallenge.completedTasks.findIndex(task => task.day === taskDay);
    
    if (completed) {
      // Mark task as completed
      if (taskIndex === -1) {
        userChallenge.completedTasks.push({
          day: taskDay,
          completedDate: new Date(),
          notes
        });
      } else {
        // Update existing task
        userChallenge.completedTasks[taskIndex].notes = notes;
      }
    } else {
      // Remove task from completed tasks
      if (taskIndex !== -1) {
        userChallenge.completedTasks.splice(taskIndex, 1);
      }
    }
    
    // Update progress
    userChallenge.progress = (userChallenge.completedTasks.length / challenge.duration) * 100;
    
    // Check if challenge is completed
    if (userChallenge.progress === 100) {
      userChallenge.status = 'completed';
    }
    
    await userChallenge.save();
    
    res.status(200).json({
      message: 'Challenge progress updated',
      userChallenge
    });
  } catch (error) {
    res.status(500).json({ message: 'Error updating challenge progress', error: error.message });
  }
};

exports.getUserChallenges = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = { user: req.userId };
    
    if (status) {
      filter.status = status;
    }
    
    const userChallenges = await UserChallenge.find(filter)
      .populate('challenge', 'name description category duration difficulty image')
      .sort({ startDate: -1 });
      
    res.status(200).json(userChallenges);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user challenges', error: error.message });
  }
};

// Meditation Controllers
exports.getMeditations = async (req, res) => {
  try {
    const { category, duration, query } = req.query;
    let filter = { isPublic: true };
    
    if (category) filter.category = category;
    if (duration) {
      if (duration === 'short') filter.duration = { $lte: 10 };
      else if (duration === 'medium') filter.duration = { $gt: 10, $lte: 20 };
      else if (duration === 'long') filter.duration = { $gt: 20 };
    }
    if (query) filter.title = { $regex: query, $options: 'i' };
    
    const meditations = await Meditation.find(filter)
      .sort({ popularity: -1 });
      
    res.status(200).json(meditations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meditations', error: error.message });
  }
};

exports.getMeditationById = async (req, res) => {
  try {
    const { meditationId } = req.params;
    
    const meditation = await Meditation.findById(meditationId);
    if (!meditation) {
      return res.status(404).json({ message: 'Meditation not found' });
    }
    
    // Increment popularity
    meditation.popularity += 1;
    await meditation.save();
    
    res.status(200).json(meditation);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching meditation', error: error.message });
  }
};

exports.logMeditation = async (req, res) => {
  try {
    const { meditationId } = req.params;
    const { duration, completed, rating, notes } = req.body;
    
    const meditation = await Meditation.findById(meditationId);
    if (!meditation) {
      return res.status(404).json({ message: 'Meditation not found' });
    }
    
    // Log meditation session
    const userMeditation = new UserMeditation({
      user: req.userId,
      meditation: meditationId,
      duration,
      completed,
      rating,
      notes
    });
    
    await userMeditation.save();
    
    res.status(201).json({
      message: 'Meditation session logged successfully',
      userMeditation
    });
  } catch (error) {
    res.status(500).json({ message: 'Error logging meditation session', error: error.message });
  }
};

exports.getUserMeditations = async (req, res) => {
  try {
    const userMeditations = await UserMeditation.find({ user: req.userId })
      .populate('meditation', 'title description duration category imageUrl')
      .sort({ date: -1 });
      
    res.status(200).json(userMeditations);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user meditations', error: error.message });
  }
};

exports.getMeditationStats = async (req, res) => {
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
    
    const userMeditations = await UserMeditation.find({
      user: req.userId,
      date: { $gte: startDate }
    }).populate('meditation', 'title category');
    
    // Calculate statistics
    const stats = {
      totalSessions: userMeditations.length,
      totalMinutes: 0,
      averageDuration: 0,
      completionRate: 0,
      favoriteCategories: {},
      sessionsByDay: {},
      streakDays: 0
    };
    
    if (userMeditations.length > 0) {
      // Process meditation sessions
      let completedSessions = 0;
      const sessionDates = new Set();
      
      userMeditations.forEach(session => {
        // Total minutes
        stats.totalMinutes += session.duration || 0;
        
        // Completed sessions
        if (session.completed) {
          completedSessions++;
        }
        
        // Favorite categories
        if (session.meditation && session.meditation.category) {
          const category = session.meditation.category;
          stats.favoriteCategories[category] = (stats.favoriteCategories[category] || 0) + 1;
        }
        
        // Sessions by day
        const dateStr = session.date.toISOString().split('T')[0];
        sessionDates.add(dateStr);
        stats.sessionsByDay[dateStr] = (stats.sessionsByDay[dateStr] || 0) + 1;
      });
      
      // Calculate averages and rates
      stats.averageDuration = stats.totalMinutes / userMeditations.length;
      stats.completionRate = (completedSessions / userMeditations.length) * 100;
      
      // Calculate streak
      const sortedDates = Array.from(sessionDates).sort();
      let currentStreak = 1;
      let maxStreak = 1;
      
      for (let i = 1; i < sortedDates.length; i++) {
        const prevDate = new Date(sortedDates[i-1]);
        const currDate = new Date(sortedDates[i]);
        
        // Check if dates are consecutive
        prevDate.setDate(prevDate.getDate() + 1);
        if (prevDate.toISOString().split('T')[0] === sortedDates[i]) {
          currentStreak++;
          maxStreak = Math.max(maxStreak, currentStreak);
        } else {
          currentStreak = 1;
        }
      }
      
      stats.streakDays = maxStreak;
    }
    
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error generating meditation stats', error: error.message });
  }
};