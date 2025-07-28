import { Schema, model } from 'mongoose';

const serviceRequestSchema = new Schema({
  citizenId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  serviceProviderId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  serviceType: {
    type: String,
    required: [true, 'Service type is required'],
    enum: ['ambulance', 'mechanic', 'petrol', 'puncture', 'rental', 'ev_charge', 'towing']
  },
  
  // Request details
  citizenName: {
    type: String,
    required: true
  },
  citizenPhone: {
    type: String,
    required: true
  },
  alternateContact: String,
  
  location: {
    address: {
      type: String,
      required: true
    },
    coordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        required: true
      }
    }
  },
  
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  
  urgency: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  
  preferredTime: {
    type: String,
    enum: ['immediate', '30min', '1hour', '2hour', 'flexible'],
    default: 'immediate'
  },
  
  budget: String,
  additionalNotes: String,
  
  // Media
  photos: [{
    url: String,
    publicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Status tracking
  status: {
    type: String,
    enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  
  // Service provider response
  acceptedAt: Date,
  estimatedArrival: String,
  actualArrival: Date,
  serviceStarted: Date,
  serviceCompleted: Date,
  
  // Pricing
  quotedPrice: Number,
  finalPrice: Number,
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  
  // Feedback
  citizenRating: {
    type: Number,
    min: 1,
    max: 5
  },
  citizenFeedback: String,
  providerRating: {
    type: Number,
    min: 1,
    max: 5
  },
  providerFeedback: String,
  
  // Communication
  messages: [{
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    message: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    messageType: {
      type: String,
      enum: ['text', 'location', 'photo'],
      default: 'text'
    }
  }],
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  cancelledBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  cancellationReason: String,
  
  // Timestamps
  requestedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
serviceRequestSchema.index({ 'location.coordinates': '2dsphere' });
serviceRequestSchema.index({ citizenId: 1 });
serviceRequestSchema.index({ serviceProviderId: 1 });
serviceRequestSchema.index({ serviceType: 1, status: 1 });
serviceRequestSchema.index({ requestedAt: -1 });
serviceRequestSchema.index({ urgency: 1, status: 1 });

// Virtual for duration
serviceRequestSchema.virtual('serviceDuration').get(function() {
  if (this.serviceStarted && this.serviceCompleted) {
    return Math.round((this.serviceCompleted - this.serviceStarted) / (1000 * 60)); // minutes
  }
  return null;
});

// Method to accept request
serviceRequestSchema.methods.acceptRequest = function(serviceProviderId, estimatedArrival) {
  this.serviceProviderId = serviceProviderId;
  this.status = 'accepted';
  this.acceptedAt = new Date();
  this.estimatedArrival = estimatedArrival;
  return this.save();
};

// Method to start service
serviceRequestSchema.methods.startService = function() {
  this.status = 'in_progress';
  this.serviceStarted = new Date();
  return this.save();
};

// Method to complete service
serviceRequestSchema.methods.completeService = function(finalPrice) {
  this.status = 'completed';
  this.serviceCompleted = new Date();
  if (finalPrice) this.finalPrice = finalPrice;
  return this.save();
};

// Method to cancel request
serviceRequestSchema.methods.cancelRequest = function(cancelledBy, reason) {
  this.status = 'cancelled';
  this.cancelledBy = cancelledBy;
  this.cancellationReason = reason;
  return this.save();
};

// Method to add message
serviceRequestSchema.methods.addMessage = function(senderId, message, messageType = 'text') {
  this.messages.push({
    sender: senderId,
    message,
    messageType
  });
  return this.save();
};

export default model('ServiceRequest', serviceRequestSchema);