import { Schema, model } from 'mongoose';

const reportSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['accident', 'police', 'pothole', 'construction', 'congestion', 'closure', 'weather', 'vip']
  },
  title: {
    type: String,
    required: [true, 'Report title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Location address is required']
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
    },
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'resolved', 'rejected'],
    default: 'pending'
  },
  reportedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: Date,
  
  // Media attachments
  photos: [{
    url: String,
    publicId: String, // for Cloudinary
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Engagement
  likes: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  comments: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      maxlength: 200
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  votes: {
    up: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }],
    down: [{
      user: {
        type: Schema.Types.ObjectId,
        ref: 'User'
      },
      votedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  
  // Analytics
  views: {
    type: Number,
    default: 0
  },
  viewedBy: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Resolution tracking
  estimatedResolutionTime: String,
  actualResolutionTime: Date,
  resolutionNotes: String,
  
  // Metadata
  isActive: {
    type: Boolean,
    default: true
  },
  priority: {
    type: Number,
    default: 1,
    min: 1,
    max: 5
  },
  tags: [String],
  
  // Timestamps
  reportedAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reportSchema.index({ 'location.coordinates': '2dsphere' });
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ reportedAt: -1 });
reportSchema.index({ severity: 1, status: 1 });
reportSchema.index({ 'location.city': 1 });

// Virtual for like count
reportSchema.virtual('likeCount').get(function() {
  return this.likes.length;
});

// Virtual for comment count
reportSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Virtual for vote score
reportSchema.virtual('voteScore').get(function() {
  return this.votes.up.length - this.votes.down.length;
});

// Method to add like
reportSchema.methods.addLike = function(userId) {
  const alreadyLiked = this.likes.some(like => like.user.toString() === userId.toString());
  
  if (!alreadyLiked) {
    this.likes.push({ user: userId });
    return this.save();
  }
  
  return this;
};

// Method to remove like
reportSchema.methods.removeLike = function(userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

// Method to add comment
reportSchema.methods.addComment = function(userId, text) {
  this.comments.push({ user: userId, text });
  return this.save();
};

// Method to vote
reportSchema.methods.vote = function(userId, voteType) {
  // Remove any existing votes from this user
  this.votes.up = this.votes.up.filter(vote => vote.user.toString() !== userId.toString());
  this.votes.down = this.votes.down.filter(vote => vote.user.toString() !== userId.toString());
  
  // Add new vote
  if (voteType === 'up') {
    this.votes.up.push({ user: userId });
  } else if (voteType === 'down') {
    this.votes.down.push({ user: userId });
  }
  
  return this.save();
};

// Pre-save middleware
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('Report', reportSchema);