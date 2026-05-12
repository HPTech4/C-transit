import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import styles from './Login.module.css';
import { validateEmail } from '../utils/validation';
import { AUTH_API_URL } from '../config/api';
import { EmailIcon, LockIcon, EyeIcon, EyeOffIcon, LoadingSpinner, BusIcon, StudentCapIcon } from '../components/AnimatedIcons';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
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

      // Store only the token
      localStorage.setItem('token', response.data.token);

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
      {/* Floating background elements */}
      <BusIcon />
      <StudentCapIcon />

      <motion.div
        className={styles.pageShell}
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <motion.div
          className={styles.container}
          whileHover={{ boxShadow: "0 35px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.15)" }}
        >
          <motion.h1
            className={styles.title}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Welcome Back
          </motion.h1>
          <motion.p
            className={styles.subtitle}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Access your campus wallet and ride history in seconds.
          </motion.p>

          {successMessage && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={styles.errorMessage}
              style={{
                background: 'rgba(34, 197, 94, 0.15)',
                borderColor: 'rgba(34, 197, 94, 0.35)',
                color: '#86efac',
              }}
            >
              {successMessage}
            </motion.div>
          )}

          {errors.form && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: "spring", stiffness: 200 }}
              className={styles.errorMessage}
            >
              {errors.form}
            </motion.div>
          )}

          <motion.form
            className={styles.form}
            onSubmit={handleSubmit}
            noValidate
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <motion.div
              className={styles.formGroup}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <label htmlFor="email" className={styles.label}>Campus Email</label>
              <div className={styles.inputWrapper}>
                <EmailIcon />
                <motion.input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="name.email@st.futminna.edu.ng"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.email ? styles.invalid : ''}`}
                  disabled={loading}
                  whileFocus={{
                    boxShadow: "0 0 0 3px rgba(132, 178, 255, 0.2)"
                  }}
                />
              </div>
              {errors.email && (
                <motion.span
                  className={styles.errorText}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.email}
                </motion.span>
              )}
            </motion.div>

            <motion.div
              className={styles.formGroup}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <label htmlFor="password" className={styles.label}>Password</label>
              <div className={styles.passwordWrapper}>
                <LockIcon />
                <motion.input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`${styles.input} ${errors.password ? styles.invalid : ''}`}
                  disabled={loading}
                  whileFocus={{
                    boxShadow: "0 0 0 3px rgba(132, 178, 255, 0.2)"
                  }}
                />
                <motion.button
                  type="button"
                  className={styles.togglePassword}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                </motion.button>
              </div>
              {errors.password && (
                <motion.span
                  className={styles.errorText}
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {errors.password}
                </motion.span>
              )}
            </motion.div>

            <motion.div
              className={styles.row}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.a
                href="#"
                onClick={handleForgotPassword}
                className={styles.link}
                whileHover={{ x: 5, textDecoration: "underline" }}
              >
                Forgot password?
              </motion.a>
            </motion.div>

            <motion.div
              className={styles.actions}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <motion.button
                className={styles.btn}
                type="submit"
                disabled={loading}
                whileHover={!loading ? { scale: 1.02, boxShadow: "0 15px 35px rgba(132, 178, 255, 0.3)" } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <motion.div
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner />
                      Signing in...
                    </>
                  ) : (
                    'Sign in'
                  )}
                </motion.div>
              </motion.button>
              <motion.button
                className={styles.btnsec}
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                whileHover={!loading ? { scale: 1.02 } : {}}
                whileTap={!loading ? { scale: 0.98 } : {}}
              >
                🔗 Continue with Google
              </motion.button>
            </motion.div>

            <motion.p
              className={styles.footnote}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
            >
              New to C Transit?{' '}
              <Link to="/register" className={styles.link}>
                <motion.span
                  whileHover={{ textDecoration: "underline", x: 2 }}
                >
                  Create an account
                </motion.span>
              </Link>
            </motion.p>
          </motion.form>

          {showModal && (
            <motion.div
              className={styles.modalOverlay}
              onClick={() => setShowModal(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className={styles.modalContent}
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <motion.button
                  className={styles.modalClose}
                  onClick={() => setShowModal(false)}
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ×
                </motion.button>
                <motion.div
                  className={styles.modalIcon}
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  {modalContent.title.includes('Password') ? '🔐' : '🚀'}
                </motion.div>
                <h2 className={styles.modalTitle}>{modalContent.title}</h2>
                <p className={styles.modalMessage}>{modalContent.message}</p>
                <motion.button
                  className={styles.modalBtn}
                  onClick={() => setShowModal(false)}
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(132, 178, 255, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                >
                  Got it
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}