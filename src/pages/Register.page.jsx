import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import SharedAuthLayout from '../../components/Auth/SharedAuthLayout';
import InputField from '../../components/Auth/InputField';
import PasswordInput from '../../components/Auth/PasswordInput';
import PhoneSelector from '../../components/Auth/PhoneSelector';
import TermsCheckbox from '../../components/Auth/TermsCheckbox';
import AuthButton from '../../components/Auth/AuthButton';
import SocialAuthButtons from '../../components/Auth/SocialAuthButtons';
import { validateEmail } from '../../utils/validation';
import { calculatePasswordStrength, getPasswordStrengthLabel } from '../../utils/passwordUtils';
import styles from './Register.page.module.css';

/**
 * Register Screen
 * Route: /auth/register
 */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, isLoading, error, setError } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    countryCode: '+234',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });

  const [errors, setErrors] = useState({});
  const [toasts, setToasts] = useState([]);
  const [passwordStrength, setPasswordStrength] = useState({ strength: 'weak', level: 0 });

  const addToast = (message, type = 'error') => {
    const id = Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Update password strength meter
    if (name === 'password') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const handlePhoneChange = (data) => {
    setFormData(prev => ({
      ...prev,
      countryCode: data.countryCode,
      phoneNumber: data.phoneNumber,
    }));
    if (errors.phoneNumber) {
      setErrors(prev => ({
        ...prev,
        phoneNumber: '',
      }));
    }
  };

  const handlePhoneCountryChange = (code) => {
    setFormData(prev => ({
      ...prev,
      countryCode: code,
    }));
  };

  const handleTermsChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      termsAccepted: checked,
    }));
    if (errors.termsAccepted) {
      setErrors(prev => ({
        ...prev,
        termsAccepted: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Full name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    // Phone validation
    const phoneDigits = formData.phoneNumber.replace(/\D/g, '');
    if (!phoneDigits) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (phoneDigits.length < 10) {
      newErrors.phoneNumber = 'Phone number must be at least 10 digits';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    // Confirm password validation
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Terms checkbox
    if (!formData.termsAccepted) {
      newErrors.termsAccepted = 'You must accept the terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      phone: `${formData.countryCode}${formData.phoneNumber.replace(/\D/g, '')}`,
      password: formData.password,
    });

    if (result.success) {
      addToast('Account created successfully!', 'success');
      setTimeout(() => {
        // Navigate to verify phone screen
        navigate('/auth/verify-phone', {
          state: { phone: `${formData.countryCode}${formData.phoneNumber.replace(/\D/g, '')}` },
        });
      }, 1500);
    } else {
      addToast(result.error || 'Registration failed. Please try again.', 'error');
    }
  };

  const handleSocialRegister = (provider) => {
    addToast(`${provider.charAt(0).toUpperCase() + provider.slice(1)} signup coming soon!`, 'info');
  };

  const handleFooterLink = () => {
    navigate('/auth/login');
  };

  const handleTermsClick = () => {
    alert('Terms & Conditions (Coming Soon)');
  };

  const handlePrivacyClick = () => {
    alert('Privacy Policy (Coming Soon)');
  };

  return (
    <SharedAuthLayout
      title="Create Account"
      subtitle="Join C-Transit today"
      footerText="Already have an account?"
      footerLinkText="Login"
      onFooterLinkClick={handleFooterLink}
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.errorBanner} role="alert">
            {error}
          </div>
        )}

        <InputField
          label="Full Name"
          placeholder="John Doe"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          error={errors.fullName}
          required
          autoComplete="name"
        />

        <InputField
          label="Email Address"
          placeholder="admin@st.futminna.edu"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          error={errors.email}
          required
          inputMode="email"
          autoComplete="email"
        />

        <PhoneSelector
          countryCode={formData.countryCode}
          phoneNumber={formData.phoneNumber}
          onChange={handlePhoneChange}
          onCountryChange={handlePhoneCountryChange}
          error={errors.phoneNumber}
          required
        />

        <PasswordInput
          label="Password"
          placeholder="Create a strong password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          error={errors.password}
          required
          showStrengthMeter
          strengthLevel={passwordStrength.level}
          strengthLabel={getPasswordStrengthLabel(formData.password)}
          autoComplete="new-password"
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Re-enter your password"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
        />

        <TermsCheckbox
          checked={formData.termsAccepted}
          onChange={handleTermsChange}
          onTermsClick={handleTermsClick}
          onPrivacyClick={handlePrivacyClick}
          error={errors.termsAccepted}
        />

        <AuthButton
          type="submit"
          isLoading={isLoading}
          disabled={isLoading}
        >
          Create Account
        </AuthButton>

        <SocialAuthButtons
          onGoogleClick={() => handleSocialRegister('google')}
          onAppleClick={() => handleSocialRegister('apple')}
          onFacebookClick={() => handleSocialRegister('facebook')}
          disabled={isLoading}
        />
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
