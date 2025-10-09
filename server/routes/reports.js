import { Router } from 'express';
import Report from '../models/Report.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, optionalAuth, authorize } from '../middleware/auth.js';
import { validateReport, validate } from '../middleware/validation.js';
import { checkDatabaseReady } from '../middleware/databaseReady.js';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';
import fs from 'fs';
import path from 'path';

const router = Router();

// Configure Cloudinary storage for file uploads
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'raasta-sathi', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 800, height: 600, crop: 'limit' }, // Resize images
      { quality: 'auto:good' } // Optimize quality
    ]
  }
});

// Create a completely new multer configuration
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Allow up to 5 files
  }
}).any(); // Accept any field names to handle both 'photo' and 'photos'

// Create new report
router.post(
  '/',
  protect,
  (req, res, next) => {
    console.log('📸 Multer upload middleware called');
    console.log('📸 Request headers:', req.headers);
    console.log('📸 Request body before multer:', req.body);
    console.log('📸 Content-Type header:', req.headers['content-type']);
    console.log('📸 Multer configuration:', upload);
    
    upload(req, res, (err) => {
      console.log('📸 Multer callback executed');
      if (err) {
        console.error('📸 Multer error occurred:', err);
        console.error('📸 Error type:', err.constructor.name);
        console.error('📸 Error message:', err.message);
        console.error('📸 Error stack:', err.stack);
        
        if (err instanceof multer.MulterError) {
          console.error('📸 Multer error:', err);
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              status: 'error',
              message: 'File size too large. Maximum size is 10MB.'
            });
          }
          return res.status(400).json({
            status: 'error',
            message: 'File upload error: ' + err.message
          });
        } else {
          return res.status(400).json({
            status: 'error',
            message: 'File upload error: ' + err.message
          });
        }
      }
      
      console.log('📸 Multer upload successful');
      console.log('📸 Request files after multer:', req.files);
      console.log('📸 Request body after multer:', req.body);
      console.log('📸 Request files type:', typeof req.files);
      console.log('📸 Request files length:', req.files ? req.files.length : 'undefined');
      next();
    });
  },
  async (req, res, next) => {
    try {
      console.log('📝 Report creation started');
      console.log('User:', req.user._id);
      console.log('Request body:', req.body);
      console.log('Request files:', req.files);
      console.log('Request headers:', req.headers);
      
      // Check if user is restricted from reporting
      if (!req.user.canReport()) {
        const restrictionEndDate = req.user.restrictionEndDate;
        const daysLeft = Math.ceil((restrictionEndDate - new Date()) / (1000 * 60 * 60 * 24));
        
        return res.status(403).json({
          status: 'error',
          message: `You are restricted from posting new reports because of fake reports for ${daysLeft} more day(s).`,
          restrictionDetails: {
            isRestricted: true,
            reason: req.user.restrictionReason,
            restrictionStartDate: req.user.restrictionStartDate,
            restrictionEndDate: req.user.restrictionEndDate,
            daysLeft: daysLeft
          }
        });
      }
      
      // Handle location data (either JSON string, nested fields, or simple fields)
      if (req.body.location && typeof req.body.location === 'string') {
        try {
          req.body.location = JSON.parse(req.body.location);
          console.log('📍 Parsed location from JSON:', req.body.location);
        } catch (err) {
          console.error('❌ Location JSON parsing error:', err);
          return res.status(400).json({
            status: 'error',
            message: 'Invalid JSON format for location'
          });
        }
      } else if (req.body['location[address]']) {
        // Handle nested field format
        req.body.location = {
          address: req.body['location[address]'],
          country: req.body['location[country]'] || 'India'
        };
        console.log('📍 Parsed location from nested fields:', req.body.location);
        
        // Clean up temporary fields
        delete req.body['location[address]'];
        delete req.body['location[country]'];
      } else if (req.body.locationAddress) {
        // Handle simple field format
        req.body.location = {
          address: req.body.locationAddress,
          country: req.body.locationCountry || 'India'
        };
        console.log('📍 Parsed location from simple fields:', req.body.location);
        
        // Clean up temporary fields
        delete req.body.locationAddress;
        delete req.body.locationCountry;
      }
      
      console.log('📍 Final location object:', req.body.location);
      console.log('📍 Location address:', req.body.location?.address);

      // Handle coordinates data (either JSON string or nested fields)
      if (req.body.coordinates && typeof req.body.coordinates === 'string') {
        try {
          req.body.coordinates = JSON.parse(req.body.coordinates);
          console.log('📍 Parsed coordinates from JSON:', req.body.coordinates);
        } catch (err) {
          console.error('❌ Coordinates JSON parsing error:', err);
          delete req.body.coordinates;
        }
      } else if (req.body['coordinates[type]']) {
        // Handle nested field format
        const lng = parseFloat(req.body['coordinates[coordinates][0]']);
        const lat = parseFloat(req.body['coordinates[coordinates][1]']);
        
        if (!isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0) {
          req.body.coordinates = {
            type: req.body['coordinates[type]'],
            coordinates: [lng, lat]
          };
          console.log('📍 Parsed coordinates from nested fields:', req.body.coordinates);
          
          // Clean up temporary fields
          delete req.body['coordinates[type]'];
          delete req.body['coordinates[coordinates][0]'];
          delete req.body['coordinates[coordinates][1]'];
        } else {
          console.log('⚠️ Invalid coordinates from nested fields, removing coordinates field');
          delete req.body.coordinates;
        }
      } else if (req.body.coordinatesType) {
        // Handle simple field format
        const lng = parseFloat(req.body.coordinatesLng);
        const lat = parseFloat(req.body.coordinatesLat);
        
        if (!isNaN(lng) && !isNaN(lat) && lng !== 0 && lat !== 0) {
          req.body.coordinates = {
            type: req.body.coordinatesType,
            coordinates: [lng, lat]
          };
          console.log('📍 Parsed coordinates from simple fields:', req.body.coordinates);
          
          // Clean up temporary fields
          delete req.body.coordinatesType;
          delete req.body.coordinatesLng;
          delete req.body.coordinatesLat;
        } else {
          console.log('⚠️ Invalid coordinates from simple fields, removing coordinates field');
          delete req.body.coordinates;
        }
      }
      
      // Validate coordinates if present
      if (req.body.coordinates) {
        const coords = req.body.coordinates.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2 || 
            typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
            isNaN(coords[0]) || isNaN(coords[1]) ||
            coords[0] === 0 || coords[1] === 0) {
          console.log('⚠️ Invalid coordinates, removing coordinates field');
          delete req.body.coordinates;
        } else {
          console.log('✅ Valid coordinates:', coords);
        }
      }

      console.log('🔍 Running validation...');
      console.log('🔍 Request body before validation:', req.body);
      console.log('🔍 All request body keys:', Object.keys(req.body));
      console.log('🔍 Location object:', req.body.location);
      console.log('🔍 Location address:', req.body.location?.address);
      console.log('🔍 Type field:', req.body.type);
      console.log('🔍 Description field:', req.body.description);
      console.log('🔍 Severity field:', req.body.severity);
      console.log('🔍 locationAddress field:', req.body.locationAddress);
      console.log('🔍 locationCountry field:', req.body.locationCountry);
      
      // Ensure required fields are present
      if (!req.body.type) {
        console.error('❌ Missing type field');
        return res.status(400).json({
          status: 'error',
          message: 'Report type is required'
        });
      }
      
      if (!req.body.description) {
        console.error('❌ Missing description field');
        return res.status(400).json({
          status: 'error',
          message: 'Description is required'
        });
      }
      
      if (!req.body.location || !req.body.location.address) {
        console.error('❌ Missing or invalid location field');
        console.error('❌ Location field:', req.body.location);
        console.error('❌ Location address:', req.body.location?.address);
        return res.status(400).json({
          status: 'error',
          message: 'Location address is required'
        });
      }
      
      if (!req.body.severity) {
        console.error('❌ Missing severity field');
        return res.status(400).json({
          status: 'error',
          message: 'Severity is required'
        });
      }
      
      // Run validation manually AFTER parsing JSON fields
      console.log('🔍 Running validation...');
      await Promise.all(validateReport.map((rule) => rule.run(req)));
      const { validationResult } = await import('express-validator');
      const result = validationResult(req);
      if (!result.isEmpty()) {
        console.error('❌ Validation failed:', result.array());
        console.error('❌ Validation errors:', result.array().map(err => ({ field: err.path, message: err.msg, value: err.value })));
        return res.status(400).json({
          status: 'error',
          message: 'Validation failed',
          errors: result.array()
        });
      }
      console.log('✅ Validation passed');

      req.body.reportedBy = req.user.id;
      console.log('👤 Set reportedBy:', req.body.reportedBy);

      // Fallback title if needed
      if (!req.body.title) {
        req.body.title = `${req.body.type.charAt(0).toUpperCase() + req.body.type.slice(1)} Report`;
      }
      
      console.log('🎯 Final request body before report creation:', JSON.stringify(req.body, null, 2));

      // Handle photo uploads
      if (req.files && req.files.length > 0) {
        console.log('📸 Files received:', req.files);
        console.log('📸 Number of files:', req.files.length);
        
        const photoUrls = [];
        const photosArray = [];
        
        // Process all uploaded files (any field name)
        req.files.forEach((file, index) => {
          console.log(`📸 File ${index + 1} details:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            cloudinaryUrl: file.path,
            publicId: file.filename
          });
          
          photoUrls.push(file.path);
          photosArray.push({
            url: file.path,
            publicId: file.filename,
            uploadedAt: new Date()
          });
        });
        
        if (photoUrls.length > 0) {
          // Set first photo as main photo for backward compatibility
          req.body.photo = photoUrls[0];
          
          // Set photos array
          req.body.photos = photosArray;
          
          console.log('📸 Set photo path:', req.body.photo);
          console.log('📸 Set photos array:', req.body.photos);
        }
      }

      console.log('💾 Creating report...');
      console.log('💾 Request body before creation:', JSON.stringify(req.body, null, 2));
      
      const report = await Report.create(req.body);
      console.log('✅ Report created:', report._id);
      console.log('✅ Report photo field:', report.photo);
      console.log('✅ Report photos array:', report.photos);
      
      await report.populate('reportedBy', 'name avatar role');
      console.log('👤 Report populated');

      console.log('🏆 Updating user points...');
      await req.user.updatePoints(10);
      console.log('✅ Points updated');

      console.log('🔥 Updating user streak...');
      await req.user.updateStreak();
      console.log('✅ Streak updated');

      // Notify nearby users (only if coordinates exist) - TEMPORARILY DISABLED
      /*
      if (req.body.location?.coordinates?.coordinates?.length === 2) {
        console.log('🔔 Checking for nearby users...');
        const [lng, lat] = req.body.location.coordinates.coordinates;

        const nearbyUsers = await User.find({
          'location.coordinates': {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [lng, lat]
              },
              $maxDistance: 5000
            }
          },
          _id: { $ne: req.user.id },
          notificationsEnabled: true,
          'notificationSettings.nearbyReports': true
        });

        console.log(`📢 Found ${nearbyUsers.length} nearby users`);

        for (const user of nearbyUsers) {
          await Notification.createNotification({
            recipient: user._id,
            sender: req.user.id,
            type: 'report_nearby',
            title: 'New Report Nearby',
            message: `${req.body.type} reported near your location`,
            data: {
              reportId: report._id,
              location: req.body.location
            }
          });
        }
        console.log('✅ Notifications sent');
      }
      */

      console.log('🎉 Report creation completed successfully');
      res.status(201).json({
        status: 'success',
        data: { report }
      });
    } catch (error) {
      console.error('❌ Report creation failed:', error);
      next(error);
    }
  }
);

// Get all reports
router.get('/', checkDatabaseReady, async (req, res, next) => {
  try {
    console.log('📋 Fetching all reports...');
    
    const reports = await Report.find({ isActive: true })
      .populate('reportedBy', 'name avatar role')
      .sort({ createdAt: -1 })
      .limit(100); // Limit to recent 100 reports
    
    console.log(`✅ Found ${reports.length} reports`);
    
    res.status(200).json({
      status: 'success',
      data: { reports }
    });
  } catch (error) {
    console.error('❌ Failed to fetch reports:', error);
    next(error);
  }
});

// Get user's own reports
router.get('/my-reports', protect, checkDatabaseReady, async (req, res, next) => {
  try {
    console.log('📋 Fetching user reports for:', req.user.id);
    
    const reports = await Report.find({ 
      reportedBy: req.user.id,
      isActive: true 
    })
      .populate('reportedBy', 'name avatar role')
      .sort({ createdAt: -1 });
    
    console.log(`✅ Found ${reports.length} reports for user`);
    
    res.status(200).json({
      status: 'success',
      data: { reports }
    });
  } catch (error) {
    console.error('❌ Failed to fetch user reports:', error);
    next(error);
  }
});

// Add comment to report
router.post('/:id/comments', protect, async (req, res, next) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment text is required'
      });
    }
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    const comment = {
      user: req.user.id,
      text: text.trim(),
      createdAt: new Date()
    };
    
    report.comments.push(comment);
    await report.save();
    
    // Populate the comment with user details
    await report.populate('comments.user', 'name avatar role');
    const newComment = report.comments[report.comments.length - 1];
    
    res.status(201).json({
      status: 'success',
      data: { comment: newComment }
    });
  } catch (error) {
    console.error('❌ Failed to add comment:', error);
    next(error);
  }
});

// Get comments for a report
router.get('/:id/comments', async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('comments.user', 'name avatar role')
      .populate('comments.replies.user', 'name avatar role')
      .select('comments');
    
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { comments: report.comments }
    });
  } catch (error) {
    console.error('❌ Failed to fetch comments:', error);
    next(error);
  }
});

// Enhanced comment routes
// Like a comment
router.post('/:id/comments/:commentId/like', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.likeComment(req.params.commentId, req.user.id);
    
    // Populate and return updated comment
    await report.populate('comments.user', 'name avatar role');
    await report.populate('comments.replies.user', 'name avatar role');
    const comment = report.comments.id(req.params.commentId);
    
    res.status(200).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    console.error('❌ Failed to like comment:', error);
    next(error);
  }
});

// Dislike a comment
router.post('/:id/comments/:commentId/dislike', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.dislikeComment(req.params.commentId, req.user.id);
    
    // Populate and return updated comment
    await report.populate('comments.user', 'name avatar role');
    await report.populate('comments.replies.user', 'name avatar role');
    const comment = report.comments.id(req.params.commentId);
    
    res.status(200).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    console.error('❌ Failed to dislike comment:', error);
    next(error);
  }
});

// Remove reaction from comment
router.delete('/:id/comments/:commentId/reaction', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.removeCommentReaction(req.params.commentId, req.user.id);
    
    // Populate and return updated comment
    await report.populate('comments.user', 'name avatar role');
    await report.populate('comments.replies.user', 'name avatar role');
    const comment = report.comments.id(req.params.commentId);
    
    res.status(200).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    console.error('❌ Failed to remove comment reaction:', error);
    next(error);
  }
});

// Add reply to comment
router.post('/:id/comments/:commentId/replies', protect, async (req, res, next) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Reply text is required'
      });
    }
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.addReply(req.params.commentId, req.user.id, text.trim());
    
    // Populate and return updated comment
    await report.populate('comments.user', 'name avatar role');
    await report.populate('comments.replies.user', 'name avatar role');
    const comment = report.comments.id(req.params.commentId);
    
    res.status(201).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    console.error('❌ Failed to add reply:', error);
    next(error);
  }
});

// Like a reply
router.post('/:id/comments/:commentId/replies/:replyId/like', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.likeReply(req.params.commentId, req.params.replyId, req.user.id);
    
    // Populate and return updated comment
    await report.populate('comments.user', 'name avatar role');
    await report.populate('comments.replies.user', 'name avatar role');
    const comment = report.comments.id(req.params.commentId);
    
    res.status(200).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    console.error('❌ Failed to like reply:', error);
    next(error);
  }
});

// Dislike a reply
router.post('/:id/comments/:commentId/replies/:replyId/dislike', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.dislikeReply(req.params.commentId, req.params.replyId, req.user.id);
    
    // Populate and return updated comment
    await report.populate('comments.user', 'name avatar role');
    await report.populate('comments.replies.user', 'name avatar role');
    const comment = report.comments.id(req.params.commentId);
    
    res.status(200).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    console.error('❌ Failed to dislike reply:', error);
    next(error);
  }
});

// Remove reaction from reply
router.delete('/:id/comments/:commentId/replies/:replyId/reaction', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.removeReplyReaction(req.params.commentId, req.params.replyId, req.user.id);
    
    // Populate and return updated comment
    await report.populate('comments.user', 'name avatar role');
    await report.populate('comments.replies.user', 'name avatar role');
    const comment = report.comments.id(req.params.commentId);
    
    res.status(200).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    console.error('❌ Failed to remove reply reaction:', error);
    next(error);
  }
});

// Delete reply
router.delete('/:id/comments/:commentId/replies/:replyId', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.deleteReply(req.params.commentId, req.params.replyId, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Reply deleted successfully'
    });
  } catch (error) {
    console.error('❌ Failed to delete reply:', error);
    if (error.message === 'Only reply author can delete') {
      return res.status(403).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
});

// Edit comment
router.put('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Comment text is required'
      });
    }
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.editComment(req.params.commentId, req.user.id, text.trim());
    
    // Populate and return updated comment
    await report.populate('comments.user', 'name avatar role');
    await report.populate('comments.replies.user', 'name avatar role');
    const comment = report.comments.id(req.params.commentId);
    
    res.status(200).json({
      status: 'success',
      data: { comment }
    });
  } catch (error) {
    console.error('❌ Failed to edit comment:', error);
    if (error.message === 'Only comment author can edit') {
      return res.status(403).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
});

// Delete comment
router.delete('/:id/comments/:commentId', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    await report.deleteComment(req.params.commentId, req.user.id);
    
    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('❌ Failed to delete comment:', error);
    if (error.message === 'Only comment author can delete') {
      return res.status(403).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
});

// Vote on poll
router.post('/:id/vote', protect, async (req, res, next) => {
  try {
    const { choice } = req.body;
    
    if (!choice || !['stillThere', 'resolved', 'fake'].includes(choice)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid choice is required: stillThere, resolved, or fake'
      });
    }
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    // Check if report is already resolved or fake
    if (report.status === 'Resolved' || report.status === 'Fake Report') {
      return res.status(400).json({
        status: 'error',
        message: 'Cannot vote on resolved or fake reports'
      });
    }
    
    await report.addPollVote(req.user.id, choice);
    
    // Check if this was a reporter vote that resolved the report
    const isReporterVote = report.reportedBy.toString() === req.user.id;
    const wasResolvedByReporter = choice === 'resolved' && isReporterVote;
    
    res.status(200).json({
      status: 'success',
      data: { 
        report,
        message: wasResolvedByReporter ? 'Report resolved by reporter!' : 'Vote recorded successfully',
        pollResults: {
          stillThere: report.poll.stillThere,
          resolved: report.poll.resolved,
          fake: report.poll.fake,
          total: report.totalPollVotes,
          resolvedPercentage: report.pollResolvedPercentage,
          fakePercentage: report.pollFakePercentage
        },
        wasResolvedByReporter,
        isReporterVote,
        isFakeReport: report.isFakeReport
      }
    });
  } catch (error) {
    console.error('❌ Failed to record poll vote:', error);
    next(error);
  }
});

// Manually update report status
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const { status, reason } = req.body;
    
    if (!status || !['Active', 'Resolved', 'Fake Report'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Valid status is required: Active, Resolved, or Fake Report'
      });
    }
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    // Only reporter or admin can change status
    if (report.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Only reporter or admin can change report status'
      });
    }
    
    const oldStatus = report.status;
    report.status = status;
    
    if (status === 'Resolved') {
      report.actualResolutionTime = new Date();
      if (reason) {
        report.resolutionNotes = reason;
      }
    }
    
    await report.save();
    
    res.status(200).json({
      status: 'success',
      data: { 
        report,
        message: `Report status changed from ${oldStatus} to ${status}`,
        changedBy: req.user.id
      }
    });
  } catch (error) {
    console.error('❌ Failed to update report status:', error);
    next(error);
  }
});

// Get single report by ID
router.get('/:id', checkDatabaseReady, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('reportedBy', 'name avatar role')
      .populate('comments.user', 'name avatar role');
    
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    // Track view if user is authenticated
    if (req.user) {
      // Check if user hasn't already viewed this report
      if (!report.viewedBy.includes(req.user.id)) {
        report.views = (report.views || 0) + 1;
        report.viewedBy.push(req.user.id);
        await report.save();
      }
    } else {
      // For anonymous users, just increment view count
      report.views = (report.views || 0) + 1;
      await report.save();
    }
    
    res.status(200).json({
      status: 'success',
      data: { report }
    });
  } catch (error) {
    console.error('❌ Failed to fetch report:', error);
    next(error);
  }
});

// Update report
router.put('/:id', protect, (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          status: 'error',
          message: 'File size too large. Maximum size is 10MB.'
        });
      }
      return res.status(400).json({
        status: 'error',
        message: 'File upload error: ' + err.message
      });
    } else if (err) {
      return res.status(400).json({
        status: 'error',
        message: err.message
      });
    }
    next();
  });
}, async (req, res, next) => {
  try {
    console.log('📝 Updating report:', req.params.id);
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    // Check if user owns the report or is admin
    if (report.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to update this report'
      });
    }
    
    // Parse location if sent as JSON string
    if (req.body.location && typeof req.body.location === 'string') {
      try {
        req.body.location = JSON.parse(req.body.location);
      } catch (err) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid JSON format for location'
        });
      }
    }

    // Parse coordinates if sent as JSON string
    if (req.body.coordinates && typeof req.body.coordinates === 'string') {
      try {
        req.body.coordinates = JSON.parse(req.body.coordinates);
        
        // Validate coordinates
        const coords = req.body.coordinates.coordinates;
        if (!Array.isArray(coords) || coords.length !== 2 || 
            typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
            isNaN(coords[0]) || isNaN(coords[1]) ||
            coords[0] === 0 || coords[1] === 0) {
          delete req.body.coordinates;
        }
      } catch (err) {
        delete req.body.coordinates;
      }
    }

    // Handle photo upload for updates
    if (req.file) {
      console.log('📸 Photo updated in Cloudinary:', req.file.filename);
      console.log('📸 Cloudinary URL:', req.file.path);
      req.body.photo = req.file.path;
    }
    
    // Update the report
    const updatedReport = await Report.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('reportedBy', 'name avatar role');
    
    console.log('✅ Report updated successfully');
    
    res.status(200).json({
      status: 'success',
      data: { report: updatedReport }
    });
  } catch (error) {
    console.error('❌ Failed to update report:', error);
    next(error);
  }
});

// Delete report
router.delete('/:id', protect, async (req, res, next) => {
  try {
    console.log('🗑️ Deleting report:', req.params.id);
    
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    // Check if user owns the report or is admin
    if (report.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to delete this report'
      });
    }
    
    // Hard delete from MongoDB database
    await Report.findByIdAndDelete(req.params.id);
    
    console.log('✅ Report deleted successfully from database');
    
    res.status(200).json({
      status: 'success',
      message: 'Report deleted successfully from database'
    });
  } catch (error) {
    console.error('❌ Failed to delete report:', error);
    next(error);
  }
});

// Like/Unlike report
router.post('/:id/like', protect, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        status: 'error',
        message: 'Report not found'
      });
    }
    
    const userId = req.user.id;
    
    // Check if user already liked this report (using _id field from actual DB structure)
    const existingLikeIndex = report.likes.findIndex(like => like._id.toString() === userId);
    
    if (existingLikeIndex > -1) {
      // Unlike - remove the existing like
      console.log(`🔍 Backend Debug - User ${userId} unliking report ${req.params.id}`);
      console.log(`   Likes before unlike: ${report.likes.length}`);
      
      report.likes.splice(existingLikeIndex, 1);
      await report.save();
      
      console.log(`   Likes after unlike: ${report.likes.length}`);
      
      res.status(200).json({
        status: 'success',
        message: 'Report unliked successfully',
        data: { 
          likes: report.likes.length,
          isLiked: false
        }
      });
    } else {
      // Like - add new like (ensure only one like per user)
      console.log(`🔍 Backend Debug - User ${userId} liking report ${req.params.id}`);
      console.log(`   Likes before like: ${report.likes.length}`);
      
      report.likes.push({
        _id: userId,
        likedAt: new Date(),
        id: userId
      });
      
      await report.save();
      
      console.log(`   Likes after like: ${report.likes.length}`);
      
      res.status(200).json({
        status: 'success',
        message: 'Report liked successfully',
        data: { 
          likes: report.likes.length,
          isLiked: true
        }
      });
    }
  } catch (error) {
    console.error('❌ Failed to like/unlike report:', error);
    next(error);
  }
});

// Comments routes moved to before /:id route to fix routing conflicts

// Test endpoint for location handling
router.post('/test-location', protect, (req, res) => {
  try {
    console.log('🧪 Testing location handling...');
    console.log('Original request body:', req.body);
    
    // Parse location if sent as JSON string
    if (req.body.location && typeof req.body.location === 'string') {
      try {
        req.body.location = JSON.parse(req.body.location);
        console.log('📍 Parsed location:', req.body.location);
        
        // Validate coordinates if they exist
        if (req.body.location.coordinates) {
          const coords = req.body.location.coordinates.coordinates;
          if (!Array.isArray(coords) || coords.length !== 2 || 
              typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
              isNaN(coords[0]) || isNaN(coords[1]) ||
              coords[0] === 0 || coords[1] === 0) {
            console.log('⚠️ Invalid coordinates, removing coordinates field');
            delete req.body.location.coordinates;
          } else {
            console.log('✅ Valid coordinates:', coords);
          }
        }
      } catch (err) {
        console.error('❌ Location parsing error:', err);
        return res.status(400).json({
          status: 'error',
          message: 'Invalid JSON format for location'
        });
      }
    }
    
    console.log('✅ Final location data:', req.body.location);
    
    res.status(200).json({
      status: 'success',
      message: 'Location test successful',
      location: req.body.location
    });
  } catch (error) {
    console.error('❌ Location test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Location test failed'
    });
  }
});

// Test endpoint for poll system
router.post('/test-poll', protect, async (req, res) => {
  try {
    console.log('🧪 Testing poll system...');
    
    // Create a test report with poll
    const testReport = new Report({
      type: 'congestion',
      description: 'Test traffic congestion report for poll system',
      location: {
        address: 'Test Location, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India'
      },
      severity: 'medium',
      status: 'Active',
      reportedBy: req.user.id,
      poll: {
        stillThere: 2,
        resolved: 1,
        fake: 0,
        votes: [
          { userId: req.user.id, choice: 'stillThere', votedAt: new Date() }
        ]
      }
    });
    
    // Set expiry time
    testReport.setExpiryTime();
    
    await testReport.save();
    
    console.log('✅ Test report created with poll:', testReport._id);
    
    res.status(201).json({
      status: 'success',
      message: 'Test report with poll created successfully',
      data: { report: testReport }
    });
  } catch (error) {
    console.error('❌ Poll test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Poll test failed',
      error: error.message
    });
  }
});

// Test endpoint for fake report restriction system
router.post('/test-fake-restriction', protect, async (req, res) => {
  try {
    console.log('🧪 Testing fake report restriction system...');
    
    // Create a test report
    const testReport = new Report({
      type: 'congestion',
      description: 'Test fake report for restriction system',
      location: {
        address: 'Test Location, Delhi',
        city: 'Delhi',
        state: 'Delhi',
        country: 'India'
      },
      severity: 'medium',
      status: 'Active',
      reportedBy: req.user.id,
      poll: {
        stillThere: 0,
        resolved: 0,
        fake: 0,
        votes: []
      }
    });
    
    // Set expiry time
    testReport.setExpiryTime();
    
    await testReport.save();
    
    console.log('✅ Test report created:', testReport._id);
    
    res.status(201).json({
      status: 'success',
      message: 'Test report created successfully. You can now vote "fake" on this report to test the restriction system.',
      data: { 
        report: testReport,
        instructions: 'Vote "fake" on this report multiple times to test the restriction system'
      }
    });
  } catch (error) {
    console.error('❌ Fake restriction test failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Fake restriction test failed',
      error: error.message
    });
  }
});

// Migration endpoint to fix existing reports
router.post('/migrate', protect, authorize('admin'), async (req, res) => {
  try {
    console.log('🔄 Starting report migration...');
    
    // Find all reports with old status values
    const oldReports = await Report.find({
      status: { $in: ['pending', 'verified', 'resolved', 'rejected'] }
    });
    
    console.log(`📋 Found ${oldReports.length} reports to migrate`);
    
    let updatedCount = 0;
    
    for (const report of oldReports) {
      try {
        // Map old status to new status
        let newStatus = 'Active';
        if (report.status === 'resolved') {
          newStatus = 'Resolved';
        }
        
        // Update status and add poll data
        const updateData = {
          status: newStatus,
          poll: {
            stillThere: 0,
            resolved: 0,
            notSure: 0,
            votes: []
          }
        };
        
        // Set expiry time if not already set
        if (!report.expiresAt) {
          const now = new Date();
          let expiryMinutes = 45; // Default for traffic jam
          
          switch (report.type) {
            case 'accident':
              expiryMinutes = 120; // 2 hours
              break;
            case 'construction':
            case 'roadwork':
              expiryMinutes = 2880; // 2 days (2 * 24 * 60 minutes)
              break;
            case 'congestion':
            case 'closure':
            case 'weather':
            default:
              expiryMinutes = 45; // 45 minutes
              break;
          }
          
          // Always set expiry time
          updateData.expiresAt = new Date(now.getTime() + expiryMinutes * 60000);
        }
        
        // Update the report
        await Report.findByIdAndUpdate(report._id, updateData);
        updatedCount++;
        
        console.log(`✅ Migrated report ${report._id}: ${report.status} → ${newStatus}`);
      } catch (error) {
        console.error(`❌ Failed to migrate report ${report._id}:`, error.message);
      }
    }
    
    console.log(`🎉 Migration completed! Updated ${updatedCount} reports`);
    
    res.status(200).json({
      status: 'success',
      message: `Migration completed! Updated ${updatedCount} reports`,
      data: { updatedCount, totalReports: oldReports.length }
    });
  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      status: 'error',
      message: 'Migration failed',
      error: error.message
    });
  }
});



export default router;