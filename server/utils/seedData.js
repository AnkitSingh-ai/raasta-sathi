import { connect } from 'mongoose';
import { deleteMany, create } from '../models/User.js';
import { deleteMany as _deleteMany, create as _create } from '../models/Report.js';
import { deleteMany as __deleteMany, create as __create } from '../models/ServiceRequest.js';
require('dotenv').config();

const seedData = async () => {
  try {
    await connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing data
    await deleteMany({});
    await _deleteMany({});
    await __deleteMany({});

    // Create sample users
    const users = await create([
      {
        name: 'Rajesh Kumar',
        email: 'rajesh@example.com',
        password: 'password123',
        role: 'citizen',
        contactNumber: '+91-9876543210',
        location: 'New Delhi',
        points: 2850,
        badge: 'Diamond Reporter',
        level: 12,
        streak: 23
      },
      {
        name: 'Officer Priya Sharma',
        email: 'priya.police@example.com',
        password: 'password123',
        role: 'police',
        contactNumber: '+91-9876543211',
        location: 'New Delhi',
        department: 'Delhi Traffic Police',
        badgeNumber: 'DTP-2024-001',
        jurisdiction: 'Central Delhi District'
      },
      {
        name: 'Dr. Municipal Authority',
        email: 'municipal@example.com',
        password: 'password123',
        role: 'municipal',
        contactNumber: '+91-9876543212',
        location: 'New Delhi',
        department: 'New Delhi Municipal Corporation',
        jurisdiction: 'New Delhi Zone'
      },
      {
        name: 'Quick Response Services',
        email: 'service@example.com',
        password: 'password123',
        role: 'service_provider',
        contactNumber: '+91-9876543213',
        location: 'New Delhi',
        serviceType: 'ambulance',
        businessName: 'Quick Response Ambulance',
        rating: 4.8,
        completedServices: 1250,
        isAvailable: true
      }
    ]);

    console.log('✅ Sample users created');

    // Create sample reports
    const reports = await _create([
      {
        type: 'accident',
        title: 'Minor Vehicle Collision',
        description: 'Two vehicle collision at traffic signal, minor injuries reported',
        location: {
          address: 'Connaught Place, New Delhi',
          coordinates: {
            type: 'Point',
            coordinates: [77.2177, 28.6304]
          },
          city: 'New Delhi',
          state: 'Delhi'
        },
        severity: 'medium',
        status: 'verified',
        reportedBy: users[0]._id,
        verifiedBy: users[1]._id,
        verifiedAt: new Date()
      },
      {
        type: 'pothole',
        title: 'Large Pothole on Main Road',
        description: 'Deep pothole causing vehicle damage, needs immediate attention',
        location: {
          address: 'Ring Road, Delhi',
          coordinates: {
            type: 'Point',
            coordinates: [77.2295, 28.6129]
          },
          city: 'New Delhi',
          state: 'Delhi'
        },
        severity: 'high',
        status: 'pending',
        reportedBy: users[0]._id
      }
    ]);

    console.log('✅ Sample reports created');

    // Create sample service requests
    const serviceRequests = await __create([
      {
        citizenId: users[0]._id,
        serviceType: 'ambulance',
        citizenName: 'Rajesh Kumar',
        citizenPhone: '+91-9876543210',
        location: {
          address: 'India Gate, New Delhi',
          coordinates: {
            type: 'Point',
            coordinates: [77.2295, 28.6129]
          }
        },
        description: 'Medical emergency - chest pain',
        urgency: 'high',
        status: 'pending'
      }
    ]);

    console.log('✅ Sample service requests created');
    console.log('🎉 Database seeded successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedData();
}

export default seedData;