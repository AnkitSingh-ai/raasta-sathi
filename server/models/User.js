import { Schema, model } from 'mongoose';
import pkg from 'bcryptjs';
const { hash, compare } = pkg;
// filepath: /Users/ankitsingh/Desktop/Raasta Sathi/server/models/User.js

const userSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['citizen', 'police', 'municipal', 'service_provider'],
    default: 'citizen'
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    match: [/^\+?[1-9]\d{1,14}$/, 'Please add a valid phone number']
  },
  location: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  
  // Citizen specific fields
  points: {
    type: Number,
    default: 0
  },
  badge: {
    type: String,
    default: 'New Reporter'
  },
  level: {
    type: Number,
    default: 1
  },
  streak: {
    type: Number,
    default: 0
  },
  lastReportDate: {
    type: Date
  },
  achievements: [{
    name: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Authority specific fields
  department: String,
  badgeNumber: String,
  jurisdiction: String,
  
  // Service provider specific fields
  serviceType: {
    type: String,
    enum: ['ambulance', 'mechanic', 'petrol', 'puncture', 'rental', 'ev_charge', 'towing']
  },
  businessName: String,
  serviceRadius: {
    type: Number,
    default: 10 // km
  },
  rating: {
    type: Number,
    default: 0
  },
  completedServices: {
    type: Number,
    default: 0
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  // Notification settings
  notificationsEnabled: {
    type: Boolean,
    default: true
  },
  notificationsPaused: {
    type: Boolean,
    default: false
  },
  notificationSettings: {
    nearbyReports: { type: Boolean, default: true },
    emergencyAlerts: { type: Boolean, default: true },
    serviceRequests: { type: Boolean, default: true },
    weeklyDigest: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false }
  },
  
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Timestamps
  joinDate: {
    type: Date,
    default: Date.now
  },
  lastLogin: Date,
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ location: 1 });
userSchema.index({ points: -1 });
userSchema.index({ serviceType: 1, isAvailable: 1 });

// Virtual for user's total reports
userSchema.virtual('totalReports', {
  ref: 'Report',
  localField: '_id',
  foreignField: 'reportedBy',
  count: true
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  this.password = await hash(this.password, 12);
  next();
});

// Method to check password
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
  return await compare(candidatePassword, userPassword);
};

// Method to update points and badge
userSchema.methods.updatePoints = function(points) {
  this.points += points;
  
  // Update badge based on points
  if (this.points >= 5000) this.badge = 'Diamond Reporter';
  else if (this.points >= 3000) this.badge = 'Gold Guardian';
  else if (this.points >= 1500) this.badge = 'Silver Scout';
  else if (this.points >= 500) this.badge = 'Bronze Hero';
  else if (this.points >= 100) this.badge = 'Rising Star';
  
  // Update level
  this.level = Math.floor(this.points / 250) + 1;
  
  return this.save();
};

// Method to update streak
userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastReport = this.lastReportDate;
  
  if (!lastReport) {
    this.streak = 1;
  } else {
    const daysDiff = Math.floor((today - lastReport) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      this.streak += 1;
    } else if (daysDiff > 1) {
      this.streak = 1;
    }
  }
  
  this.lastReportDate = today;
  return this.save();
};

export default model('User', userSchema);