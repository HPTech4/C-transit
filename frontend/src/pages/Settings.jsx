import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaCog,
  FaBell,
  FaShieldAlt,
  FaTrash,
  FaDownload,
  FaIdCard,
  FaCheckCircle,
  FaArrowRight,
  FaUsers,
  FaLock,
  FaInfoCircle,
} from 'react-icons/fa';
import styles from './Settings.module.css';

/**
 * Settings & Preferences Component
 * 
 * Manages user settings including:
 * - General settings (language, theme, currency)
 * - Notification preferences
 * - Privacy & security settings
 * - Data management (export, delete account)
 * 
 * BACKEND INTEGRATION:
 * - GET /api/user/preferences (load saved preferences)
 * - PUT /api/user/preferences (save settings changes)
 * - POST /api/user/delete-account (delete account)
 * - GET /api/user/download-data (download user data)
 */
export default function Settings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionModal, setActionModal] = useState({ title: '', message: '' });
  const [successMessage, setSuccessMessage] = useState('');

  // Mock preferences data (replace with API response)
  const [preferences, setPreferences] = useState({
    language: 'english',
    theme: 'light',
    currency: 'NGN',
    emailNotif: true,
    pushNotif: true,
    smsNotif: false,
    busAlerts: true,
    paymentAlerts: true,
    tripReminders: true,
    promos: false,
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('user_theme');
    const savedLanguage = localStorage.getItem('user_language');
    const savedCurrency = localStorage.getItem('user_currency');

    if (savedTheme || savedLanguage || savedCurrency) {
      setPreferences((previous) => ({
        ...previous,
        ...(savedTheme ? { theme: savedTheme } : {}),
        ...(savedLanguage ? { language: savedLanguage } : {}),
        ...(savedCurrency ? { currency: savedCurrency } : {}),
      }));
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    document.documentElement.lang = preferences.language === 'yoruba' ? 'yo' : preferences.language === 'igbo' ? 'ig' : 'en';
    localStorage.setItem('user_theme', preferences.theme);
    localStorage.setItem('user_language', preferences.language);
    localStorage.setItem('user_currency', preferences.currency);
  }, [preferences.theme, preferences.language, preferences.currency]);

  // BACKEND: PUT /api/user/preferences
  // Send: { preferences object }
  // Response: { success: true, preferences: {...updatedPrefs} }
  const handleSavePreferences = async (key, value) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    // TODO: Call API to save when backend is ready
    console.log('Preferences updated:', updated);
  };

  const showToast = (message) => {
    setSuccessMessage(message);
    window.clearTimeout(window.__settingsToastTimer);
    window.__settingsToastTimer = window.setTimeout(() => setSuccessMessage(''), 2500);
  };

  const openActionModal = (title, message) => {
    setActionModal({ title, message });
    setShowActionModal(true);
  };

  // BACKEND: POST /api/user/delete-account
  // Send: { password: "user_password" }
  // Response: { success: true, message: "Account deleted" }
  const handleDeleteAccount = async () => {
    // TODO: Call API and redirect to home
    setShowDeleteConfirm(false);
    showToast('Delete request captured. Your account removal flow would continue here.');
  };

  // BACKEND: GET /api/user/download-data
  // Response: Download user data as JSON file
  const handleDownloadData = async () => {
    // TODO: Call API to download data
    console.log('Downloading user data...');
    showToast('Your data export has been prepared.');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div className={styles.settingsPage} initial="hidden" animate="visible" variants={containerVariants}>
      {/* Header */}
      <div className={styles.header}>
        <motion.button className={styles.backBtn} onClick={() => navigate('/dashboard')} whileHover={{ x: -5 }}>
          <FaArrowLeft /> Back
        </motion.button>
        <h1>Settings & Preferences</h1>
      </div>

      {successMessage && (
        <motion.div className={styles.toast} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
          <FaCheckCircle /> {successMessage}
        </motion.div>
      )}

      <div className={styles.container}>
        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'general' ? styles.active : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <FaCog /> General
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <FaBell /> Notifications
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'privacy' ? styles.active : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            <FaShieldAlt /> Privacy & Security
          </button>
        </div>

        {/* Tab Content */}
        <motion.div variants={itemVariants}>
          {/* General Settings */}
          {activeTab === 'general' && <GeneralSettings preferences={preferences} onSave={handleSavePreferences} />}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <NotificationSettings preferences={preferences} onSave={handleSavePreferences} />
          )}

          {/* Privacy & Security */}
          {activeTab === 'privacy' && (
            <PrivacySettings
              onDownload={handleDownloadData}
              onDelete={() => setShowDeleteConfirm(true)}
              onShowInfo={openActionModal}
            />
          )}
        </motion.div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {showActionModal && (
        <ActionInfoModal
          title={actionModal.title}
          message={actionModal.message}
          onClose={() => setShowActionModal(false)}
        />
      )}
    </motion.div>
  );
}

/**
 * General Settings Tab
 */
function GeneralSettings({ preferences, onSave }) {
  return (
    <motion.div className={styles.settingsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2>General Settings</h2>

      <div className={styles.settingItem}>
        <div className={styles.settingLabel}>
          <label>Language</label>
          <p>Choose your preferred language</p>
        </div>
        <select
          value={preferences.language}
          onChange={(e) => onSave('language', e.target.value)}
          className={styles.select}
        >
          <option value="english">English</option>
          <option value="yoruba">Yoruba</option>
          <option value="igbo">Igbo</option>
          <option value="hausa">Hausa</option>
        </select>
      </div>

      <div className={styles.settingItem}>
        <div className={styles.settingLabel}>
          <label>Theme</label>
          <p>Choose your preferred theme</p>
        </div>
        <div className={styles.themeButtons}>
          <motion.button
            type="button"
            className={`${styles.themeBtn} ${preferences.theme === 'light' ? styles.active : ''}`}
            onClick={() => onSave('theme', 'light')}
            whileHover={{ scale: 1.05 }}
          >
            ☀️ Light
          </motion.button>
          <motion.button
            type="button"
            className={`${styles.themeBtn} ${preferences.theme === 'dark' ? styles.active : ''}`}
            onClick={() => onSave('theme', 'dark')}
            whileHover={{ scale: 1.05 }}
          >
            🌙 Dark
          </motion.button>
        </div>
      </div>

      <div className={styles.settingItem}>
        <div className={styles.settingLabel}>
          <label>Currency</label>
          <p>All amounts are displayed in Nigerian Naira (₦)</p>
        </div>
        <select
          value={preferences.currency}
          onChange={(e) => onSave('currency', e.target.value)}
          className={styles.select}
          disabled
          aria-disabled="true"
        >
          <option value="NGN">Nigerian Naira (₦)</option>
        </select>
      </div>
    </motion.div>
  );
}

/**
 * Notification Settings Tab
 */
function NotificationSettings({ preferences, onSave }) {
  return (
    <motion.div className={styles.settingsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2>Notification Preferences</h2>

      <div className={styles.sectionGroup}>
        <h3>Notification Methods</h3>

        <div className={styles.toggleItem}>
          <div className={styles.toggleLabel}>
            <label>Email Notifications</label>
            <p>Receive updates via email</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.emailNotif}
              onChange={(e) => onSave('emailNotif', e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.toggleItem}>
          <div className={styles.toggleLabel}>
            <label>Push Notifications</label>
            <p>Receive app notifications</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.pushNotif}
              onChange={(e) => onSave('pushNotif', e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.toggleItem}>
          <div className={styles.toggleLabel}>
            <label>SMS Alerts</label>
            <p>Receive text messages</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.smsNotif}
              onChange={(e) => onSave('smsNotif', e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>

      <div className={styles.sectionGroup}>
        <h3>Notification Types</h3>

        <div className={styles.toggleItem}>
          <div className={styles.toggleLabel}>
            <label>🚌 Bus Arrival Alerts</label>
            <p>Get notified when bus is near</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.busAlerts}
              onChange={(e) => onSave('busAlerts', e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.toggleItem}>
          <div className={styles.toggleLabel}>
            <label>💳 Payment Confirmations</label>
            <p>Confirm after each transaction</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.paymentAlerts}
              onChange={(e) => onSave('paymentAlerts', e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.toggleItem}>
          <div className={styles.toggleLabel}>
            <label>📍 Trip Reminders</label>
            <p>Remind before your scheduled trips</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.tripReminders}
              onChange={(e) => onSave('tripReminders', e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>

        <div className={styles.toggleItem}>
          <div className={styles.toggleLabel}>
            <label>🎉 Promotions & Offers</label>
            <p>Latest deals and special offers</p>
          </div>
          <label className={styles.toggle}>
            <input
              type="checkbox"
              checked={preferences.promos}
              onChange={(e) => onSave('promos', e.target.checked)}
            />
            <span className={styles.slider}></span>
          </label>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Privacy & Security Tab
 */
function PrivacySettings({ onDownload, onDelete, onShowInfo }) {
  const navigate = useNavigate();

  return (
    <motion.div className={styles.settingsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2>Privacy & Security</h2>

      <div className={styles.sectionGroup}>
        <h3>KYC Verification</h3>
        <div className={styles.actionItem}>
          <div>
            <label>Identity verification status</label>
            <p>Complete your KYC to enable wallet linking and dispute resolution tools</p>
          </div>
          <motion.button
            className={styles.actionBtn}
            onClick={() => navigate('/kyc')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaIdCard /> Complete KYC
          </motion.button>
        </div>
      </div>

      <div className={styles.sectionGroup}>
        <h3>Two-Factor Authentication</h3>
        <div className={styles.actionItem}>
          <div>
            <label>Enable 2FA</label>
            <p>Add extra security to your account</p>
          </div>
          <motion.button
            className={styles.actionBtn}
            type="button"
            onClick={() => {
              onShowInfo('Two-Factor Authentication', '2FA setup would connect to the backend here. For now, this is a working premium placeholder.');
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaLock /> Set Up 2FA
          </motion.button>
        </div>
      </div>

      <div className={styles.sectionGroup}>
        <h3>Active Sessions</h3>
        <div className={styles.actionItem}>
          <div>
            <label>View Active Sessions</label>
            <p>Manage devices where you're logged in</p>
          </div>
          <motion.button
            className={styles.actionBtn}
            type="button"
            onClick={() => {
              onShowInfo('Active Sessions', 'This section would list devices, IPs, and login timestamps once connected to the API.');
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaUsers /> View Sessions
          </motion.button>
        </div>
      </div>

      <div className={styles.sectionGroup}>
        <h3>Data Management</h3>

        <div className={styles.actionItem}>
          <div>
            <label>📥 Download Your Data</label>
            <p>Get a copy of all your data (GDPR compliance)</p>
          </div>
          <motion.button
            className={styles.actionBtn}
            onClick={onDownload}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaDownload /> Download
          </motion.button>
        </div>

        <div className={styles.actionItem}>
          <div>
            <label>🗑️ Delete Account</label>
            <p>Permanently delete your account and all data</p>
          </div>
          <motion.button
            className={`${styles.actionBtn} ${styles.dangerBtn}`}
            onClick={onDelete}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaTrash /> Delete
          </motion.button>
        </div>
      </div>

      <div className={styles.sectionGroup}>
        <h3>Legal</h3>
        <div className={styles.legalLinks}>
          <a href="#" className={styles.link}>
            📄 Privacy Policy
          </a>
          <a href="#" className={styles.link}>
            📋 Terms & Conditions
          </a>
        </div>
      </div>
    </motion.div>
  );
}

function ActionInfoModal({ title, message, onClose }) {
  return (
    <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <h2>{title}</h2>
        <p className={styles.infoText}>
          <FaInfoCircle /> {message}
        </p>

        <div className={styles.modalActions}>
          <motion.button className={styles.cancelBtn} onClick={onClose} whileHover={{ scale: 1.02 }}>
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/**
 * Delete Account Confirmation Modal
 */
function DeleteConfirmModal({ onConfirm, onCancel }) {
  const [password, setPassword] = useState('');

  return (
    <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div className={styles.modal} initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
        <h2>Delete Account</h2>
        <p className={styles.warningText}>
          ⚠️ This action is permanent and cannot be undone. All your data will be deleted.
        </p>

        <div className={styles.formGroup}>
          <label>Enter your password to confirm</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className={styles.input}
          />
        </div>

        <div className={styles.modalActions}>
          <motion.button
            className={styles.cancelBtn}
            onClick={onCancel}
            whileHover={{ scale: 1.02 }}
          >
            Cancel
          </motion.button>
          <motion.button
            className={`${styles.submitBtn} ${styles.dangerBtn}`}
            onClick={onConfirm}
            disabled={!password}
            whileHover={{ scale: 1.02 }}
          >
            Delete Account
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
