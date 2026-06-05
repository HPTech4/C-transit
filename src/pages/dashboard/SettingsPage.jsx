import { useState, useEffect } from 'react';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import styles from './SettingsPage.module.css';

const User_API_URL = '/api';

export default function SettingsPage({ onBack, onLogout }) {
  const [toggles, setToggles] = useState({
    notifications: false,
    biometric: false,
    darkMode: false,
  });
  const [toggleLoading, setToggleLoading] = useState({});
  const [settingsError, setSettingsError] = useState(null);

  // Load saved settings from API on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await axios.get(`${User_API_URL}/users/settings`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setToggles({
          notifications: response.data.notifications ?? false,
          biometric: response.data.biometric ?? false,
          darkMode: false, // not yet supported
        });
      } catch (err) {
        console.error('Failed to load settings:', err);
        setSettingsError('Failed to load settings');
      }
    };

    fetchSettings();
  }, []);

  const handleToggle = async (key) => {
    const newValue = !toggles[key];

    // Optimistically update UI
    setToggles((prev) => ({ ...prev, [key]: newValue }));
    setToggleLoading((prev) => ({ ...prev, [key]: true }));

    try {
      const token = localStorage.getItem('authToken');
      await axios.patch(
        `${User_API_URL}/users/settings`,
        { [key]: newValue },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(`Failed to update ${key}:`, err);
      // Revert toggle if API call fails
      setToggles((prev) => ({ ...prev, [key]: !newValue }));
      setSettingsError(`Failed to update ${key} setting`);
    } finally {
      setToggleLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleChangePassword = () => {
    // Navigate to change password flow
    // e.g. onNavigate('changePassword') or open a modal
    alert('Change Password coming soon');
  };

  const handle2FA = () => {
    // Navigate to 2FA setup flow
    alert('Two-Factor Authentication coming soon');
  };

  const handleActiveSessions = () => {
    // Navigate to sessions management
    alert('Active Sessions coming soon');
  };

  const handleHelpSupport = () => {
    window.open('mailto:support@ctransit.com', '_blank');
  };

  const handleTerms = () => {
    window.open('https://ctransit.com/terms', '_blank');
  };

  const handlePrivacyPolicy = () => {
    window.open('https://ctransit.com/privacy', '_blank');
  };

  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <FaArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Settings</h1>
      </div>

      {/* Settings Error */}
      {settingsError && (
        <p className={styles.errorMessage}>{settingsError}</p>
      )}

      {/* Preferences Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Preferences</h3>
        <div className={styles.settingsList}>

          {/* Notifications Toggle */}
          <div className={styles.settingRow}>
            <div>
              <p className={styles.settingLabel}>Push Notifications</p>
              <p className={styles.settingSubtext}>Get alerts about your transactions</p>
            </div>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="notifications"
                checked={toggles.notifications}
                onChange={() => handleToggle('notifications')}
                className={styles.toggleInput}
                disabled={toggleLoading.notifications}
              />
              <label htmlFor="notifications" className={styles.toggleLabel}></label>
            </div>
          </div>

          {/* Biometric Toggle */}
          <div className={styles.settingRow}>
            <div>
              <p className={styles.settingLabel}>Biometric Login</p>
              <p className={styles.settingSubtext}>Use fingerprint to log in</p>
            </div>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="biometric"
                checked={toggles.biometric}
                onChange={() => handleToggle('biometric')}
                className={styles.toggleInput}
                disabled={toggleLoading.biometric}
              />
              <label htmlFor="biometric" className={styles.toggleLabel}></label>
            </div>
          </div>

          {/* Dark Mode Toggle - disabled, coming soon */}
          <div className={styles.settingRow}>
            <div>
              <p className={styles.settingLabel}>Dark Mode</p>
              <p className={styles.settingSubtext}>Coming soon</p>
            </div>
            <div className={styles.toggleSwitch}>
              <input
                type="checkbox"
                id="darkMode"
                checked={toggles.darkMode}
                onChange={() => {}}
                className={styles.toggleInput}
                disabled
              />
              <label htmlFor="darkMode" className={styles.toggleLabel}></label>
            </div>
          </div>

        </div>
      </div>

      {/* Security Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Security</h3>
        <div className={styles.settingsList}>

          <button className={styles.settingRowLink} onClick={handleChangePassword}>
            <p className={styles.settingLabel}>Change Password</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          <button className={styles.settingRowLink} onClick={handle2FA}>
            <div>
              <p className={styles.settingLabel}>Two-Factor Authentication</p>
              <p className={styles.settingSubtext}>Disabled</p>
            </div>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          <button className={styles.settingRowLink} onClick={handleActiveSessions}>
            <p className={styles.settingLabel}>Active Sessions</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

        </div>
      </div>

      {/* About Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>About</h3>
        <div className={styles.settingsList}>

          <button className={styles.settingRowLink} onClick={handleHelpSupport}>
            <p className={styles.settingLabel}>Help & Support</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          <button className={styles.settingRowLink} onClick={handleTerms}>
            <p className={styles.settingLabel}>Terms of Service</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          <button className={styles.settingRowLink} onClick={handlePrivacyPolicy}>
            <p className={styles.settingLabel}>Privacy Policy</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

        </div>
      </div>

      {/* App Info Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>App Info</h3>
        <div className={styles.settingsList}>

          <div className={styles.settingRow}>
            <p className={styles.settingLabel}>App Version</p>
            <p className={styles.versionBadge}>v 1.0.0</p>
          </div>

          <div className={styles.settingRow}>
            <p className={styles.settingLabel}>Build Number</p>
            <p className={styles.settingSubtext}>2024.05.001</p>
          </div>

          <div className={styles.settingRow}>
            <p className={styles.settingLabel}>Environment</p>
            <p className={styles.settingSubtext}>Production</p>
          </div>

        </div>
      </div>

      {/* Logout Button */}
      <button className={styles.logoutBtn} onClick={onLogout}>
        Log Out
      </button>
    </>
  );
}