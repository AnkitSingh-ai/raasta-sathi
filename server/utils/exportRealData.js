import { connect } from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Notification from '../models/Notification.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exportRealData = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📡 MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    
    await connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for data export...');

    // Create exports directory
    const exportsDir = path.join(__dirname, '../exports');
    await fs.mkdir(exportsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Export Users (without sensitive data)
    const users = await User.find({}).select('-password -emailOTP -emailOTPExpires -passwordResetOTP -passwordResetOTPExpires');
    const usersData = users.map(user => user.toObject());
    
    await fs.writeFile(
      path.join(exportsDir, `users-${timestamp}.json`),
      JSON.stringify(usersData, null, 2)
    );
    console.log(`✅ Exported ${users.length} users`);

    // Export Reports
    const reports = await Report.find({});
    const reportsData = reports.map(report => report.toObject());
    
    await fs.writeFile(
      path.join(exportsDir, `reports-${timestamp}.json`),
      JSON.stringify(reportsData, null, 2)
    );
    console.log(`✅ Exported ${reports.length} reports`);

    // Export Service Requests
    const serviceRequests = await ServiceRequest.find({});
    const serviceRequestsData = serviceRequests.map(sr => sr.toObject());
    
    await fs.writeFile(
      path.join(exportsDir, `service-requests-${timestamp}.json`),
      JSON.stringify(serviceRequestsData, null, 2)
    );
    console.log(`✅ Exported ${serviceRequests.length} service requests`);

    // Export Notifications
    const notifications = await Notification.find({});
    const notificationsData = notifications.map(notification => notification.toObject());
    
    await fs.writeFile(
      path.join(exportsDir, `notifications-${timestamp}.json`),
      JSON.stringify(notificationsData, null, 2)
    );
    console.log(`✅ Exported ${notifications.length} notifications`);

    // Create summary file
    const summary = {
      exportDate: new Date().toISOString(),
      totalUsers: users.length,
      totalReports: reports.length,
      totalServiceRequests: serviceRequests.length,
      totalNotifications: notifications.length,
      exportLocation: exportsDir
    };

    await fs.writeFile(
      path.join(exportsDir, `export-summary-${timestamp}.json`),
      JSON.stringify(summary, null, 2)
    );

    console.log('🎉 Real data exported successfully!');
    console.log(`📁 Export location: ${exportsDir}`);
    console.log(`📊 Summary: ${JSON.stringify(summary, null, 2)}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error exporting data:', error);
    process.exit(1);
  }
};

// Run export if this file is executed directly
console.log('🚀 Script loaded...');
console.log('📁 Current directory:', process.cwd());
console.log('📄 Script path:', process.argv[1]);
console.log('🔗 Import meta URL:', import.meta.url);

// Decode the URL to handle spaces properly
const decodedUrl = decodeURIComponent(import.meta.url);
const expectedUrl = `file://${process.argv[1]}`;

if (decodedUrl === expectedUrl) {
  console.log('✅ Execution condition met, starting export...');
  try {
    exportRealData();
  } catch (error) {
    console.error('❌ Failed to start export:', error);
    process.exit(1);
  }
} else {
  console.log('❌ Execution condition not met');
  console.log('Expected:', expectedUrl);
  console.log('Got (decoded):', decodedUrl);
}

export default exportRealData;
