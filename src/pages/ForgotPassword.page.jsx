import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SharedAuthLayout from '../components/Auth/SharedAuthLayout';
import InputField from '../components/Auth/InputField';
import OTPInput from '../components/Auth/OTPInput';
import AuthButton from '../components/Auth/AuthButton';
import styles from './ResetPassword.page.module.css';

/**
 * Reset Password Screen - Two Step UI Production Flow
 * Step 1: Verify OTP Code Alone
 * Step 2: Input New Password Details
 * Route: /auth/reset-password
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, isLoading } = useContext(AuthContext);

  // Read clean email passed from forgot password screen
  const email = location.state?.email || '';
  
  // UI Steps: 'verify_otp' or 'change_password'
  const [uiStep, setUiStep] = useState('verify_otp'); 
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    if (!email) {
      setError('Session context lost. Please restart the forgot password process.');
    }
  }, [email]);

  const addToast = (message, type = 'info') => {
    const id = Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const handleOtpChange = (newOtp) => {
    setOtp(newOtp);
    if (error) setError('');
  };

  // Step 1: Validates that the user filled out the OTP digits locally
  const handleGoToPasswordStep = (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit verification code.');
      return;
    }

    // Advance UI to the password change screen
    setUiStep('change_password');
    addToast('Code confirmed locally. Enter your new password.', 'success');
  };

  // Step 2: Final submission to backend
  const handleSubmitFinalReset = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Send everything to your backend developer's endpoint at once
    const result = await resetPassword(email, otpCode, newPassword);

    if (result.success) {
      addToast('Password updated successfully!', 'success');
      setTimeout(() => {
        navigate('/auth/login', { replace: true });
      }, 1500);
    } else {
      // If backend says the OTP was actually invalid/expired, drop them back to step 1
      setError(result.error || 'Reset failed. Your verification code may be invalid.');
      setUiStep('verify_otp'); 
    }
  };

  const handleBack = () => {
    if (uiStep === 'change_password') {
      setUiStep('verify_otp');
    } else {
      navigate('/auth/forgot-password');
    }
  };

  return (
    <SharedAuthLayout
      title={uiStep === 'verify_otp' ? "Verify Reset Code" : "Create New Password"}
      subtitle={
        uiStep === 'verify_otp' 
          ? `Enter the 6-digit code sent to ${email || 'your email'}`
          : "Please secure your account with a fresh password"
      }
    >
      <div className={styles.container}>
        {error && <div className={styles.errorMessage}>{error}</div>}

        {/* 🛠️ STEP 1 UI: OTP Verification Alone */}
        {uiStep === 'verify_otp' && (
          <form onSubmit={handleGoToPasswordStep} className={styles.form}>
            <div className={styles.otpGroup}>
              <label className={styles.label}>Enter 6-Digit OTP</label>
              <OTPInput
                otp={otp}
                onChange={handleOtpChange}
                disabled={isLoading || !email}
              />
            </div>

            <AuthButton
              type="submit"
              disabled={isLoading || !email || otp.some(digit => digit === '')}
            >
              Verify Code
            </AuthButton>
          </form>
        )}

        {/* 🛠️ STEP 2 UI: Changing Password Interface */}
        {uiStep === 'change_password' && (
          <form onSubmit={handleSubmitFinalReset} className={styles.form}>
            <InputField
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <InputField
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
            />

            <AuthButton
              type="submit"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Update Password
            </AuthButton>
          </form>
        )}

        <button
          type="button"
          onClick={handleBack}
          className={styles.backButton}
          disabled={isLoading}
        >
          &larr; {uiStep === 'change_password' ? "Back to OTP" : "Change Email"}
        </button>
      </div>

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