import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SharedAuthLayout from '../components/Auth/SharedAuthLayout';
import InputField from '../components/Auth/InputField';
import OTPInput from '../components/Auth/OTPInput';
import AuthButton from '../components/Auth/AuthButton';
import styles from './ResetPassword.page.module.css';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { resetPassword, isLoading } = useContext(AuthContext);

  // Read the validated email from location state
  const email = location.state?.email || '';
  
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const otpCode = otp.join('');

    if (!email) {
      setError('Unable to process: Missing email identity.');
      return;
    }

    if (otpCode.length !== 6) {
      setError('Please enter the full 6-digit validation OTP.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // Call sanitized production hook
    const result = await resetPassword(email, otpCode, newPassword);

    if (result.success) {
      addToast('Password reset successful!', 'success');
      setTimeout(() => {
        // Direct route to the correct nested route
        navigate('/auth/login', { replace: true });
      }, 1500);
    } else {
      setError(result.error || 'Password reset failed. Please check your code.');
    }
  };

  return (
    <SharedAuthLayout
      title="Reset Your Password"
      subtitle={`Enter the code sent to ${email || 'your email'} and choose a new password`}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && <div className={styles.errorMessage}>{error}</div>}

        <div className={styles.otpGroup}>
          <label className={styles.label}>Verification Code</label>
          <OTPInput
            otp={otp}
            onChange={handleOtpChange}
            disabled={isLoading || !email}
          />
        </div>

        <InputField
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          disabled={isLoading || !email}
        />

        <InputField
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={isLoading || !email}
        />

        <AuthButton
          type="submit"
          isLoading={isLoading}
          disabled={isLoading || !email || otp.some(digit => digit === '')}
        >
          Update Password
        </AuthButton>
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