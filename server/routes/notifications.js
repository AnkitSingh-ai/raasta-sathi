import { Router } from 'express';
import Notification from '../models/Notification.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    let query = { recipient: req.user.id };
    
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .populate('sender', 'name avatar')
      .populate('data.reportId', 'type title')
      .populate('data.serviceRequestId', 'serviceType status')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    res.status(200).json({
      status: 'success',
      results: notifications.length,
      unreadCount,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        notifications
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
router.put('/:id/read', protect, async (req, res, next) => {
  try {
    const notification = await findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    await notification.markAsRead();

    res.status(200).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
router.put('/read-all', protect, async (req, res, next) => {
  try {
    await updateMany(
      { recipient: req.user.id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    res.status(200).json({
      status: 'success',
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const notification = await findOne({
      _id: req.params.id,
      recipient: req.user.id
    });

    if (!notification) {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }

    await notification.deleteOne();

    res.status(200).json({
      status: 'success',
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create notification (Admin/System)
// @route   POST /api/notifications
// @access  Private (Municipal)
router.post('/', protect, async (req, res, next) => {
  try {
    // Only allow municipal authorities to create system notifications
    if (req.user.role !== 'municipal') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to create notifications'
      });
    }

    const notification = await NotificationcreateNotification({
      ...req.body,
      sender: req.user.id
    });

    res.status(201).json({
      status: 'success',
      data: {
        notification
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;