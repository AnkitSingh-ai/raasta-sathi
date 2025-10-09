import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Fix user account
const fixUserAccount = async () => {
  try {
    await connectDB();
    
    // Import User model
    const { default: User } = await import('./models/User.js');
    
    // Find the user by email
    const user = await User.findOne({ email: 'as8861513@gmail.com' });
    
    if (!user) {
      console.log('❌ User not found with email: as8861513@gmail.com');
      console.log('🔍 Creating new user account...');
      
      // Create new user
      const newUser = new User({
        name: 'Guddan',
        email: 'as8861513@gmail.com',
        password: 'guddan123', // This will be hashed automatically
        role: 'citizen',
        isVerified: true, // Mark as verified
        location: 'New Delhi',
        points: 0,
        badge: 'New Reporter',
        level: 1,
        streak: 0
      });
      
      await newUser.save();
      console.log('✅ New user account created successfully!');
      console.log('📧 Email: as8861513@gmail.com');
      console.log('🔑 Password: guddan123');
      console.log('✅ Verification: Verified');
      
    } else {
      console.log('✅ User found:', user.name);
      console.log('🔧 Updating user account...');
      
      // Update password and verification status
      user.password = 'guddan123'; // This will be hashed automatically
      user.isVerified = true;
      user.location = 'New Delhi';
      
      await user.save();
      console.log('✅ User account updated successfully!');
      console.log('📧 Email: as8861513@gmail.com');
      console.log('🔑 Password: guddan123');
      console.log('✅ Verification: Verified');
    }
    
    console.log('\n🎉 You can now login with:');
    console.log('📧 Email: as8861513@gmail.com');
    console.log('🔑 Password: guddan123');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error fixing user account:', error);
    process.exit(1);
  }
};

// Run the script
fixUserAccount();

