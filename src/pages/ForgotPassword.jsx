import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';
import { LoadingSpinner, EmailIcon } from '../components/AnimatedIcons';
import { validateEmail } from '../utils/validation';
import { AUTH_API_URL, USER_API_URL } from '../config/api';
import styles from './ForgotPassword.module.css';

/**
 * ForgotPassword Page
 * 
 * First step of password reset flow.
 * User enters email address to initiate password recovery.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/users/forgot-password
 * Send: { email }
 * Response: { success: true, message: "OTP sent to your email" }
 */
export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate email
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call POST /api/users/forgot-password
      const response = await axios.post(`${USER_API_URL}/users/forgot-password`, {
        email: email.trim(),
      });

      // Success! Navigate to OTP verification page
      setSubmitted(true);
      setTimeout(() => {
        navigate('/password-reset-otp', { 
          state: { email: email.trim(), step: 'otp' } 
        });
      }, 1500);
    } catch (err) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to initiate password reset. Please try again.');
      }
      console.error('Forgot password error:', err);
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

  return (
    <motion.div
      className={styles.container}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <button 
        className={styles.backBtn}
        onClick={() => navigate('/login')}
      >
        <FaArrowLeft /> Back to Login
      </button>

      <motion.div className={styles.card}>
        {/* Header */}
        <div className={styles.header}>
          <FaEnvelope className={styles.icon} />
          <h1>Forgot Password?</h1>
          <p>No worries! Enter your email and we'll send you a code to reset your password.</p>
        </div>

        {/* Success State */}
        {submitted && (
          <motion.div
            className={styles.successBox}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.checkmark}>✓</div>
            <h3>Check Your Email</h3>
            <p>We've sent a verification code to <strong>{email}</strong></p>
            <p className={styles.subtitle}>Redirecting to verification page...</p>
          </motion.div>
        )}

        {/* Form */}
        {!submitted && (
          <form onSubmit={handleSubmit} className={styles.form}>
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

            {/* Email Input */}
            <div className={styles.formGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWrapper}>
                <EmailIcon />
                <input
                  id="email"
                  type="email"
                  placeholder="your.email@campus.edu"
                  value={email}
                  onChange={handleChange}
                  disabled={loading}
                  className={error ? styles.invalid : ''}
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              className={styles.submitBtn}
              whileHover={!loading ? { transform: 'translateY(-2px)' } : {}}
              whileTap={!loading ? { transform: 'translateY(0)' } : {}}
            >
              {loading ? <LoadingSpinner /> : 'Send Recovery Code'}
            </motion.button>

            {/* Info Box */}
            <div className={styles.infoBox}>
              <p>
                💡 <strong>Tip:</strong> Check your spam folder if you don't see the email within 2 minutes.
              </p>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  );
}
