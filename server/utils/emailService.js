import nodemailer from 'nodemailer';

// Check if email is properly configured
const isEmailConfigured = () => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  
  return emailUser && 
         emailPass && 
         emailUser !== 'your-email@gmail.com' && 
         emailPass !== 'your-app-password';
};

// Create transporter (you'll need to configure this with your email service)
const createTransporter = () => {
  // Check if email is configured
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not properly configured. OTPs will be logged to console in development mode.');
    return null;
  }

  // Use configured email service
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Add connection timeout to prevent hanging
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000, // 10 seconds
    socketTimeout: 10000, // 10 seconds
    // Pool connections for better performance
    pool: true,
    maxConnections: 5,
    maxMessages: 100
  });
};

// Send OTP email
export const sendOTPEmail = async (email, otp, type = 'verification') => {
  try {
    const emailType = type === 'verification' ? 'Email Verification' : 'Password Reset';
    console.log(`📧 Attempting to send ${emailType} OTP to:`, email);
    
    // In development mode or if email not configured, log OTP to console
    if (process.env.NODE_ENV === 'development' || !isEmailConfigured()) {
      console.log('\n' + '='.repeat(60));
      console.log(`🔐 ${emailType.toUpperCase()} OTP FOR ${email.toUpperCase()}`);
      console.log('='.repeat(60));
      console.log(`📝 OTP Code: ${otp}`);
      console.log(`⏰ This code expires in 10 minutes`);
      console.log('='.repeat(60) + '\n');
      
      // If email is not configured, return true (OTP logged to console)
      if (!isEmailConfigured()) {
        console.warn('⚠️  Email service not configured. OTP logged above for development.');
        return true;
      }
    }
    
    const transporter = createTransporter();
    
    if (!transporter) {
      console.error('❌ Email transporter not available');
      return false;
    }
    
    // Verify transporter connection
    try {
      await transporter.verify();
      console.log('✅ Email transporter verified successfully');
    } catch (verifyError) {
      console.error('❌ Email transporter verification failed:', verifyError.message);
      // Still try to send, but log the error
    }
    
    let subject, html;
    
    if (type === 'verification') {
      subject = 'Verify Your Email - Raasta Sathi';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">Raasta Sathi</h2>
          <h3 style="color: #1f2937;">Email Verification</h3>
          <p>Your verification code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Raasta Sathi - Smart Traffic Management
          </p>
        </div>
      `;
    } else if (type === 'password-reset') {
      subject = 'Password Reset - Raasta Sathi';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">Raasta Sathi</h2>
          <h3 style="color: #1f2937;">Password Reset</h3>
          <p>Your password reset code is:</p>
          <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <h1 style="color: #2563eb; font-size: 32px; margin: 0; letter-spacing: 5px;">${otp}</h1>
          </div>
          <p>This code will expire in 10 minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; text-align: center;">
            Raasta Sathi - Smart Traffic Management
          </p>
        </div>
      `;
    }
    
    const mailOptions = {
      from: `"Raasta Sathi" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: html
    };
    
    console.log('📤 Sending email...');
    
    // Add timeout to email sending (15 seconds max)
    const emailPromise = transporter.sendMail(mailOptions);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000)
    );
    
    const result = await Promise.race([emailPromise, timeoutPromise]);
    console.log('✅ Email sent successfully! Message ID:', result.messageId);
    console.log('📬 Email sent to:', email);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error.message);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    });
    
    // In development, still return true if email fails (OTP was logged to console)
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Email failed but continuing in development mode. Check OTP in console above.');
      return true;
    }
    
    return false;
  }
};

// Generate 6-digit OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Check if OTP is expired
export const isOTPExpired = (expiryDate) => {
  if (!expiryDate) return true;
  return new Date() > new Date(expiryDate);
};
