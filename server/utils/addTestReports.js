import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Report from '../models/Report.js';
import User from '../models/User.js';

dotenv.config();

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.log('❌ MongoDB URI not provided');
      process.exit(1);
    }

    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const addTestReports = async () => {
  try {
    // Find a user to associate with reports
    const user = await User.findOne({ role: 'citizen' });
    if (!user) {
      console.log('❌ No citizen user found. Please create a user first.');
      return;
    }

    // Test reports with coordinates around Delhi/Noida area
    const testReports = [
      {
        type: 'pothole',
        description: 'Large pothole on main road causing traffic delays',
        severity: 'high',
        status: 'Pending',
        location: {
          address: 'Noida Sector 62, Near Metro Station',
          country: 'India'
        },
        coordinates: {
          type: 'Point',
          coordinates: [77.3569, 28.6100] // [longitude, latitude]
        },
        reportedBy: user._id,
        isActive: true,
        priority: 1,
        tags: ['road-damage', 'traffic-delay'],
        views: 15,
        likes: [],
        comments: [],
        viewedBy: [],
        reportedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      },
      {
        type: 'construction',
        description: 'Road construction work blocking two lanes',
        severity: 'medium',
        status: 'In Progress',
        location: {
          address: 'Noida Sector 18, Main Market Road',
          country: 'India'
        },
        coordinates: {
          type: 'Point',
          coordinates: [77.3580, 28.6080] // Slightly different location
        },
        reportedBy: user._id,
        isActive: true,
        priority: 2,
        tags: ['construction', 'lane-blocked'],
        views: 8,
        likes: [],
        comments: [],
        viewedBy: [],
        reportedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
      },
      {
        type: 'accident',
        description: 'Minor accident causing traffic congestion',
        severity: 'medium',
        status: 'Pending',
        location: {
          address: 'Noida Sector 15, Near Shopping Complex',
          country: 'India'
        },
        coordinates: {
          type: 'Point',
          coordinates: [77.3550, 28.6120] // Another nearby location
        },
        reportedBy: user._id,
        isActive: true,
        priority: 1,
        tags: ['accident', 'traffic-congestion'],
        views: 12,
        likes: [],
        comments: [],
        viewedBy: [],
        reportedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000) // 12 hours from now
      },
      {
        type: 'weather',
        description: 'Heavy rainfall causing waterlogging on roads',
        severity: 'high',
        status: 'Pending',
        location: {
          address: 'Noida Sector 25, Low-lying Area',
          country: 'India'
        },
        coordinates: {
          type: 'Point',
          coordinates: [77.3540, 28.6140] // Another location
        },
        reportedBy: user._id,
        isActive: true,
        priority: 1,
        tags: ['weather', 'waterlogging'],
        views: 20,
        likes: [],
        comments: [],
        viewedBy: [],
        reportedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        expiresAt: new Date(Date.now() + 36 * 60 * 60 * 1000) // 36 hours from now
      }
    ];

    // Add the test reports
    for (const reportData of testReports) {
      const existingReport = await Report.findOne({
        'coordinates.coordinates': reportData.coordinates.coordinates,
        type: reportData.type
      });

      if (!existingReport) {
        const report = new Report(reportData);
        await report.save();
        console.log(`✅ Added test report: ${report.type} at ${report.location.address}`);
      } else {
        console.log(`⚠️ Report already exists: ${reportData.type} at ${reportData.location.address}`);
      }
    }

    console.log('✅ Test reports added successfully!');
    
    // Show summary
    const totalReports = await Report.countDocuments();
    const reportsWithCoords = await Report.countDocuments({
      'coordinates.coordinates': { $ne: [] }
    });
    
    console.log(`📊 Total reports: ${totalReports}`);
    console.log(`📍 Reports with coordinates: ${reportsWithCoords}`);

  } catch (error) {
    console.error('❌ Error adding test reports:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  addTestReports();
}

export default addTestReports;

