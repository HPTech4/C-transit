import { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import SharedAuthLayout from '../components/Auth/SharedAuthLayout';
import OTPInput from '../components/Auth/OTPInput';
import AuthButton from '../components/Auth/AuthButton';
import styles from './VerifyPhone.page.module.css';

/**
 * Verify Phone Screen - OTP Verification after registration
 * Route: /auth/verify-phone
 */
export default function VerifyPhonePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, resendOTP, isLoading } = useContext(AuthContext);

  const phone = location.state?.phone || '+234 800 123 4567';
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCountdown <= 0) {
      setCanResend(true);
      return;
    }

    const timer = setInterval(() => {
      setResendCountdown(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

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

  const handleVerify = async () => {
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    const result = await verifyOTP(phone, otpCode);

    if (result.success) {
      // Animate boxes turning green
      addToast('Phone verified successfully!', 'success');
      setTimeout(() => {
        // Navigate to role selection or dashboard
        navigate('/dashboard');
      }, 800);
    } else {
      setError(result.error || 'Invalid OTP. Please try again.');
    }
  };

  const handleResendCode = async () => {
    const result = await resendOTP(phone);

    if (result.success) {
      setCanResend(false);
      setResendCountdown(60);
      addToast('Code resent successfully', 'success');
    } else {
      addToast('Failed to resend code. Please try again.', 'error');
    }
  };

  const handleBack = () => {
    navigate('/auth/register');
  };

  const formatCountdown = () => {
    const minutes = Math.floor(resendCountdown / 60);
    const seconds = resendCountdown % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SharedAuthLayout
      title="Verify Your Phone"
      subtitle={`Enter the 6-digit code sent to ${phone}`}
    >
      <div className={styles.container}>
        <OTPInput
          otp={otp}
          onChange={handleOtpChange}
          error={error}
          demoOTP="248719"
          disabled={isLoading}
        />

        <div className={styles.resendSection}>
          {canResend ? (
            <button
              type="button"
              onClick={handleResendCode}
              className={styles.resendLink}
              disabled={isLoading}
            >
              Resend Code
            </button>
          ) : (
            <p className={styles.countdown}>
              Resend code in {formatCountdown()}
            </p>
          )}
        </div>

        <AuthButton
          type="button"
          onClick={handleVerify}
          isLoading={isLoading}
          disabled={isLoading || otp.some(digit => digit === '')}
        >
          Verify
        </AuthButton>

        <button
          type="button"
          onClick={handleBack}
          className={styles.backButton}
          disabled={isLoading}
        >
          ← Back
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
