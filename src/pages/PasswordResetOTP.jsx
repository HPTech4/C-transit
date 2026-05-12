import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaArrowLeft } from 'react-icons/fa';
import { LoadingSpinner } from '../components/AnimatedIcons';
import { AUTH_API_URL } from '../config/api';
import styles from './PasswordResetOTP.module.css';

/**
 * PasswordResetOTP Page
 * 
 * Second step of password reset flow.
 * User enters OTP code sent to their email.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/auth/verify-otp (for password reset)
 * Send: { email, otp }
 * Response: { success: true, resetToken: "token_here", message: "OTP verified" }
 * 
 * - POST /api/auth/resend-otp (for password reset)
 * Send: { email }
 * Response: { success: true, message: "OTP sent to your email" }
 */
export default function PasswordResetOTP() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  // State management
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const inputRefs = useRef([]);

  // Redirect to forgot password if no email
  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Handle OTP digit input
  const handleOtpChange = (index, value) => {
    const numValue = value.replace(/[^0-9]/g, '');

    if (numValue.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = numValue;
    setOtp(newOtp);

    if (error) setError('');

    if (numValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (!numValue && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Mask email
  const maskEmail = (email) => {
    const [localPart, domain] = email.split('@');
    const masked = localPart.substring(0, 3) + '***';
    return `${masked}@${domain}`;
  };

  // Verify OTP - POST /api/auth/verify-otp
  const handleVerifyOtp = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(`${AUTH_API_URL}/verify-otp`, {
        email,
        otp: otpCode,
      });

      // Success! Navigate to new password page
      setTimeout(() => {
        navigate('/reset-password', {
          state: {
            email,
            resetToken: response.data.resetToken,
          },
        });
      }, 800);
    } catch (err) {
      if (err.response?.status === 400) {
        setError(err.response.data?.message || 'Invalid OTP code');
      } else if (err.response?.status === 429) {
        setError('Too many attempts. Please try again later.');
      } else if (err.response?.status === 410) {
        setError('OTP has expired. Please request a new one.');
      } else {
        setError(err.response?.data?.message || 'Verification failed');
      }
      console.error('OTP verification error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP - POST /api/auth/resend-otp
  const handleResendOtp = async () => {
    setLoading(true);
    setError('');

    try {
      await axios.post(`${AUTH_API_URL}/resend-otp`, { email });

      setOtp(['', '', '', '', '', '']);
      setResendCountdown(60);
      setResendSuccess(true);

      setTimeout(() => setResendSuccess(false), 2000);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
      console.error('Resend OTP error:', err);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const otpFilled = otp.every((digit) => digit !== '');

  return (
    <motion.div
      className={styles.container}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <button 
        className={styles.backBtn}
        onClick={() => navigate('/forgot-password')}
      >
        <FaArrowLeft /> Back
      </button>

      <motion.div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <h1>Verify Your Email</h1>
          <p>
            We sent a 6-digit code to <strong>{maskEmail(email)}</strong>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            className={styles.errorBox}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.div>
        )}

        {/* Success Message */}
        {resendSuccess && (
          <motion.div
            className={styles.successBox}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            ✓ Code resent to your email
          </motion.div>
        )}

        {/* OTP Input Grid */}
        <div className={styles.otpContainer}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength="1"
              value={digit}
              onChange={(e) => handleOtpChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`${styles.otpInput} ${digit ? styles.filled : ''}`}
              placeholder="0"
              disabled={loading}
            />
          ))}
        </div>

        {/* Verify Button */}
        <motion.button
          onClick={handleVerifyOtp}
          disabled={!otpFilled || loading}
          className={styles.verifyBtn}
          whileHover={otpFilled && !loading ? { transform: 'translateY(-2px)' } : {}}
          whileTap={otpFilled && !loading ? { transform: 'translateY(0)' } : {}}
        >
          {loading ? <LoadingSpinner /> : 'Verify Code'}
        </motion.button>

        {/* Resend Section */}
        <div className={styles.resendSection}>
          <p>Didn't receive the code?</p>
          <motion.button
            onClick={handleResendOtp}
            disabled={resendCountdown > 0 || loading}
            className={styles.resendBtn}
            whileHover={resendCountdown === 0 && !loading ? { scale: 1.02 } : {}}
          >
            {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Code'}
          </motion.button>
        </div>

        {/* Info Box */}
        <div className={styles.infoBox}>
          <p>💡 Check your spam folder if you don't see the email</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
