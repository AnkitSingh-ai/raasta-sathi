import { Router } from 'express';
import User from '../models/User.js';
import Report from '../models/Report.js';
import { protect, optionalAuth } from '../middleware/auth.js';

const router = Router();

// @desc    Get leaderboard
// @route   GET /api/leaderboard
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { timeframe = 'all', limit = 100 } = req.query;

    let dateFilter = {};
    
    if (timeframe === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeframe === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { $gte: monthAgo } };
    } else if (timeframe === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      dateFilter = { createdAt: { $gte: yearAgo } };
    }

    // Get total users count
    const totalUsers = await User.countDocuments({ role: 'citizen', isActive: true });

    // Get all users first
    const users = await User.find({ role: 'citizen', isActive: true })
      .select('_id name avatar points badge level streak location joinDate')
      .lean();

    // Get all reports for the timeframe
    const reports = await Report.find(dateFilter)
      .select('reportedBy status photo photos createdAt')
      .lean();

    // Group reports by user
    const reportsByUser = {};
    reports.forEach(report => {
      const userId = report.reportedBy.toString();
      if (!reportsByUser[userId]) {
        reportsByUser[userId] = [];
      }
      reportsByUser[userId].push(report);
    });

    // Calculate points for each user
    const leaderboard = users.map(user => {
      const userReports = reportsByUser[user._id.toString()] || [];
      const reportCount = userReports.length;
      
      // Calculate points
      let calculatedPoints = reportCount * 10; // Base points
      
      // Bonus for resolved reports
      const resolvedReports = userReports.filter(r => r.status === 'Resolved').length;
      calculatedPoints += resolvedReports * 5;
      
      // Bonus for reports with photos
      const reportsWithPhotos = userReports.filter(r => 
        r.photo || (r.photos && r.photos.length > 0)
      ).length;
      calculatedPoints += reportsWithPhotos * 2;
      
      // Calculate accuracy
      const accuracy = reportCount > 0 ? Math.round((resolvedReports / reportCount) * 100) : 0;
      
      return {
        _id: user._id,
        name: user.name || 'Anonymous User',
        avatar: user.avatar || '👤',
        points: Math.max(calculatedPoints, user.points || 0),
        badge: user.badge || 'New Reporter',
        level: user.level || 1,
        streak: user.streak || 0,
        location: user.location || 'Location not set',
        joinDate: user.joinDate,
        reportCount,
        accuracy,
        calculatedPoints
      };
    });

    // Sort by points
    leaderboard.sort((a, b) => b.points - a.points);

    // Add ranks
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // Get current user's rank if authenticated
    let userRank = null;
    let currentUserData = null;
    if (req.user && req.user.role === 'citizen') {
      const userPosition = leaderboardWithRank.findIndex(
        user => user._id.toString() === req.user.id
      );
      
      if (userPosition !== -1) {
        userRank = userPosition + 1;
        currentUserData = leaderboardWithRank[userPosition];
      }
    }

    // Apply limit
    const limitedLeaderboard = leaderboardWithRank.slice(0, parseInt(limit));

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard: limitedLeaderboard,
        userRank: currentUserData,
        timeframe,
        totalUsers: totalUsers
      }
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    next(error);
  }
});

// @desc    Get user statistics
// @route   GET /api/leaderboard/stats/:userId
// @access  Public
router.get('/stats/:userId', async (req, res, next) => {
  try {
    const user = await User.findById(req.params.userId)
      .select('name avatar points badge level streak location joinDate role');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (user.role !== 'citizen') {
      return res.status(400).json({
        status: 'error',
        message: 'Statistics only available for citizens'
      });
    }

    // Get report statistics
    const reportStats = await Report.aggregate([
      {
        $match: {
          reportedBy: user._id
        }
      },
      {
        $group: {
          _id: null,
          totalReports: { $sum: 1 },
          resolvedReports: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0]
            }
          },
          fakeReports: {
            $sum: {
              $cond: [{ $eq: ['$status', 'Fake Report'] }, 1, 0]
            }
          },
          totalLikes: { $sum: { $size: '$likes' } },
          totalComments: { $sum: { $size: '$comments' } },
          totalViews: { $sum: '$views' }
        }
      }
    ]);

    const stats = reportStats[0] || {
      totalReports: 0,
      resolvedReports: 0,
      fakeReports: 0,
      totalLikes: 0,
      totalComments: 0,
      totalViews: 0
    };

    // Calculate accuracy based on resolved reports / total reports
    stats.accuracy = stats.totalReports > 0 
      ? Math.round((stats.resolvedReports / stats.totalReports) * 100)
      : 0;

    // Get recent reports
    const recentReports = await Report.find({ reportedBy: user._id })
      .select('type title status reportedAt likes comments')
      .sort('-reportedAt')
      .limit(5);

    res.status(200).json({
      status: 'success',
      data: {
        user,
        stats,
        recentReports
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get achievements
// @route   GET /api/leaderboard/achievements
// @access  Public
router.get('/achievements', async (req, res, next) => {
  try {
    const achievements = [
      {
        name: 'First Report',
        description: 'Submit your first traffic report',
        icon: 'star',
        rarity: 'common'
      },
      {
        name: 'Speed Demon',
        description: 'Report 10 incidents in one day',
        icon: 'trending-up',
        rarity: 'rare'
      },
      {
        name: 'Community Helper',
        description: 'Help 100 fellow commuters',
        icon: 'users',
        rarity: 'epic'
      },
      {
        name: 'Perfect Week',
        description: '7 days of accurate reporting',
        icon: 'target',
        rarity: 'rare'
      },
      {
        name: 'Local Guardian',
        description: 'Most reports in your area',
        icon: 'map-pin',
        rarity: 'legendary'
      },
      {
        name: 'Streak Master',
        description: '30-day reporting streak',
        icon: 'calendar',
        rarity: 'legendary'
      }
    ];

    res.status(200).json({
      status: 'success',
      data: {
        achievements
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;