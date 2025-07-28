import { Schema, model } from 'mongoose';

const notificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    required: true,
    enum: [
      'report_nearby',
      'report_verified',
      'report_resolved',
      'service_request',
      'service_accepted',
      'service_completed',
      'achievement_earned',
      'badge_upgraded',
      'emergency_alert',
      'system_announcement'
    ]
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  data: {
    reportId: {
      type: Schema.Types.ObjectId,
      ref: 'Report'
    },
    serviceRequestId: {
      type: Schema.Types.ObjectId,
      ref: 'ServiceRequest'
    },
    achievementName: String,
    badgeName: String,
    points: Number,
    location: {
      type: {
        type: String,
        enum: ['Point']
      },
      coordinates: [Number]
    }
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Static method to create notification
notificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  
  // Here you could add real-time notification logic (Socket.IO, Push notifications, etc.)
  
  return notification;
};

export default model('Notification', notificationSchema);