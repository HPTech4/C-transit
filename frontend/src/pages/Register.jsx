import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Register.module.css';
import {
  validateEmail,
  validatePassword,
  validateFullName,
  passwordsMatch,
  getPasswordStrength,
} from '../utils/validation';
import { AUTH_API_URL } from '../config/api';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    matricNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });

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

    if (!validateFullName(formData.firstname)) {
      newErrors.firstname = 'First name must be at least 2 characters';
    }

    if (!validateFullName(formData.lastname)) {
      newErrors.lastname = 'Last name must be at least 2 characters';
    }

    if (!formData.matricNumber.trim()) {
      newErrors.matricNumber = 'Matric number is required';
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

  const handleGoogleSignup = () => {
    setModalContent({
      title: 'Google Sign Up',
      message: 'Google OAuth registration is coming soon! For now, please create your account using the form above.'
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${AUTH_API_URL}/register`, {
        firstname: formData.firstname.trim(),
        lastname: formData.lastname.trim(),
        email: formData.email.trim(),
        matricNumber: formData.matricNumber.trim(),
        password: formData.password,
      });

      // Store token and redirect
      localStorage.setItem('token', response.data.token || 'registered');
      localStorage.setItem('studentEmail', formData.email.trim().toLowerCase());
      
      navigate('/dashboard');
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ form: error.response.data.message });
      } else {
        setErrors({ form: 'Registration failed. Please try again.' });
      }
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['#ff6b7a', '#ffa940', '#ffc53d', '#52c41a', '#1890ff'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];

  return (
    <div className={styles.hero}>
      <div className={styles.pageShell}>
        <div className={styles.container}>
          <h1 className={styles.title}>Create Your C Transit Wallet</h1>
          <p className={styles.subtitle}>Set up fast, cashless rides across campus in minutes.</p>

          {errors.form && <div className={styles.errorMessage}>{errors.form}</div>}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="firstname" className={styles.label}>First Name</label>
              <input
                id="firstname"
                type="text"
                name="firstname"
                placeholder="John Doe"
                value={formData.firstname}
                onChange={handleChange}
                className={`${styles.input} ${errors.firstname ? styles.invalid : ''}`}
                disabled={loading}
              />
              {errors.firstname && <span className={styles.errorText}>{errors.firstname}</span>}
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lastname" className={styles.label}>Last Name</label>
              <input
                id="lastname"
                type="text"
                name="lastname"
                placeholder="Doe"
                value={formData.lastname}
                onChange={handleChange}
                className={`${styles.input} ${errors.lastname ? styles.invalid : ''}`}
                disabled={loading}
              />
              {errors.lastname && <span className={styles.errorText}>{errors.lastname}</span>}
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email" className={styles.label}>Campus Email</label>
            <input
              id="email"
              type="email"
              name="email"
              placeholder="name.email@st.futminna.edu.ng"
              value={formData.email}
              onChange={handleChange}
              className={`${styles.input} ${errors.email ? styles.invalid : ''}`}
              disabled={loading}
            />
            {errors.email && <span className={styles.errorText}>{errors.email}</span>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="matricNumber" className={styles.label}>Matric Number</label>
            <input
              id="matricNumber"
              type="text"
              name="matricNumber"
              placeholder="e.g., 2021/001234"
              value={formData.matricNumber}
              onChange={handleChange}
              className={`${styles.input} ${errors.matricNumber ? styles.invalid : ''}`}
              disabled={loading}
            />
            {errors.matricNumber && <span className={styles.errorText}>{errors.matricNumber}</span>}
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
                onClick={handleGoogleSignup}
              disabled={loading}
            >
              Continue with Google
            </button>
          </div>

            <p className={styles.footnote}>
              Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
            </p>
          </form>

            {showModal && (
              <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
                  <div className={styles.modalIcon}>🚀</div>
                  <h2 className={styles.modalTitle}>{modalContent.title}</h2>
                  <p className={styles.modalMessage}>{modalContent.message}</p>
                  <button className={styles.modalBtn} onClick={() => setShowModal(false)}>
                    Got it
                  </button>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
