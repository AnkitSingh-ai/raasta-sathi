import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Report from '../models/Report.js';

dotenv.config();

const migrateReports = async () => {
  try {
    console.log('🔄 Starting report migration...');
    
    // Connect to MongoDB
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error('❌ MONGODB_URI not found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
    
    // Find all reports with old status values
    const oldReports = await Report.find({
      status: { $in: ['pending', 'verified', 'resolved', 'rejected'] }
    });
    
    console.log(`📋 Found ${oldReports.length} reports to migrate`);
    
    let updatedCount = 0;
    
    for (const report of oldReports) {
      try {
        // Map old status to new status
        let newStatus = 'Pending';
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
              expiryMinutes = null; // Manual only
              break;
            case 'congestion':
            case 'closure':
            case 'weather':
            default:
              expiryMinutes = 45; // 45 minutes
              break;
          }
          
          if (expiryMinutes) {
            updateData.expiresAt = new Date(now.getTime() + expiryMinutes * 60000);
          } else {
            // For manual-only reports, set a very long expiry (1 year)
            updateData.expiresAt = new Date(now.getTime() + 365 * 24 * 60 * 60000);
          }
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
    
    // Verify migration
    const pendingReports = await Report.countDocuments({ status: 'Pending' });
    const resolvedReports = await Report.countDocuments({ status: 'Resolved' });
    const totalReports = await Report.countDocuments();
    
    console.log(`📊 Migration verification:`);
    console.log(`   Total reports: ${totalReports}`);
    console.log(`   Pending: ${pendingReports}`);
    console.log(`   Resolved: ${resolvedReports}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateReports();
}

export default migrateReports;
