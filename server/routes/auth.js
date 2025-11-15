import { Router } from 'express';

import pkg from 'jsonwebtoken';
const { sign } = pkg;

import User from '../models/User.js'; // ✅
import { protect } from '../middleware/auth.js';
import { validateRegister, validateLogin, validate } from '../middleware/validation.js';
import { sendOTPEmail, generateOTP, isOTPExpired } from '../utils/emailService.js';
import { storeTempRegistration, getTempRegistration, removeTempRegistration } from '../utils/tempRegistration.js';

const router = Router();

// Generate JWT Token
const signToken = (id) => {
  return sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

// @desc    Start registration process (send OTP)
// @route   POST /api/auth/register
// @access  Public
router.post('/register', validateRegister, validate, async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // Check if user already exists (optimized query - only check email field)
    const existingUser = await User.findOne({ email }).select('_id').lean();
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Generate OTP for email verification
    const emailOTP = generateOTP();
    const emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store registration data temporarily (don't create user yet)
    const tempId = storeTempRegistration(email, {
      name,
      email,
      password,
      role,
      emailOTP,
      emailOTPExpires
    });

    // Send OTP email asynchronously (non-blocking)
    // Don't await - send response immediately and handle email in background
    sendOTPEmail(email, emailOTP, 'verification')
      .then((emailSent) => {
        if (!emailSent) {
          console.error('Failed to send verification email to:', email);
          // Don't remove temp registration - user can still use OTP if they have it
        } else {
          console.log('Verification email sent successfully to:', email);
        }
      })
      .catch((error) => {
        console.error('Error sending verification email:', error);
        // Log error but don't block user - they can request resend if needed
      });

    // Return response immediately without waiting for email
    res.status(200).json({
      status: 'success',
      message: 'Please check your email for verification code to complete registration.',
      data: {
        tempId,
        email,
        message: 'Account will be created after email verification'
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', validateLogin, validate, async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.correctPassword(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid credentials'
      });
    }

    // Check if email is verified (temporarily disabled for development)
    // if (!user.isVerified) {
    //   return res.status(401).json({
    //     status: 'error',
    //     message: 'Please verify your email before logging in. Check your email for verification code.'
    //   });
    // }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('totalReports');

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
router.put('/updatedetails', protect, async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      location: req.body.location,
      avatar: req.body.avatar
    };

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
});

// @desc    Complete registration with OTP verification
// @route   POST /api/auth/verify-email
// @access  Public
router.post('/verify-email', async (req, res, next) => {
  try {
    const { email, otp, tempId } = req.body;

    // Get temporary registration data
    const tempRegistration = getTempRegistration(tempId);
    
    if (!tempRegistration) {
      return res.status(400).json({
        status: 'error',
        message: 'Registration session expired or invalid. Please register again.'
      });
    }

    // Verify email matches
    if (tempRegistration.email !== email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email mismatch. Please use the same email you registered with.'
      });
    }

    // Check if OTP is expired
    if (isOTPExpired(tempRegistration.emailOTPExpires)) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification code has expired. Please register again.'
      });
    }

    // Check if OTP matches
    if (tempRegistration.emailOTP !== otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid verification code'
      });
    }

    // Check if user already exists (double-check - optimized query)
    const existingUser = await User.findOne({ email }).select('_id').lean();
    if (existingUser) {
      removeTempRegistration(tempId);
      return res.status(400).json({
        status: 'error',
        message: 'User already exists with this email'
      });
    }

    // Create the user account
    const user = await User.create({
      name: tempRegistration.name,
      email: tempRegistration.email,
      password: tempRegistration.password,
      role: tempRegistration.role,
      isVerified: true, // Mark as verified immediately
      joinDate: new Date(),
      lastActive: new Date()
    });

    // Remove temporary registration data
    removeTempRegistration(tempId);

    // Send success response
    res.status(201).json({
      status: 'success',
      message: 'Account created successfully! You can now login.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Resend email verification OTP for pending registration
// @route   POST /api/auth/resend-verification
// @access  Public
router.post('/resend-verification', async (req, res, next) => {
  try {
    const { email, tempId } = req.body;

    if (!tempId) {
      return res.status(400).json({
        status: 'error',
        message: 'Registration session ID required. Please register again.'
      });
    }

    // Get temporary registration data
    const tempRegistration = getTempRegistration(tempId);
    
    if (!tempRegistration) {
      return res.status(400).json({
        status: 'error',
        message: 'Registration session expired or invalid. Please register again.'
      });
    }

    // Verify email matches
    if (tempRegistration.email !== email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email mismatch. Please use the same email you registered with.'
      });
    }

    // Generate new OTP
    const emailOTP = generateOTP();
    const emailOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update temporary registration with new OTP
    tempRegistration.emailOTP = emailOTP;
    tempRegistration.emailOTPExpires = emailOTPExpires;
    
    // Store updated registration data
    storeTempRegistration(email, tempRegistration);

    // Send new OTP email asynchronously (non-blocking)
    // Don't await - send response immediately and handle email in background
    sendOTPEmail(email, emailOTP, 'verification')
      .then((emailSent) => {
        if (!emailSent) {
          console.error('Failed to resend verification email to:', email);
        } else {
          console.log('Verification email resent successfully to:', email);
        }
      })
      .catch((error) => {
        console.error('Error resending verification email:', error);
        // Log error but don't block user - they can try again if needed
      });

    // Return response immediately without waiting for email
    res.status(200).json({
      status: 'success',
      message: 'New verification code sent successfully! Please check your email.'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found with this email'
      });
    }

    // Generate OTP for password reset
    const passwordResetOTP = generateOTP();
    const passwordResetOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with OTP
    user.passwordResetOTP = passwordResetOTP;
    user.passwordResetOTPExpires = passwordResetOTPExpires;
    await user.save();

    // Send OTP email asynchronously (non-blocking)
    // Don't await - send response immediately and handle email in background
    sendOTPEmail(email, passwordResetOTP, 'password-reset')
      .then((emailSent) => {
        if (!emailSent) {
          console.error('Failed to send password reset email to:', email);
        } else {
          console.log('Password reset email sent successfully to:', email);
        }
      })
      .catch((error) => {
        console.error('Error sending password reset email:', error);
        // Log error but don't block user - they can request resend if needed
      });

    // Return response immediately without waiting for email
    res.status(200).json({
      status: 'success',
      message: 'Password reset code sent to your email!'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Reset password with OTP
// @route   POST /api/auth/reset-password
// @access  Public
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Check if OTP is expired
    if (isOTPExpired(user.passwordResetOTPExpires)) {
      return res.status(400).json({
        status: 'error',
        message: 'Password reset code has expired. Please request a new one.'
      });
    }

    // Check if OTP matches
    if (user.passwordResetOTP !== otp) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid password reset code'
      });
    }

    // Update password and clear OTP
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    
    // Also ensure the user is verified after password reset
    user.isVerified = true;
    
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Password reset successfully! You can now login with your new password.'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Force verify user email (temporary admin endpoint)
// @route   POST /api/auth/force-verify
// @access  Public
router.post('/force-verify', async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Force verify the user
    user.isVerified = true;
    user.emailOTP = undefined;
    user.emailOTPExpires = undefined;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'User email force verified successfully!',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', protect, (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'User logged out successfully'
  });
});

export default router;