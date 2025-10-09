import { connect } from 'mongoose';
import User from '../models/User.js';
import Report from '../models/Report.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Notification from '../models/Notification.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const importRealData = async (importDir = null) => {
  try {
    await connect(process.env.MONGODB_URI);
    console.log('🔗 Connected to MongoDB for data import...');

    // Use provided directory or default to exports
    const importsDir = importDir || path.join(__dirname, '../exports');
    
    // Check if directory exists
    try {
      await fs.access(importsDir);
    } catch (error) {
      console.error(`❌ Import directory not found: ${importsDir}`);
      console.log('💡 Please run exportRealData.js first or specify a valid import directory');
      process.exit(1);
    }

    // Read all JSON files in the directory
    const files = await fs.readdir(importsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json') && !file.includes('summary'));

    if (jsonFiles.length === 0) {
      console.log('❌ No JSON files found for import');
      process.exit(1);
    }

    console.log(`📁 Found ${jsonFiles.length} files to import:`);
    jsonFiles.forEach(file => console.log(`   - ${file}`));

    let totalImported = 0;

    for (const file of jsonFiles) {
      const filePath = path.join(importsDir, file);
      const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
      
      console.log(`\n📥 Importing ${file}...`);

      if (file.includes('users')) {
        // Import users with hashed passwords
        for (const userData of data) {
                  // Check if user already exists
        const existingUser = await User.findOne({ email: userData.email });
        if (existingUser) {
          console.log(`   ⚠️  User ${userData.email} already exists, skipping...`);
          continue;
        }

        // Hash password if it's not already hashed
        if (userData.password && !userData.password.startsWith('$2')) {
          userData.password = await bcrypt.hash(userData.password, 12);
        }

        // Remove sensitive fields that shouldn't be imported
        delete userData._id;
        delete userData.__v;
        delete userData.createdAt;
        delete userData.updatedAt;

        await User.create(userData);
        console.log(`   ✅ Imported user: ${userData.email}`);
        totalImported++;
        }
      } else if (file.includes('reports')) {
        // Import reports
        for (const reportData of data) {
                  // Check if report already exists
        const existingReport = await Report.findOne({ 
          title: reportData.title, 
          'location.address': reportData.location?.address 
        });
        
        if (existingReport) {
          console.log(`   ⚠️  Report "${reportData.title}" already exists, skipping...`);
          continue;
        }

        // Remove MongoDB-specific fields
        delete reportData._id;
        delete reportData.__v;
        delete reportData.createdAt;
        delete reportData.updatedAt;

        await Report.create(reportData);
        console.log(`   ✅ Imported report: ${reportData.title}`);
        totalImported++;
        }
      } else if (file.includes('service-requests')) {
        // Import service requests
        for (const srData of data) {
                  // Remove MongoDB-specific fields
        delete srData._id;
        delete srData.__v;
        delete srData.createdAt;
        delete srData.updatedAt;

        await ServiceRequest.create(srData);
        console.log(`   ✅ Imported service request: ${srData.serviceType}`);
        totalImported++;
        }
      } else if (file.includes('notifications')) {
        // Import notifications
        for (const notificationData of data) {
                  // Remove MongoDB-specific fields
        delete notificationData._id;
        delete notificationData.__v;
        delete notificationData.createdAt;
        delete notificationData.updatedAt;

        await Notification.create(notificationData);
        console.log(`   ✅ Imported notification: ${notificationData.type}`);
        totalImported++;
        }
      }
    }

    console.log(`\n🎉 Data import completed successfully!`);
    console.log(`📊 Total records imported: ${totalImported}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error importing data:', error);
    process.exit(1);
  }
};

// Run import if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const importDir = process.argv[2]; // Optional: specify import directory
  importRealData(importDir);
}

export default importRealData;
