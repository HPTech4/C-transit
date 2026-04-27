import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaShieldAlt, FaUserTie } from 'react-icons/fa';

import PrimaryButton from '../components/Admin/PrimaryButton';
import {
  ADMIN_PLACEHOLDER_CREDENTIALS,
  setAdminSession,
} from '../config/adminAuth';

import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const helperText = useMemo(
    () => `Use ${ADMIN_PLACEHOLDER_CREDENTIALS.email} / ${ADMIN_PLACEHOLDER_CREDENTIALS.password}`,
    [],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter admin email and password.');
      return;
    }

    setLoading(true);

    setTimeout(() => {
      if (
        email.toLowerCase() !== ADMIN_PLACEHOLDER_CREDENTIALS.email
        || password !== ADMIN_PLACEHOLDER_CREDENTIALS.password
      ) {
        setError('Invalid admin credentials. Please use the placeholder details.');
        setLoading(false);
        return;
      }

      // Backend integration: replace this with POST /api/admin/login and store the server-issued token.
      setAdminSession({
        name: 'Operations Admin',
        email: ADMIN_PLACEHOLDER_CREDENTIALS.email,
        role: 'Super Admin',
      });

      navigate('/admin/dashboard', { replace: true });
    }, 800);
  };

  return (
    <div className={styles.wrapper}>
      <motion.section
        className={styles.loginCard}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className={styles.header}>
          <span className={styles.badge}>C-Transit Control</span>
          <h1>Admin Access Portal</h1>
          <p>Secure access for operations, finance, support, and oversight teams.</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label htmlFor="adminEmail">Admin Email</label>
          <input
            id="adminEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@ctransit.ng"
          />

          <label htmlFor="adminPassword">Password</label>
          <input
            id="adminPassword"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter secure password"
          />

          {error && <p className={styles.error}>{error}</p>}
          <p className={styles.helper}>{helperText}</p>

          <PrimaryButton type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in as Admin'}
          </PrimaryButton>
        </form>
      </motion.section>

      <motion.aside
        className={styles.infoCard}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <h2>Platform Security Layers</h2>
        <ul>
          <li>
            <FaShieldAlt /> Role-based privilege boundaries
          </li>
          <li>
            <FaLock /> Encrypted session management
          </li>
          <li>
            <FaUserTie /> Full admin audit log readiness
          </li>
        </ul>
      </motion.aside>
    </div>
  );
}
