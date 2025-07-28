import { Router } from 'express';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';
import { validateReport, validate } from '../middleware/validation.js';

const router = Router();

// @desc    Get all reports
// @route   GET /api/reports
// @access  Public
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      type,
      status,
      severity,
      city,
      lat,
      lng,
      radius = 10,
      page = 1,
      limit = 20,
      sort = '-reportedAt'
    } = req.query;

    // Build query
    let query = { isActive: true };

    if (type) query.type = type;
    if (status) query.status = status;
    if (severity) query.severity = severity;
    if (city) query['location.city'] = new RegExp(city, 'i');

    // Geospatial query
    if (lat && lng) {
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: radius * 1000 // Convert km to meters
        }
      };
    }

    // Execute query
    const reports = await Report.find(query)
      .populate('reportedBy', 'name avatar role')
      .populate('verifiedBy', 'name role')
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count
    const total = await Report.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: reports.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        reports
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single report
// @route   GET /api/reports/:id
// @access  Public
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const report = await findById(req.params.id)
      .populate('reportedBy', 'name avatar role')
      .populate('verifiedBy', 'name role')
      .populate('comments.user', 'name avatar')
      .populate('likes.user', 'name')
      .populate('votes.up.user', 'name')
      .populate('votes.down.user', 'name');

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Increment view count
    report.views += 1;
    
    // Add to viewed by if user is authenticated
    if (req.user) {
      const alreadyViewed = report.viewedBy.some(
        view => view.user.toString() === req.user.id
      );
      
      if (!alreadyViewed) {
        report.viewedBy.push({ user: req.user.id });
      }
    }

    await report.save();

    res.status(200).json({
      status: 'success',
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create new report
// @route   POST /api/reports
// @access  Private
router.post('/', protect, validateReport, validate, async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.reportedBy = req.user.id;

    // Generate title if not provided
    if (!req.body.title) {
      req.body.title = `${req.body.type.charAt(0).toUpperCase() + req.body.type.slice(1)} Report`;
    }

    const report = await create(req.body);

    // Populate the report
    await report.populate('reportedBy', 'name avatar role');

    // Award points to user
    await req.user.updatePoints(10);
    await req.user.updateStreak();

    // Create notifications for nearby users
    const nearbyUsers = await User.find({
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: req.body.location.coordinates
          },
          $maxDistance: 5000 // 5km
        }
      },
      _id: { $ne: req.user.id },
      notificationsEnabled: true,
      'notificationSettings.nearbyReports': true
    });

    // Send notifications
    for (const user of nearbyUsers) {
      await Notification.createNotification({
        recipient: user._id,
        sender: req.user.id,
        type: 'report_nearby',
        title: 'New Report Nearby',
        message: `${req.body.type} reported near your location`,
        data: {
          reportId: report._id,
          location: {
            type: 'Point',
            coordinates: req.body.location.coordinates
          }
        }
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update report
// @route   PUT /api/reports/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    let report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Make sure user is report owner or authority
    if (report.reportedBy.toString() !== req.user.id && 
        !['police', 'municipal'].includes(req.user.role)) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to update this report'
      });
    }

    report = await Report.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('reportedBy', 'name avatar role');

    res.status(200).json({
      status: 'success',
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete report
// @route   DELETE /api/reports/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    // Make sure user is report owner or authority
    if (report.reportedBy.toString() !== req.user.id && 
        !['police', 'municipal'].includes(req.user.role)) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to delete this report'
      });
    }

    await report.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Like/Unlike report
// @route   POST /api/reports/:id/like
// @access  Private
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    const alreadyLiked = report.likes.some(
      like => like.user.toString() === req.user.id
    );

    if (alreadyLiked) {
      await report.removeLike(req.user.id);
    } else {
      await report.addLike(req.user.id);
    }

    res.status(200).json({
      status: 'success',
      data: {
        liked: !alreadyLiked,
        likeCount: report.likeCount
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add comment to report
// @route   POST /api/reports/:id/comments
// @access  Private
router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    await report.comments(req.user.id, req.body.text);
    await report.populate('comments.user', 'name avatar');

    res.status(201).json({
      status: 'success',
      data: {
        comments: report.comments
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Vote on report
// @route   POST /api/reports/:id/vote
// @access  Private
router.post('/:id/vote', protect, async (req, res, next) => {
  try {
    const { voteType } = req.body; // 'up' or 'down'

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    await report.votes(req.user.id, voteType);

    res.status(200).json({
      status: 'success',
      data: {
        voteScore: report.voteScore,
        upVotes: report.votes.up.length,
        downVotes: report.votes.down.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Verify report (Authority only)
// @route   POST /api/reports/:id/verify
// @access  Private (Police/Municipal)
router.post('/:id/verify', protect, authorize('police', 'municipal'), async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }

    report.status = 'verified';
    report.verifiedBy = req.user.id;
    report.verifiedAt = new Date();
    
    await report.save();

    // Award bonus points to reporter
    const reporter = await Report.findById(report.reportedBy);
    if (reporter) {
      await reporter.updatePoints(5); // Bonus for verified report
      
      // Send notification to reporter
      await Notification.createNotification({
        recipient: reporter._id,
        sender: req.user.id,
        type: 'report_verified',
        title: 'Report Verified',
        message: 'Your report has been verified by authorities. +5 bonus points!',
        data: {
          reportId: report._id,
          points: 5
        }
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        report
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;