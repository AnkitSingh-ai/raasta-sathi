import { Router } from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Municipal)
router.get('/', protect, authorize('municipal'), async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    let query = { isActive: true };
    if (role) query.role = role;

    const users = await find(query)
      .select('-password')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: users.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        users
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user profile
// @route   GET /api/users/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('totalReports');

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user notification settings
// @route   PUT /api/users/notifications
// @access  Private
router.put('/notifications', protect, async (req, res, next) => {
  try {
    const { notificationSettings, notificationsEnabled, notificationsPaused } = req.body;

    const updateData = {};
    if (notificationSettings) updateData.notificationSettings = notificationSettings;
    if (typeof notificationsEnabled === 'boolean') updateData.notificationsEnabled = notificationsEnabled;
    if (typeof notificationsPaused === 'boolean') updateData.notificationsPaused = notificationsPaused;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update service provider availability
// @route   PUT /api/users/availability
// @access  Private (Service Providers)
router.put('/availability', protect, authorize('service_provider'), async (req, res, next) => {
  try {
    const { isAvailable } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { isAvailable },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get nearby service providers
// @route   GET /api/users/providers/nearby
// @access  Private
router.get('/providers/nearby', protect, async (req, res, next) => {
  try {
    const { lat, lng, serviceType, radius = 15 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        status: 'error',
        message: 'Latitude and longitude are required'
      });
    }

    let query = {
      role: 'service_provider',
      isAvailable: true,
      isActive: true
    };

    if (serviceType) {
      query.serviceType = serviceType;
    }

    // Add geospatial query
    query['location.coordinates'] = {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [parseFloat(lng), parseFloat(lat)]
        },
        $maxDistance: radius * 1000 // Convert km to meters
      }
    };

    const providers = await find(query)
      .select('name businessName serviceType rating completedServices contactNumber location')
      .limit(20);

    res.status(200).json({
      status: 'success',
      results: providers.length,
      data: {
        providers
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add achievement to user
// @route   POST /api/users/achievements
// @access  Private
router.post('/achievements', protect, async (req, res, next) => {
  try {
    const { achievementName } = req.body;

    // Check if user already has this achievement
    const hasAchievement = req.user.achievements.some(
      achievement => achievement.name === achievementName
    );

    if (hasAchievement) {
      return res.status(400).json({
        status: 'error',
        message: 'Achievement already earned'
      });
    }

    req.user.achievements.push({ name: achievementName });
    await req.user.save();

    res.status(201).json({
      status: 'success',
      data: {
        achievements: req.user.achievements
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;