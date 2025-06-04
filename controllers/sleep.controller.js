// controllers/sleep.controller.js
const { SleepLog } = require('../models/sleep.model');

exports.createSleepLog = async (req, res) => {
  try {
    const sleepLog = new SleepLog({
      ...req.body,
      user: req.userId
    });
    await sleepLog.save();
    res.status(201).json(sleepLog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating sleep log', error: error.message });
  }
};

exports.getSleepLogs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let filter = { user: req.userId };

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const sleepLogs = await SleepLog.find(filter).sort({ date: -1 });
    res.status(200).json(sleepLogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching sleep logs', error: error.message });
  }
};

exports.getSleepStats = async (req, res) => {
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

    const logs = await SleepLog.find({
      user: req.userId,
      date: { $gte: startDate }
    });

    const stats = {
      totalSleepLogs: logs.length,
      averageDuration: 0,
      averageQuality: 0,
      averageBedTime: null,
      averageWakeTime: null,
      sleepEfficiency: 0,
      sleepDebtHours: 0,
      sleepQualityTrend: [],
      factorCorrelations: {
        caffeine: 0,
        alcohol: 0,
        exercise: 0,
        stress: 0,
        screenTime: 0
      }
    };

    if (logs.length > 0) {
      let totalDuration = 0, totalQuality = 0;
      let totalDeepSleep = 0, totalRemSleep = 0, totalLightSleep = 0, totalAwake = 0;
      let bedTimeSum = 0, wakeTimeSum = 0;

      const qualityWithFactors = {
        caffeine: { withFactor: [], withoutFactor: [] },
        alcohol: { withFactor: [], withoutFactor: [] },
        exercise: { withFactor: [], withoutFactor: [] },
        screenTime: { withFactor: [], withoutFactor: [] }
      };
      const qualityWithStress = [];

      logs.forEach(log => {
        totalDuration += log.duration || 0;
        totalQuality += log.quality || 0;
        totalDeepSleep += log.deepSleepDuration || 0;
        totalRemSleep += log.remSleepDuration || 0;
        totalLightSleep += log.lightSleepDuration || 0;
        totalAwake += log.awakeTime || 0;

        const bedTime = new Date(log.bedTime);
        const wakeTime = new Date(log.wakeTime);
        bedTimeSum += bedTime.getHours() + bedTime.getMinutes() / 60;
        wakeTimeSum += wakeTime.getHours() + wakeTime.getMinutes() / 60;

        stats.sleepQualityTrend.push({
          date: log.date,
          quality: log.quality || 0,
          duration: log.duration || 0
        });

        if (log.factors) {
          for (const factor of ['caffeine', 'alcohol', 'exercise', 'screenTime']) {
            if (log.factors[factor] !== undefined) {
              log.factors[factor]
                ? qualityWithFactors[factor].withFactor.push(log.quality || 0)
                : qualityWithFactors[factor].withoutFactor.push(log.quality || 0);
            }
          }

          if (log.factors.stress !== undefined) {
            qualityWithStress.push({
              stress: log.factors.stress,
              quality: log.quality || 0
            });
          }
        }
      });

      stats.averageDuration = totalDuration / logs.length;
      stats.averageQuality = totalQuality / logs.length;

      const avgBedTimeHours = (bedTimeSum / logs.length) % 24;
      const avgWakeTimeHours = (wakeTimeSum / logs.length) % 24;

      const avgBedTimeHour = Math.floor(avgBedTimeHours);
      const avgBedTimeMinute = Math.round((avgBedTimeHours - avgBedTimeHour) * 60);
      stats.averageBedTime = `${avgBedTimeHour.toString().padStart(2, '0')}:${avgBedTimeMinute.toString().padStart(2, '0')}`;

      const avgWakeTimeHour = Math.floor(avgWakeTimeHours);
      const avgWakeTimeMinute = Math.round((avgWakeTimeHours - avgWakeTimeHour) * 60);
      stats.averageWakeTime = `${avgWakeTimeHour.toString().padStart(2, '0')}:${avgWakeTimeMinute.toString().padStart(2, '0')}`;

      const totalSleepTime = totalDeepSleep + totalRemSleep + totalLightSleep;
      const totalTimeInBed = totalSleepTime + totalAwake;
      stats.sleepEfficiency = totalTimeInBed > 0 ? (totalSleepTime / totalTimeInBed) * 100 : 0;

      const recommendedSleep = 8 * 60 * logs.length;
      stats.sleepDebtHours = (recommendedSleep - totalDuration) / 60;

      for (const factor in qualityWithFactors) {
        const withFactor = qualityWithFactors[factor].withFactor;
        const withoutFactor = qualityWithFactors[factor].withoutFactor;

        if (withFactor.length > 0 && withoutFactor.length > 0) {
          const avgWith = withFactor.reduce((sum, val) => sum + val, 0) / withFactor.length;
          const avgWithout = withoutFactor.reduce((sum, val) => sum + val, 0) / withoutFactor.length;

          stats.factorCorrelations[factor] = ((avgWith - avgWithout) / avgWithout) * 100;
        }
      }

      if (qualityWithStress.length > 0) {
        const n = qualityWithStress.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;

        qualityWithStress.forEach(item => {
          sumX += item.stress;
          sumY += item.quality;
          sumXY += item.stress * item.quality;
          sumX2 += item.stress ** 2;
          sumY2 += item.quality ** 2;
        });

        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumX2 - sumX ** 2) * (n * sumY2 - sumY ** 2));

        if (denominator !== 0) {
          stats.factorCorrelations.stress = (numerator / denominator) * 100;
        }
      }
    }

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Error generating sleep stats', error: error.message });
  }
};
