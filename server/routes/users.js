import { Router } from 'express';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/auth.js';
import { upload } from '../middleware/cloudinary.js';
import fs from 'fs';
import cloudinary from '../config/cloudinary.js';
import { recalculateAllUserPoints, recalculateUserPoints } from '../utils/recalculateUserPoints.js';

const router = Router();

// @desc    Get all users (Admin only)
// @route   GET /api/users
// @access  Private (Municipal)
router.get('/', protect, authorize('municipal'), async (req, res, next) => {
  try {
    const { role, page = 1, limit = 20 } = req.query;

    let query = { isActive: true };
    if (role) query.role = role;

    const users = await User.find(query)
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

    const providers = await User.find(query)
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

// @desc    Update user profile photo
// @route   PUT /api/users/profile-photo
// @access  Private
router.put('/profile-photo', protect, upload.single('avatar'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Please upload a photo'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'profile-photos',
      width: 300,
      height: 300,
      crop: 'fill',
      quality: 'auto'
    });

    // Update user avatar
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: result.secure_url },
      { new: true, runValidators: true }
    ).select('-password');

    // Delete local file
    if (req.file.path) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      status: 'success',
      message: 'Profile photo updated successfully',
      data: {
        user
      }
    });
  } catch (error) {
    // Delete local file if upload failed
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
});

// @desc    Update user points (for achievements)
// @route   POST /api/users/update-points
// @access  Private
router.post('/update-points', protect, async (req, res, next) => {
  try {
    const { points } = req.body;

    if (!points || typeof points !== 'number' || points <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid points value is required'
      });
    }

    // Update user points using the model method
    await req.user.updatePoints(points);

    res.status(200).json({
      status: 'success',
      message: 'Points updated successfully',
      data: {
        points: req.user.points,
        level: req.user.level,
        badge: req.user.badge
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user achievements
// @route   POST /api/users/update-achievements
// @access  Private
router.post('/update-achievements', protect, async (req, res, next) => {
  try {
    const { achievements } = req.body;

    if (!achievements || !Array.isArray(achievements)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid achievements array is required'
      });
    }

    // Get current user achievements
    const currentAchievements = req.user.achievements || [];
    const currentAchievementNames = currentAchievements.map(ach => ach.name);

    // Add new achievements that don't already exist
    const newAchievements = achievements.filter(achName => !currentAchievementNames.includes(achName));
    
    if (newAchievements.length > 0) {
      // Add new achievements to the user
      const achievementsToAdd = newAchievements.map(name => ({
        name: name,
        earnedAt: new Date()
      }));
      
      req.user.achievements.push(...achievementsToAdd);
      await req.user.save();
    }

    res.status(200).json({
      status: 'success',
      message: 'Achievements updated successfully',
      data: {
        achievements: req.user.achievements,
        newAchievements: newAchievements
      }
    });
  } catch (error) {
    next(error);
  }
});



// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
  try {
    const { name, email, contactNumber, location, notificationSettings } = req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (contactNumber) updateData.contactNumber = contactNumber;
    if (location) updateData.location = location;
    if (notificationSettings) updateData.notificationSettings = notificationSettings;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      status: 'success',
      message: 'Profile updated successfully',
      data: {
        user
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

// @desc    Recalculate all user points (Admin only)
// @route   POST /api/users/recalculate-points
// @access  Private (Admin)
router.post('/recalculate-points', protect, authorize('admin'), async (req, res, next) => {
  try {
    console.log('🔄 Admin triggered points recalculation...');
    
    const result = await recalculateAllUserPoints();
    
    res.status(200).json({
      status: 'success',
      message: 'User points recalculated successfully',
      data: result
    });
  } catch (error) {
    console.error('❌ Failed to recalculate user points:', error);
    next(error);
  }
});

// @desc    Recalculate specific user points (Admin only)
// @route   POST /api/users/:userId/recalculate-points
// @access  Private (Admin)
router.post('/:userId/recalculate-points', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 Admin triggered points recalculation for user ${userId}...`);
    
    const result = await recalculateUserPoints(userId);
    
    res.status(200).json({
      status: 'success',
      message: 'User points recalculated successfully',
      data: result
    });
  } catch (error) {
    console.error(`❌ Failed to recalculate points for user ${req.params.userId}:`, error);
    next(error);
  }
});

export default router;