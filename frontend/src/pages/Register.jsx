import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './Register.module.css';
import {
  validateEmail,
  validatePassword,
  validateFullName,
  passwordsMatch,
  getPasswordStrength,
  getStrengthLabel,
} from '../utils/validation';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Update password strength on edit
    if (name === 'password') {
      setPasswordStrength(getPasswordStrength(value));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!validateFullName(formData.fullName)) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, and numbers';
    }

    if (!passwordsMatch(formData.password, formData.confirmPassword)) {
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
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // CSRF Token would go here
          // 'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        }),
        credentials: 'include', // Send cookies with request for session management
      });

      const data = await response.json();

      if (response.ok) {
        // Store token if JWT-based auth
        localStorage.setItem('token', data.token);
        navigate('/dashboard');
      } else {
        setErrors({ form: data.message || 'Registration failed' });
      }
    } catch (error) {
      setErrors({ form: 'Network error. Please try again.' });
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['#ff6b7a', '#ffa940', '#ffc53d', '#52c41a', '#1890ff'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  return (
    <div className={styles.hero}>
      <div className={styles.container}>
        <h1 className={styles.title}>Create Your C Transit Wallet</h1>
        <p className={styles.subtitle}>Set up fast, cashless rides across campus in minutes.</p>

        {errors.form && <div className={styles.errorMessage}>{errors.form}</div>}

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label htmlFor="fullName" className={styles.label}>Full Name</label>
            <input
              id="fullName"
              type="text"
              name="fullName"
              placeholder="John Doe"
              value={formData.fullName}
              onChange={handleChange}
              className={`${styles.input} ${errors.fullName ? styles.invalid : ''}`}
              disabled={loading}
            />
            {errors.fullName && <span className={styles.errorText}>{errors.fullName}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Campus Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="your.email@campus.edu"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.invalid : ''}`}
              disabled={loading}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create password"
                value={formData.password}
                onChange={handleChange}
                className={`${styles.input} ${errors.password ? styles.invalid : ''}`}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <span className={styles.errorText}>{errors.password}</span>}
            
            {formData.password && (
              <div className={styles.strengthIndicator}>
                <div className={styles.strengthBar}>
                  <div
                    className={styles.strengthFill}
                    style={{
                      width: `${(passwordStrength / 5) * 100}%`,
                      backgroundColor: strengthColors[passwordStrength - 1] || '#ddd',
                    }}
                  />
                </div>
                <span className={styles.strengthText}>
                  Strength: <strong>{strengthLabels[passwordStrength - 1] || 'Too weak'}</strong>
                </span>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="confirmPassword" className={styles.label}>Confirm Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                placeholder="Confirm password"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${styles.input} ${errors.confirmPassword ? styles.invalid : ''}`}
                disabled={loading}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label="Toggle confirm password visibility"
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <span className={styles.errorText}>{errors.confirmPassword}</span>}
          </div>

          <div className={styles.actions}>
            <button
              className={styles.btn}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>
            <button
              className={styles.btnsec}
              type="button"
              disabled={loading}
            >
              Continue with Google
            </button>
          </div>

          <p className={styles.footnote}>
            Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
