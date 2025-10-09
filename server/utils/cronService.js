import cron from 'node-cron';
import Report from '../models/Report.js';
import User from '../models/User.js';

class CronService {
  constructor() {
    this.isRunning = false;
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Cron service is already running');
      return;
    }

    console.log('🚀 Starting cron service for auto-expiry...');

    // Run every 5 minutes
    cron.schedule('*/5 * * * *', async () => {
      await this.checkExpiredReports();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    // Run every hour to clean up old resolved reports
    cron.schedule('0 * * * *', async () => {
      await this.cleanupOldReports();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    // Run every 6 hours to check for expired restrictions
    cron.schedule('0 */6 * * *', async () => {
      await this.checkExpiredRestrictions();
    }, {
      scheduled: true,
      timezone: 'Asia/Kolkata'
    });

    this.isRunning = true;
    console.log('✅ Cron service started successfully');
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Cron service is not running');
      return;
    }

    cron.getTasks().forEach(task => task.stop());
    this.isRunning = false;
    console.log('🛑 Cron service stopped');
  }

  async checkExpiredReports() {
    try {
      console.log('⏰ Checking for expired reports...');
      
      const now = new Date();
      const expiredReports = await Report.find({
        expiresAt: { $lte: now },
        isExpired: false,
        status: 'Active'
      });

      if (expiredReports.length === 0) {
        console.log('✅ No expired reports found');
        return;
      }

      console.log(`📋 Found ${expiredReports.length} expired reports`);

      for (const report of expiredReports) {
        try {
          const wasExpired = report.checkExpiry();
          if (wasExpired) {
            await report.save();
            console.log(`🟢 Auto-resolved expired report: ${report._id} (${report.type})`);
            
            // TODO: Send notification to reporter about auto-resolution
            // await this.notifyReporter(report);
          }
        } catch (error) {
          console.error(`❌ Error processing expired report ${report._id}:`, error);
        }
      }

      console.log(`✅ Processed ${expiredReports.length} expired reports`);
    } catch (error) {
      console.error('❌ Error in checkExpiredReports:', error);
    }
  }

  async cleanupOldReports() {
    try {
      console.log('🧹 Cleaning up old resolved reports...');
      
      // Remove reports that were resolved more than 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const result = await Report.deleteMany({
        status: 'Resolved',
        actualResolutionTime: { $lt: thirtyDaysAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🗑️ Cleaned up ${result.deletedCount} old resolved reports`);
      } else {
        console.log('✅ No old reports to clean up');
      }
    } catch (error) {
      console.error('❌ Error in cleanupOldReports:', error);
    }
  }

  async checkExpiredRestrictions() {
    try {
      console.log('🔓 Checking for expired user restrictions...');
      
      const now = new Date();
      const restrictedUsers = await User.find({
        isRestrictedFromReporting: true,
        restrictionEndDate: { $lte: now }
      });

      if (restrictedUsers.length === 0) {
        console.log('✅ No expired restrictions found');
        return;
      }

      console.log(`📋 Found ${restrictedUsers.length} users with expired restrictions`);

      for (const user of restrictedUsers) {
        try {
          await user.removeRestriction();
          console.log(`🔓 Removed restriction for user: ${user._id} (${user.name})`);
        } catch (error) {
          console.error(`❌ Error removing restriction for user ${user._id}:`, error);
        }
      }

      console.log(`✅ Processed ${restrictedUsers.length} expired restrictions`);
    } catch (error) {
      console.error('❌ Error in checkExpiredRestrictions:', error);
    }
  }

  // Manual trigger for testing
  async manualCheck() {
    console.log('🔧 Manual expiry check triggered');
    await this.checkExpiredReports();
  }

  // Manual trigger for testing restriction cleanup
  async manualRestrictionCheck() {
    console.log('🔧 Manual restriction check triggered');
    await this.checkExpiredRestrictions();
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastCheck: new Date().toISOString(),
      nextCheck: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes from now
    };
  }
}

export default new CronService();
