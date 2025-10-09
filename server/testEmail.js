import dotenv from 'dotenv';
import { sendOTPEmail } from './utils/emailService.js';

dotenv.config();

const testEmail = async () => {
  try {
    console.log('🧪 Testing email service...');
    console.log('📧 Environment variables:');
    console.log('  EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('  EMAIL_PORT:', process.env.EMAIL_PORT);
    console.log('  EMAIL_USER:', process.env.EMAIL_USER);
    console.log('  EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT_SET');
    
    const result = await sendOTPEmail('test@example.com', '123456', 'password-reset');
    
    if (result) {
      console.log('✅ Email sent successfully!');
    } else {
      console.log('❌ Email failed to send');
    }
  } catch (error) {
    console.error('❌ Email test error:', error);
  }
  
  process.exit(0);
};

testEmail();
