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
    const { timeframe = 'all', limit = 50 } = req.query;

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

    // Get users with their report counts
    const leaderboard = await User.aggregate([
      {
        $match: {
          role: 'citizen',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'reports',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$reportedBy', '$$userId'] },
                status: { $in: ['verified', 'resolved'] },
                ...dateFilter
              }
            }
          ],
          as: 'reports'
        }
      },
      {
        $addFields: {
          reportCount: { $size: '$reports' },
          verifiedReports: {
            $size: {
              $filter: {
                input: '$reports',
                cond: { $eq: ['$$this.status', 'verified'] }
              }
            }
          },
          accuracy: {
            $cond: {
              if: { $gt: [{ $size: '$reports' }, 0] },
              then: {
                $multiply: [
                  {
                    $divide: [
                      {
                        $size: {
                          $filter: {
                            input: '$reports',
                            cond: { $eq: ['$$this.status', 'verified'] }
                          }
                        }
                      },
                      { $size: '$reports' }
                    ]
                  },
                  100
                ]
              },
              else: 0
            }
          }
        }
      },
      {
        $project: {
          name: 1,
          avatar: 1,
          points: 1,
          badge: 1,
          level: 1,
          streak: 1,
          location: 1,
          joinDate: 1,
          reportCount: 1,
          verifiedReports: 1,
          accuracy: 1
        }
      },
      {
        $sort: { points: -1, reportCount: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // Add rank to each user
    const leaderboardWithRank = leaderboard.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    // Get current user's rank if authenticated
    let userRank = null;
    if (req.user && req.user.role === 'citizen') {
      const userPosition = leaderboardWithRank.findIndex(
        user => user._id.toString() === req.user.id
      );
      userRank = userPosition !== -1 ? userPosition + 1 : null;
    }

    res.status(200).json({
      status: 'success',
      data: {
        leaderboard: leaderboardWithRank,
        userRank,
        timeframe
      }
    });
  } catch (error) {
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
          verifiedReports: {
            $sum: {
              $cond: [{ $eq: ['$status', 'verified'] }, 1, 0]
            }
          },
          resolvedReports: {
            $sum: {
              $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0]
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
      verifiedReports: 0,
      resolvedReports: 0,
      totalLikes: 0,
      totalComments: 0,
      totalViews: 0
    };

    // Calculate accuracy
    stats.accuracy = stats.totalReports > 0 
      ? Math.round((stats.verifiedReports / stats.totalReports) * 100)
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
        points: 10,
        rarity: 'common'
      },
      {
        name: 'Speed Demon',
        description: 'Report 10 incidents in one day',
        icon: 'trending-up',
        points: 50,
        rarity: 'rare'
      },
      {
        name: 'Community Helper',
        description: 'Help 100 fellow commuters',
        icon: 'users',
        points: 100,
        rarity: 'epic'
      },
      {
        name: 'Perfect Week',
        description: '7 days of accurate reporting',
        icon: 'target',
        points: 75,
        rarity: 'rare'
      },
      {
        name: 'Local Guardian',
        description: 'Most reports in your area',
        icon: 'map-pin',
        points: 150,
        rarity: 'legendary'
      },
      {
        name: 'Streak Master',
        description: '30-day reporting streak',
        icon: 'calendar',
        points: 200,
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