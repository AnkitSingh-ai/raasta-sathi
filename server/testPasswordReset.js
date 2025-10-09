import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

// Test password reset flow
const testPasswordReset = async () => {
  try {
    await connectDB();
    
    // Import User model
    const { default: User } = await import('./models/User.js');
    
    // Find the test user
    const user = await User.findOne({ email: 'guddantest@gmail.com' });
    
    if (!user) {
      console.log('❌ Test user not found');
      return;
    }
    
    console.log('✅ Test user found:', user.name);
    console.log('📧 Email:', user.email);
    console.log('🔑 Has OTP:', !!user.passwordResetOTP);
    console.log('⏰ OTP Expires:', user.passwordResetOTPExpires);
    console.log('🔢 OTP:', user.passwordResetOTP);
    
    if (user.passwordResetOTP) {
      console.log('\n🧪 Testing password reset...');
      
      // Test the reset password API
      const response = await fetch('http://localhost:5002/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: user.email,
          otp: user.passwordResetOTP,
          newPassword: 'newpassword123'
        })
      });
      
      const result = await response.json();
      console.log('📤 Reset password response:', result);
      
      if (result.status === 'success') {
        console.log('✅ Password reset successful!');
        
        // Verify the password was changed
        const updatedUser = await User.findOne({ email: user.email }).select('+password');
        console.log('🔑 Password updated:', !!updatedUser.password);
        
        // Test login with new password
        const loginResponse = await fetch('http://localhost:5002/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            password: 'newpassword123'
          })
        });
        
        const loginResult = await loginResponse.json();
        console.log('🔐 Login test result:', loginResult.status);
        
        if (loginResult.status === 'success') {
          console.log('🎉 Complete flow test successful!');
        }
      }
    } else {
      console.log('❌ No OTP found for user');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error testing password reset:', error);
    process.exit(1);
  }
};

// Run the test
testPasswordReset();
