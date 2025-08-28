import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { verifyEmail, resendVerification } from '../utils/api';
import toast from 'react-hot-toast';

const EmailVerification = ({ email, onVerificationSuccess, onBack }) => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [verificationAttempts, setVerificationAttempts] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [countdown]);

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp) {
      toast.error('Please enter the verification code');
      return;
    }

    if (otp.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }

    setLoading(true);
    try {
      await verifyEmail(email, otp);
      toast.success('Email verified successfully!');
      onVerificationSuccess();
    } catch (error) {
      setVerificationAttempts(prev => prev + 1);
      toast.error(error.message || 'Invalid verification code');
      
      if (verificationAttempts >= 2) {
        toast.error('Too many failed attempts. Please request a new code.');
        setCountdown(60);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    
    setResendLoading(true);
    try {
      await resendVerification(email);
      toast.success('New verification code sent to your email!');
      setCountdown(60);
      setVerificationAttempts(0);
    } catch (error) {
      toast.error(error.message || 'Failed to send new code');
    } finally {
      setResendLoading(false);
    }
  };

  const handleChangeEmail = () => {
    onBack();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto space-y-6"
    >
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
          <Mail className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify Your Email</h2>
        <p className="text-slate-600">
          We've sent a 6-digit verification code to
        </p>
        <p className="text-slate-900 font-medium">{email}</p>
      </div>

      <form onSubmit={handleVerifyOTP} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Verification Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl font-mono tracking-widest"
            placeholder="000000"
            maxLength={6}
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || otp.length !== 6}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <span>Verify Email</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center space-y-3">
        {countdown > 0 ? (
          <p className="text-slate-500">
            Resend code in {countdown} seconds
          </p>
        ) : (
          <button
            onClick={handleResendOTP}
            disabled={resendLoading}
            className="text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 mx-auto"
          >
            {resendLoading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Sending...</span>
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                <span>Resend Code</span>
              </>
            )}
          </button>
        )}

        <button
          onClick={handleChangeEmail}
          className="text-slate-600 hover:text-slate-800 transition-colors"
        >
          Use Different Email
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Didn't receive the code?</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure the email address is correct</li>
              <li>• Wait a few minutes and try again</li>
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default EmailVerification;
