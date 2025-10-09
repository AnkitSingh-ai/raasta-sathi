import { Schema, model } from 'mongoose';

const reportSchema = new Schema({
  type: {
    type: String,
    required: [true, 'Report type is required'],
    enum: ['accident', 'police', 'pothole', 'construction', 'congestion', 'closure', 'weather', 'vip']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [1500, 'Description cannot be more than 1500 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Location address is required']
    },
    city: String,
    state: String,
    country: {
      type: String,
      default: 'India'
    }
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: false
    }
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['Active', 'Resolved', 'Fake Report'],
    default: 'Active'
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
  photo: String, // Single photo field for uploaded images
  photos: [{
    url: String,
    publicId: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // New poll system
  poll: {
    stillThere: { type: Number, default: 0 },
    resolved: { type: Number, default: 0 },
    fake: { type: Number, default: 0 },
    votes: [{
      userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      choice: { 
        type: String, 
        enum: ['stillThere', 'resolved', 'fake'], 
        required: true 
      },
      votedAt: { type: Date, default: Date.now }
    }]
  },
  // Auto-expiry settings
  expiresAt: {
    type: Date,
    required: false // Will be set in pre-save hook
  },
  isExpired: {
    type: Boolean,
    default: false
  },
  likes: [{
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    likedAt: { type: Date, default: Date.now }
  }],
  comments: [{
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, maxlength: 500 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    // Enhanced comment system
    likes: [{
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      likedAt: { type: Date, default: Date.now }
    }],
    dislikes: [{
      user: { type: Schema.Types.ObjectId, ref: 'User' },
      dislikedAt: { type: Date, default: Date.now }
    }],
    // Reply system
    replies: [{
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      text: { type: String, required: true, maxlength: 300 },
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      likes: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        likedAt: { type: Date, default: Date.now }
      }],
      dislikes: [{
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        dislikedAt: { type: Date, default: Date.now }
      }]
    }],
    // Track if comment was edited
    isEdited: { type: Boolean, default: false }
  }],
  votes: {
    up: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, votedAt: { type: Date, default: Date.now } }],
    down: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, votedAt: { type: Date, default: Date.now } }]
  },
  views: { type: Number, default: 0 },
  viewedBy: [{ user: { type: Schema.Types.ObjectId, ref: 'User' }, viewedAt: { type: Date, default: Date.now } }],
  estimatedResolutionTime: String,
  actualResolutionTime: Date,
  resolutionNotes: String,
  confirmedByReporter: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isFake: { type: Boolean, default: false },
  priority: { type: Number, default: 1, min: 1, max: 5 },
  tags: [String],
  reportedAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Remove index requiring coordinates
reportSchema.index({ type: 1, status: 1 });
reportSchema.index({ reportedBy: 1 });
reportSchema.index({ reportedAt: -1 });
reportSchema.index({ severity: 1, status: 1 });
reportSchema.index({ 'location.city': 1 });
reportSchema.index({ expiresAt: 1 });
reportSchema.index({ isExpired: 1 });

reportSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

reportSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

// Enhanced comment system virtuals
reportSchema.virtual('totalCommentLikes').get(function () {
  return this.comments.reduce((total, comment) => {
    return total + comment.likes.length + comment.replies.reduce((replyTotal, reply) => replyTotal + reply.likes.length, 0);
  }, 0);
});

reportSchema.virtual('totalCommentDislikes').get(function () {
  return this.comments.reduce((total, comment) => {
    return total + comment.dislikes.length + comment.replies.reduce((replyTotal, reply) => replyTotal + reply.dislikes.length, 0);
  }, 0);
});

reportSchema.virtual('totalReplies').get(function () {
  return this.comments.reduce((total, comment) => total + comment.replies.length, 0);
});

reportSchema.virtual('voteScore').get(function () {
  const upVotes = this.votes?.up?.length || 0;
  const downVotes = this.votes?.down?.length || 0;
  return upVotes - downVotes;
});

// Poll-related virtuals
reportSchema.virtual('totalPollVotes').get(function () {
  return this.poll.stillThere + this.poll.resolved + this.poll.fake;
});

reportSchema.virtual('pollResolvedPercentage').get(function () {
  const total = this.totalPollVotes;
  return total > 0 ? Math.round((this.poll.resolved / total) * 100) : 0;
});

reportSchema.virtual('pollFakePercentage').get(function () {
  const total = this.totalPollVotes;
  return total > 0 ? Math.round((this.poll.fake / total) * 100) : 0;
});

reportSchema.virtual('shouldAutoResolve').get(function () {
  const total = this.totalPollVotes;
  return total >= 3 && this.pollResolvedPercentage >= 60;
});

reportSchema.virtual('isFakeReport').get(function () {
  const total = this.totalPollVotes;
  return total >= 3 && this.pollFakePercentage >= 60;
});

reportSchema.virtual('isPastExpiry').get(function () {
  return new Date() > this.expiresAt;
});

// Methods for poll system
reportSchema.methods.addPollVote = async function (userId, choice) {
  // Remove existing vote if user has already voted
  this.poll.votes = this.poll.votes.filter(vote => 
    vote.userId.toString() !== userId.toString()
  );
  
  // Add new vote
  this.poll.votes.push({ userId, choice });
  
  // Reset poll counts
  this.poll.stillThere = 0;
  this.poll.resolved = 0;
  this.poll.fake = 0;
  
  // Recalculate poll counts
  this.poll.votes.forEach(vote => {
    this.poll[vote.choice]++;
  });
  
  // Auto-update status based on poll results
  await this.updateStatusFromPoll();
  
  return this.save();
};

reportSchema.methods.updateStatusFromPoll = async function () {
  const total = this.totalPollVotes;
  
  // Check if the actual reporter voted "resolved"
  const reporterVote = this.poll.votes.find(vote => 
    vote.userId.toString() === this.reportedBy.toString() && vote.choice === 'resolved'
  );
  
  if (reporterVote) {
    // If reporter voted resolved, automatically resolve the report
    this.status = 'Resolved';
    this.actualResolutionTime = new Date();
    this.confirmedByReporter = true;
    return;
  }
  
  // Check if report is marked as fake by community
  if (total >= 3 && this.isFakeReport) {
    this.status = 'Fake Report'; // Mark as fake report
    this.actualResolutionTime = new Date();
    this.isFake = true; // Mark as fake report
    
    // Import User model and add fake report to user
    const User = (await import('./User.js')).default;
    const reporter = await User.findById(this.reportedBy);
    if (reporter) {
      await reporter.addFakeReport();
    }
    return;
  }
  
  // Original logic for community voting
  if (total >= 3) {
    if (this.pollResolvedPercentage >= 60) {
      this.status = 'Resolved';
      this.actualResolutionTime = new Date();
    } else {
      this.status = 'Active';
    }
  }
};

reportSchema.methods.checkExpiry = function () {
  if (this.isPastExpiry && !this.isExpired) {
    this.isExpired = true;
    this.status = 'Resolved';
    this.actualResolutionTime = new Date();
    return true; // Report was expired
  }
  return false; // Report not expired
};

reportSchema.methods.setExpiryTime = function () {
  const now = new Date();
  let expiryMinutes = 45; // Default for traffic jam
  
  switch (this.type) {
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
    case 'police': // Add police type
    case 'pothole': // Add pothole type
    case 'vip': // Add vip type
    default:
      expiryMinutes = 45; // 45 minutes
      break;
  }
  
  // Always set expiry time
  this.expiresAt = new Date(now.getTime() + expiryMinutes * 60000);
  
  console.log(`⏰ Set expiry for ${this.type}: ${expiryMinutes} minutes, expires at: ${this.expiresAt}`);
};

reportSchema.methods.addLike = function (userId) {
  const alreadyLiked = this.likes.some(like => like.user.toString() === userId.toString());
  if (!alreadyLiked) this.likes.push({ user: userId });
  return this.save();
};

reportSchema.methods.removeLike = function (userId) {
  this.likes = this.likes.filter(like => like.user.toString() !== userId.toString());
  return this.save();
};

reportSchema.methods.addComment = function (userId, text) {
  this.comments.push({ user: userId, text });
  return this.save();
};

// Enhanced comment methods
reportSchema.methods.likeComment = function (commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  // Remove from dislikes if exists
  comment.dislikes = comment.dislikes.filter(d => d.user.toString() !== userId.toString());
  
  // Add to likes if not already liked
  const alreadyLiked = comment.likes.some(like => like.user.toString() === userId.toString());
  if (!alreadyLiked) {
    comment.likes.push({ user: userId });
  }
  
  return this.save();
};

reportSchema.methods.dislikeComment = function (commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  // Remove from likes if exists
  comment.likes = comment.likes.filter(l => l.user.toString() !== userId.toString());
  
  // Add to dislikes if not already disliked
  const alreadyDisliked = comment.dislikes.some(dislike => dislike.user.toString() === userId.toString());
  if (!alreadyDisliked) {
    comment.dislikes.push({ user: userId });
  }
  
  return this.save();
};

reportSchema.methods.removeCommentReaction = function (commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  comment.likes = comment.likes.filter(l => l.user.toString() !== userId.toString());
  comment.dislikes = comment.dislikes.filter(d => d.user.toString() !== userId.toString());
  
  return this.save();
};

reportSchema.methods.addReply = function (commentId, userId, text) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  comment.replies.push({ user: userId, text });
  return this.save();
};

reportSchema.methods.likeReply = function (commentId, replyId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  const reply = comment.replies.id(replyId);
  if (!reply) throw new Error('Reply not found');
  
  // Remove from dislikes if exists
  reply.dislikes = reply.dislikes.filter(d => d.user.toString() !== userId.toString());
  
  // Add to likes if not already liked
  const alreadyLiked = reply.likes.some(like => like.user.toString() === userId.toString());
  if (!alreadyLiked) {
    reply.likes.push({ user: userId });
  }
  
  return this.save();
};

reportSchema.methods.dislikeReply = function (commentId, replyId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  const reply = comment.replies.id(replyId);
  if (!reply) throw new Error('Reply not found');
  
  // Remove from likes if exists
  reply.likes = reply.likes.filter(l => l.user.toString() !== userId.toString());
  
  // Add to dislikes if not already disliked
  const alreadyDisliked = reply.dislikes.some(dislike => dislike.user.toString() === userId.toString());
  if (!alreadyDisliked) {
    reply.dislikes.push({ user: userId });
  }
  
  return this.save();
};

reportSchema.methods.removeReplyReaction = function (commentId, replyId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  const reply = comment.replies.id(replyId);
  if (!reply) throw new Error('Reply not found');
  
  reply.likes = reply.likes.filter(l => l.user.toString() !== userId.toString());
  reply.dislikes = reply.dislikes.filter(d => d.user.toString() !== userId.toString());
  
  return this.save();
};

reportSchema.methods.editComment = function (commentId, userId, newText) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  if (comment.user.toString() !== userId.toString()) {
    throw new Error('Only comment author can edit');
  }
  
  comment.text = newText;
  comment.updatedAt = new Date();
  comment.isEdited = true;
  
  return this.save();
};

reportSchema.methods.deleteComment = function (commentId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  if (comment.user.toString() !== userId.toString()) {
    throw new Error('Only comment author can delete');
  }
  
  comment.remove();
  return this.save();
};

reportSchema.methods.deleteReply = function (commentId, replyId, userId) {
  const comment = this.comments.id(commentId);
  if (!comment) throw new Error('Comment not found');
  
  const reply = comment.replies.id(replyId);
  if (!reply) throw new Error('Reply not found');
  
  if (reply.user.toString() !== userId.toString()) {
    throw new Error('Only reply author can delete');
  }
  
  reply.remove();
  return this.save();
};

reportSchema.methods.vote = function (userId, voteType) {
  this.votes.up = this.votes.up.filter(v => v.user.toString() !== userId.toString());
  this.votes.down = this.votes.down.filter(v => v.user.toString() !== userId.toString());
  if (voteType === 'up') this.votes.up.push({ user: userId });
  else if (voteType === 'down') this.votes.down.push({ user: userId });
  return this.save();
};

reportSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  
  // Always set expiry time (override if exists)
  this.setExpiryTime();
  console.log('⏰ Set expiry time:', this.expiresAt);
  
  // Handle invalid coordinates
  if (this.location && this.location.coordinates) {
    const coords = this.location.coordinates.coordinates;
    if (!Array.isArray(coords) || coords.length !== 2 || 
        typeof coords[0] !== 'number' || typeof coords[1] !== 'number' ||
        isNaN(coords[0]) || isNaN(coords[1]) ||
        coords[0] === 0 || coords[1] === 0) {
      // Remove invalid coordinates
      console.log('🗑️ Removing invalid coordinates from report');
      delete this.location.coordinates;
    } else {
      console.log('✅ Valid coordinates in report:', coords);
    }
  }
  
  next();
});

export default model('Report', reportSchema);