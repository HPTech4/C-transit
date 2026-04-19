import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from './Login.module.css';
import { validateEmail } from '../utils/validation';
import { AUTH_API_URL } from '../config/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: localStorage.getItem('studentEmail') || '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState({ title: '', message: '' });

  const getUserNameFromResponse = (data) => {
    const candidateNames = [
      data?.user?.name,
      data?.user?.fullName,
      data?.user?.fullname,
      [data?.user?.firstname, data?.user?.lastname].filter(Boolean).join(' ').trim(),
      data?.name,
      data?.fullName,
      data?.fullname,
      [data?.firstname, data?.lastname].filter(Boolean).join(' ').trim(),
    ];

    const directName = candidateNames.find(
      (value) => typeof value === 'string' && value.trim().length > 0,
    );

    if (directName) {
      return directName.trim();
    }

    const token = data?.token;
    if (typeof token !== 'string' || !token.includes('.')) {
      return '';
    }

    try {
      const payloadBase64 = token.split('.')[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      const paddedPayload = payloadBase64.padEnd(Math.ceil(payloadBase64.length / 4) * 4, '=');
      const payload = JSON.parse(atob(paddedPayload));

      const tokenNames = [
        payload?.name,
        payload?.fullName,
        payload?.fullname,
        [payload?.firstname, payload?.lastname].filter(Boolean).join(' ').trim(),
      ];

      const tokenName = tokenNames.find(
        (value) => typeof value === 'string' && value.trim().length > 0,
      );

      return tokenName ? tokenName.trim() : '';
    } catch {
      return '';
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setModalContent({
      title: 'Forgot Password',
      message: 'Password recovery feature is coming soon! Please contact your campus administrator for assistance.'
    });
    setShowModal(true);
  };

  const handleGoogleLogin = () => {
    setModalContent({
      title: 'Google Login',
      message: 'Google OAuth integration is coming soon! Stay tuned for this convenient login option.'
    });
    setShowModal(true);
  };

  useEffect(() => {
    if (!location.state?.successMessage) {
      return undefined;
    }

    setSuccessMessage(location.state.successMessage);

    const timer = setTimeout(() => {
      setSuccessMessage('');
    }, 3500);

    return () => clearTimeout(timer);
  }, [location.state]);


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getMatricNumberFromResponse = (data) => {
    const candidates = [
      data?.user?.matricNumber,
      data?.user?.matric_number,
      data?.user?.matricNo,
      data?.user?.matric,
      data?.matricNumber,
      data?.matric_number,
      data?.matricNo,
      data?.matric,
    ];

    const resolved = candidates.find(
      (value) => value !== undefined && value !== null && String(value).trim().length > 0,
    );

    return resolved ? String(resolved).trim() : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, {
        email: formData.email.trim(),
        password: formData.password,
      });

      // Store token and user info
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('studentEmail', formData.email.trim().toLowerCase());

      // Persist the logged-in user's name for dashboard rendering.
      const resolvedUserName = getUserNameFromResponse(response.data);
      if (resolvedUserName) {
        localStorage.setItem('userName', resolvedUserName);
      }

      const resolvedMatricNumber = getMatricNumberFromResponse(response.data);
      if (resolvedMatricNumber) {
        localStorage.setItem('matricNumber', resolvedMatricNumber);
      }

      setSuccessMessage('Login successful. Redirecting to dashboard...');
      sessionStorage.setItem('authSuccessMessage', 'Login successful. Welcome back.');

      // Redirect to dashboard after showing feedback.
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 700);
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ form: error.response.data.message });
      } else {
        setErrors({ form: 'Login failed. Please try again.' });
      }
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.hero}>
      <div className={styles.pageShell}>
      
        <div className={styles.container}>
          <h1 className={styles.title}>Welcome Back</h1>
          <p className={styles.subtitle}>Access your campus wallet and ride history in seconds.</p>

          {successMessage && (
            <div
              className={styles.errorMessage}
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                borderColor: 'rgba(34, 197, 94, 0.35)',
                color: '#86efac',
              }}
            >
              {successMessage}
            </div>
          )}

          {errors.form && <div className={styles.errorMessage}>{errors.form}</div>}

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
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
            <label htmlFor="password" className={styles.label}>Password</label>
            <div className={styles.passwordWrapper}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Enter your password"
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
          </div>

          <div className={styles.row}>
            <a href="#" onClick={handleForgotPassword} className={styles.link}>Forgot password?</a>
          </div>

          <div className={styles.actions}>
            <button
              className={styles.btn}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
            <button
              className={styles.btnsec}
              type="button"
                onClick={handleGoogleLogin}
              disabled={loading}
            >
              Continue with Google
            </button>
          </div>

          <p className={styles.footnote}>
            New to C Transit? <Link to="/register" className={styles.link}>Create an account</Link>
          </p>
          </form>

            {showModal && (
              <div className={styles.modalOverlay} onClick={() => setShowModal(false)}>
                <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                  <button className={styles.modalClose} onClick={() => setShowModal(false)}>×</button>
                  <div className={styles.modalIcon}>
                    {modalContent.title.includes('Password') ? '🔐' : '🚀'}
                  </div>
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