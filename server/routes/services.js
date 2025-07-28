import { Router } from 'express';
import ServiceRequest from '../models/ServiceRequest.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { protect, authorize } from '../middleware/auth.js';
import { validateServiceRequest, validate } from '../middleware/validation.js';

const router = Router();

// @desc    Get all service requests
// @route   GET /api/services
// @access  Private (Service Providers)
router.get('/', protect, authorize('service_provider'), async (req, res, next) => {
  try {
    const {
      status,
      serviceType,
      urgency,
      lat,
      lng,
      radius = 15,
      page = 1,
      limit = 20
    } = req.query;

    // Build query
    let query = { isActive: true };

    if (status) query.status = status;
    if (serviceType) query.serviceType = serviceType;
    if (urgency) query.urgency = urgency;

    // Filter by service provider's service type
    if (req.user.serviceType) {
      query.serviceType = req.user.serviceType;
    }

    // Geospatial query within service radius
    if (lat && lng) {
      const searchRadius = Math.min(radius, req.user.serviceRadius || 15);
      query['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: searchRadius * 1000
        }
      };
    }

    const requests = await ServiceRequest.find(query)
      .populate('citizenId', 'name avatar')
      .populate('serviceProviderId', 'name businessName rating')
      .sort('-requestedAt')
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await ServiceRequest.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: requests.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get service requests for citizen
// @route   GET /api/services/my-requests
// @access  Private (Citizens)
router.get('/my-requests', protect, authorize('citizen'), async (req, res, next) => {
  try {
    const requests = await ServiceRequest.find({ citizenId: req.user.id })
      .populate('serviceProviderId', 'name businessName rating contactNumber')
      .sort('-requestedAt');

    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get service requests for provider
// @route   GET /api/services/provider-requests
// @access  Private (Service Providers)
router.get('/provider-requests', protect, authorize('service_provider'), async (req, res, next) => {
  try {
    const { status = 'all' } = req.query;
    
    let query = {};
    
    if (status === 'pending') {
      query = { 
        status: 'pending',
        serviceType: req.user.serviceType,
        isActive: true
      };
    } else if (status === 'accepted') {
      query = { 
        serviceProviderId: req.user.id,
        status: { $in: ['accepted', 'in_progress'] }
      };
    } else if (status === 'completed') {
      query = { 
        serviceProviderId: req.user.id,
        status: 'completed'
      };
    } else {
      query = {
        $or: [
          { status: 'pending', serviceType: req.user.serviceType },
          { serviceProviderId: req.user.id }
        ]
      };
    }

    const requests = await ServiceRequest.find(query)
      .populate('citizenId', 'name avatar')
      .sort('-requestedAt');

    res.status(200).json({
      status: 'success',
      results: requests.length,
      data: {
        requests
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get single service request
// @route   GET /api/services/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('citizenId', 'name avatar contactNumber')
      .populate('serviceProviderId', 'name businessName rating contactNumber')
      .populate('messages.sender', 'name avatar');

    if (!request) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }

    // Check authorization
    const isAuthorized = 
      request.citizenId._id.toString() === req.user.id ||
      (request.serviceProviderId && request.serviceProviderId._id.toString() === req.user.id) ||
      ['police', 'municipal'].includes(req.user.role);

    if (!isAuthorized) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to view this request'
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        request
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create service request
// @route   POST /api/services
// @access  Private (Citizens)
router.post('/', protect, authorize('citizen'), validateServiceRequest, validate, async (req, res, next) => {
  try {
    // Add citizen ID to request
    req.body.citizenId = req.user.id;

    const serviceRequest = await create(req.body);

    // Populate the request
    await serviceRequest.populate('citizenId', 'name avatar');

    // Find nearby service providers
    const nearbyProviders = await _find({
      role: 'service_provider',
      serviceType: req.body.serviceType,
      isAvailable: true,
      isActive: true,
      'location.coordinates': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: req.body.location.coordinates
          },
          $maxDistance: 20000 // 20km
        }
      }
    });

    // Send notifications to nearby providers
    for (const provider of nearbyProviders) {
      await NotificationcreateNotification({
        recipient: provider._id,
        sender: req.user.id,
        type: 'service_request',
        title: 'New Service Request',
        message: `${req.body.serviceType} service needed nearby`,
        data: {
          serviceRequestId: serviceRequest._id,
          location: {
            type: 'Point',
            coordinates: req.body.location.coordinates
          }
        },
        priority: req.body.urgency === 'high' ? 'urgent' : 'medium'
      });
    }

    res.status(201).json({
      status: 'success',
      data: {
        request: serviceRequest,
        nearbyProviders: nearbyProviders.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Accept service request
// @route   POST /api/services/:id/accept
// @access  Private (Service Providers)
router.post('/:id/accept', protect, authorize('service_provider'), async (req, res, next) => {
  try {
    const { estimatedArrival } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }

    if (serviceRequest.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Service request is no longer available'
      });
    }

    // Accept the request
    await serviceRequest.acceptRequest(req.user.id, estimatedArrival);

    // Send notification to citizen
    await createNotification({
      recipient: serviceRequest.citizenId,
      sender: req.user.id,
      type: 'service_accepted',
      title: 'Service Request Accepted',
      message: `${req.user.businessName || req.user.name} accepted your ${serviceRequest.serviceType} request`,
      data: {
        serviceRequestId: serviceRequest._id
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        request: serviceRequest
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Start service
// @route   POST /api/services/:id/start
// @access  Private (Service Providers)
router.post('/:id/start', protect, authorize('service_provider'), async (req, res, next) => {
  try {
    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }

    if (serviceRequest.serviceProviderId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to start this service'
      });
    }

    await serviceRequest.startService();

    res.status(200).json({
      status: 'success',
      data: {
        request: serviceRequest
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Complete service
// @route   POST /api/services/:id/complete
// @access  Private (Service Providers)
router.post('/:id/complete', protect, authorize('service_provider'), async (req, res, next) => {
  try {
    const { finalPrice } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }

    if (serviceRequest.serviceProviderId.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to complete this service'
      });
    }

    await serviceRequest.completeService(finalPrice);

    // Update provider stats
    req.user.completedServices += 1;
    await req.user.save();

    // Send notification to citizen
    await createNotification({
      recipient: serviceRequest.citizenId,
      sender: req.user.id,
      type: 'service_completed',
      title: 'Service Completed',
      message: `Your ${serviceRequest.serviceType} service has been completed`,
      data: {
        serviceRequestId: serviceRequest._id
      }
    });

    res.status(200).json({
      status: 'success',
      data: {
        request: serviceRequest
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Cancel service request
// @route   POST /api/services/:id/cancel
// @access  Private
router.post('/:id/cancel', protect, async (req, res, next) => {
  try {
    const { reason } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }

    // Check authorization
    const canCancel = 
      serviceRequest.citizenId.toString() === req.user.id ||
      (serviceRequest.serviceProviderId && serviceRequest.serviceProviderId.toString() === req.user.id);

    if (!canCancel) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to cancel this request'
      });
    }

    await serviceRequest.cancelRequest(req.user.id, reason);

    res.status(200).json({
      status: 'success',
      data: {
        request: serviceRequest
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Add message to service request
// @route   POST /api/services/:id/messages
// @access  Private
router.post('/:id/messages', protect, async (req, res, next) => {
  try {
    const { message, messageType = 'text' } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }

    // Check authorization
    const canMessage = 
      serviceRequest.citizenId.toString() === req.user.id ||
      (serviceRequest.serviceProviderId && serviceRequest.serviceProviderId.toString() === req.user.id);

    if (!canMessage) {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to message in this request'
      });
    }

    await serviceRequest.addMessage(req.user.id, message, messageType);
    await serviceRequest.populate('messages.sender', 'name avatar');

    res.status(201).json({
      status: 'success',
      data: {
        messages: serviceRequest.messages
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Rate service
// @route   POST /api/services/:id/rate
// @access  Private
router.post('/:id/rate', protect, async (req, res, next) => {
  try {
    const { rating, feedback } = req.body;

    const serviceRequest = await ServiceRequest.findById(req.params.id);

    if (!serviceRequest) {
      return res.status(404).json({
        status: 'error',
        message: 'Service request not found'
      });
    }

    if (serviceRequest.status !== 'completed') {
      return res.status(400).json({
        status: 'error',
        message: 'Can only rate completed services'
      });
    }

    // Check who is rating
    if (serviceRequest.citizenId.toString() === req.user.id) {
      serviceRequest.citizenRating = rating;
      serviceRequest.citizenFeedback = feedback;
      
      // Update provider's overall rating
      if (serviceRequest.serviceProviderId) {
        const provider = await ServiceProvider.findById(serviceRequest.serviceProviderId);
        if (provider) {
          const totalRatings = await ServiceRequest.countDocuments({
            serviceProviderId: provider._id,
            citizenRating: { $exists: true }
          });

          const avgRating = await ServiceRequest.aggregate([
            { $match: { serviceProviderId: provider._id, citizenRating: { $exists: true } } },
            { $group: { _id: null, avgRating: { $avg: '$citizenRating' } } }
          ]);
          
          provider.rating = avgRating[0]?.avgRating || rating;
          await provider.save();
        }
      }
    } else if (serviceRequest.serviceProviderId && serviceRequest.serviceProviderId.toString() === req.user.id) {
      serviceRequest.providerRating = rating;
      serviceRequest.providerFeedback = feedback;
    } else {
      return res.status(403).json({
        status: 'error',
        message: 'Not authorized to rate this service'
      });
    }

    await serviceRequest.save();

    res.status(200).json({
      status: 'success',
      data: {
        request: serviceRequest
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;