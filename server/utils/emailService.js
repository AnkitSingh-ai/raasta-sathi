import nodemailer from 'nodemailer';

// Create transporter (you'll need to configure this with your email service)
const createTransporter = () => {
  // Use configured email service
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// Send OTP email
export const sendOTPEmail = async (email, otp, type = 'verification') => {
  try {
    console.log('📧 Attempting to send email to:', email);
    console.log('🔧 Email configuration:', {
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS ? '***' : 'NOT_SET'
    });
    

    
    const transporter = createTransporter();
    
    let subject, html;
    
    if (type === 'verification') {
      subject = 'Verify Your Email - Raasta Sathi';
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
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
      from: `"Raasta Sathi" <${process.env.EMAIL_USER || 'apparihar898@gmail.com'}>`,
      to: email,
      subject: subject,
      html: html
    };
    
    console.log('📤 Sending email with options:', { ...mailOptions, html: 'HTML_CONTENT' });
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      command: error.command
    });
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
