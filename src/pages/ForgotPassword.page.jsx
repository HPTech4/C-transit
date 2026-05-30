import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import SharedAuthLayout from '../../components/Auth/SharedAuthLayout';
import InputField from '../../components/Auth/InputField';
import AuthButton from '../../components/Auth/AuthButton';
import { FaCheckCircle } from 'react-icons/fa';
import { validateEmail } from '../../utils/validation';
import styles from './ForgotPassword.page.module.css';

/**
 * Forgot Password Screen - Two states
 * State 1: Input email/phone + send button
 * State 2: Success confirmation with checkmark
 * Route: /auth/forgot-password
 */
export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { forgotPassword, isLoading } = useContext(AuthContext);

  const [state, setState] = useState('input'); // 'input' or 'success'
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'info') => {
    const id = Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const validateInput = () => {
    setError('');

    if (!emailOrPhone.trim()) {
      setError('Email or phone is required');
      return false;
    }

    if (emailOrPhone.includes('@')) {
      if (!validateEmail(emailOrPhone)) {
        setError('Please enter a valid email');
        return false;
      }
    } else {
      const phoneDigits = emailOrPhone.replace(/\D/g, '');
      if (phoneDigits.length < 10) {
        setError('Please enter a valid phone number');
        return false;
      }
    }

    return true;
  };

  const handleChange = (e) => {
    setEmailOrPhone(e.target.value);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateInput()) return;

    const result = await forgotPassword(emailOrPhone);

    if (result.success) {
      // Show success state
      setState('success');
      addToast('Reset code sent! Check your email or phone.', 'success');

      // Auto redirect after 3 seconds
      setTimeout(() => {
        handleResetPassword();
      }, 3000);
    } else {
      setError(result.error || 'Failed to send reset code. Please try again.');
      addToast(result.error || 'Failed to send reset code', 'error');
    }
  };

  const handleResetPassword = () => {
    navigate('/auth/reset-password', {
      state: { emailOrPhone },
    });
  };

  const handleBack = () => {
    if (state === 'success') {
      setState('input');
      setEmailOrPhone('');
      setError('');
    } else {
      navigate('/auth/login');
    }
  };

  // State 1: Input form
  if (state === 'input') {
    return (
      <SharedAuthLayout
        title="Forgot Password?"
        subtitle="Enter your email or phone to reset it"
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <InputField
            label="Email or Phone"
            placeholder="admin@st.futminna.edu"
            value={emailOrPhone}
            onChange={handleChange}
            error={error}
            required
            inputMode="email"
            autoComplete="email"
          />

          <AuthButton
            type="submit"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Send Reset Code
          </AuthButton>

          <button
            type="button"
            onClick={handleBack}
            className={styles.backButton}
            disabled={isLoading}
          >
            ← Back to Login
          </button>
        </form>

        {toasts.length > 0 && (
          <div className={styles.toastContainer}>
            {toasts.map(toast => (
              <div key={toast.id} className={`${styles.toast} ${styles[toast.type]}`}>
                {toast.message}
              </div>
            ))}
          </div>
        )}
      </SharedAuthLayout>
    );
  }

  // State 2: Success confirmation
  return (
    <SharedAuthLayout
      title="Check Your Email"
      subtitle="Password reset code sent successfully"
    >
      <div className={styles.successContainer}>
        <div className={styles.successAnimation}>
          <FaCheckCircle className={styles.successIcon} />
        </div>

        <p className={styles.successMessage}>
          We've sent a password reset code to <strong>{emailOrPhone}</strong>
        </p>

        <p className={styles.successSubtext}>
          The code will expire in 30 minutes. Please check your email or SMS.
        </p>

        <AuthButton
          type="button"
          onClick={handleResetPassword}
          disabled={isLoading}
        >
          Continue to Reset Password
        </AuthButton>

        <button
          type="button"
          onClick={handleBack}
          className={styles.backButton}
          disabled={isLoading}
        >
          ← Change Email/Phone
        </button>
      </div>
    </SharedAuthLayout>
  );
}
