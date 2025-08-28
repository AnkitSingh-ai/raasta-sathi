import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, CheckCircle, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import apiService from '../utils/api';
import toast from 'react-hot-toast';

export function EmailVerificationModal({ isOpen, onClose, registrationData, onVerificationSuccess }) {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationStep, setVerificationStep] = useState('otp'); // 'otp' or 'success'

  // Start countdown for resend
  const startCountdown = () => {
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start countdown when modal opens
  useEffect(() => {
    if (isOpen) {
      startCountdown();
    }
  }, [isOpen]);

  // Handle OTP verification
  const handleOTPSubmit = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.verifyEmail(
        registrationData.email, 
        otp, 
        registrationData.tempId
      );
      
      if (response.status === 'success') {
        setVerificationStep('success');
        toast.success('Email verified successfully! Your account has been created.');
        
        // Call the success callback after a short delay
        setTimeout(() => {
          onVerificationSuccess(response.data.user);
          onClose();
        }, 2000);
      }
    } catch (error) {
      toast.error(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    try {
      await apiService.resendVerification(registrationData.email, registrationData.tempId);
      toast.success('New verification code sent!');
      startCountdown();
    } catch (error) {
      toast.error(error.message || 'Failed to resend code');
    } finally {
      setIsResending(false);
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (verificationStep === 'otp') {
      // Ask for confirmation if user hasn't verified yet
      if (window.confirm('Are you sure you want to cancel? You will need to register again.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="text-xl font-bold text-slate-900">Verify Your Email</h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {verificationStep === 'otp' ? (
              <>
                {/* Email Info */}
                <div className="text-center mb-6">
                  <Mail className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Check Your Email
                  </h3>
                  <p className="text-slate-600 text-sm mb-2">
                    We've sent a 6-digit verification code to:
                  </p>
                  <p className="text-blue-600 font-semibold text-sm">
                    {registrationData?.email}
                  </p>
                  <p className="text-slate-500 text-xs mt-2">
                    Enter the code below to complete your registration
                  </p>
                </div>

                {/* OTP Form */}
                <form onSubmit={handleOTPSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-900 mb-2">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-lg font-mono"
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || otp.length !== 6}
                    className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
                    ) : (
                      'Verify & Create Account'
                    )}
                  </button>
                </form>

                {/* Resend OTP */}
                <div className="mt-6 text-center">
                  <p className="text-slate-500 text-sm mb-2">
                    Didn't receive the code?
                  </p>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={countdown > 0 || isResending}
                    className="text-blue-600 hover:text-blue-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mx-auto space-x-2"
                  >
                    {isResending ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : countdown > 0 ? (
                      <span>Resend in {countdown}s</span>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>Resend Code</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Back to Registration */}
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="text-slate-500 hover:text-slate-700 text-sm flex items-center justify-center mx-auto space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Back to Registration</span>
                  </button>
                </div>
              </>
            ) : (
              /* Success Step */
              <div className="text-center py-8">
                <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Account Created Successfully!
                </h3>
                <p className="text-slate-600 text-sm">
                  Your email has been verified and your account is now active.
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  Redirecting to login...
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
