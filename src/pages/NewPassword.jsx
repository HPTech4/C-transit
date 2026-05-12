import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { FaArrowLeft, FaLock } from 'react-icons/fa';
import { LoadingSpinner, LockIcon, EyeIcon, EyeOffIcon } from '../components/AnimatedIcons';
import { validatePassword, passwordsMatch, getPasswordStrength } from '../utils/validation';
import { AUTH_API_URL, USER_API_URL } from '../config/api';
import styles from './NewPassword.module.css';

/**
 * NewPassword Page
 * 
 * Third step of password reset flow.
 * User sets a new password for their account.
 * 
 * BACKEND INTEGRATION:
 * - POST /api/users/resend-password
 * Send: { email, resetToken, newPassword }
 * Response: { success: true, message: "Password reset successfully" }
 */
export default function NewPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';
  const otp = location.state?.otp || '';

  // State management
  const [passwords, setPasswords] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('weak');
  const [success, setSuccess] = useState(false);

  // Redirect if no email or token
  if (!email || !otp) {
    return (
      <motion.div className={styles.container}>
        <motion.div className={styles.card}>
          <div className={styles.errorState}>
            <h1>Invalid Request</h1>
            <p>Please start the password reset process again.</p>
            <motion.button
              onClick={() => navigate('/forgot-password')}
              className={styles.primaryBtn}
              whileHover={{ transform: 'translateY(-2px)' }}
              whileTap={{ transform: 'translateY(0)' }}
            >
              Go to Forgot Password
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setPasswords((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (name === 'newPassword') {
      const strength = getPasswordStrength(value);
      setPasswordStrength(strength);
    }

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!passwords.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (!validatePassword(passwords.newPassword)) {
      newErrors.newPassword = 'Password must be at least 8 characters with uppercase, lowercase, number, and symbol';
    }

    if (!passwords.confirmPassword) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (!passwordsMatch(passwords.newPassword, passwords.confirmPassword)) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Call POST /api/users/reset-password
      await axios.post(`${USER_API_URL}/users/reset-password`, {
        email,
        otp,
        newPassword: passwords.newPassword,
      });

      // Success!
      setSuccess(true);

      setTimeout(() => {
        navigate('/login', {
          state: { successMessage: 'Password reset successfully! Please log in with your new password.' },
        });
      }, 2000);
    } catch (err) {
      if (err.response?.data?.message) {
        setErrors({ form: err.response.data.message });
      } else {
        setErrors({ form: 'Failed to reset password. Please try again.' });
      }
      console.error('Password reset error:', err);
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

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'weak':
      default:
        return '#ef4444';
    }
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
        onClick={() => navigate('/password-reset-otp', { state: { email } })}
      >
        <FaArrowLeft /> Back
      </button>

      <motion.div className={styles.card}>
        {/* Success State */}
        {success && (
          <motion.div
            className={styles.successState}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className={styles.checkmark}>✓</div>
            <h1>Password Reset Successful!</h1>
            <p>Your password has been changed successfully.</p>
            <p className={styles.subtitle}>Redirecting to login page...</p>
          </motion.div>
        )}

        {/* Form */}
        {!success && (
          <>
            {/* Header */}
            <div className={styles.header}>
              <FaLock className={styles.icon} />
              <h1>Create New Password</h1>
              <p>Make sure it's strong and different from your previous password.</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Form Error */}
              {errors.form && (
                <motion.div
                  className={styles.errorBox}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.form}
                </motion.div>
              )}

              {/* New Password */}
              <div className={styles.formGroup}>
                <label htmlFor="newPassword">New Password</label>
                <div className={styles.passwordWrapper}>
                  <LockIcon />
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    name="newPassword"
                    placeholder="Create a strong password"
                    value={passwords.newPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className={errors.newPassword ? styles.invalid : ''}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.newPassword && (
                  <span className={styles.errorText}>{errors.newPassword}</span>
                )}

                {/* Password Strength Indicator */}
                {passwords.newPassword && (
                  <motion.div
                    className={styles.strengthIndicator}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className={styles.strengthBar}>
                      <div
                        className={styles.strengthFill}
                        style={{
                          width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%',
                          backgroundColor: getStrengthColor(),
                        }}
                      />
                    </div>
                    <span className={styles.strengthText} style={{ color: getStrengthColor() }}>
                      Strength: {passwordStrength}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Confirm Password */}
              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className={styles.passwordWrapper}>
                  <LockIcon />
                  <input
                    id="confirmPassword"
                    type={showConfirm ? 'text' : 'password'}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={passwords.confirmPassword}
                    onChange={handleChange}
                    disabled={loading}
                    className={errors.confirmPassword ? styles.invalid : ''}
                  />
                  <button
                    type="button"
                    className={styles.eyeBtn}
                    onClick={() => setShowConfirm(!showConfirm)}
                  >
                    {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className={styles.errorText}>{errors.confirmPassword}</span>
                )}
              </div>

              {/* Password Requirements */}
              <div className={styles.requirementsBox}>
                <p className={styles.requirementsTitle}>Password Requirements:</p>
                <ul>
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                  <li>One special character (!@#$%^&*)</li>
                </ul>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className={styles.submitBtn}
                whileHover={!loading ? { transform: 'translateY(-2px)' } : {}}
                whileTap={!loading ? { transform: 'translateY(0)' } : {}}
              >
                {loading ? <LoadingSpinner /> : 'Reset Password'}
              </motion.button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
