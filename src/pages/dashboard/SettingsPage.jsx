import { useState } from 'react';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import styles from './SettingsPage.module.css';

export default function SettingsPage({ onBack }) {
  const [toggles, setToggles] = useState({
    notifications: true,
    biometric: false,
    darkMode: false,
  });

  const handleToggle = (key) => {
    setToggles({
      ...toggles,
      [key]: !toggles[key],
    });
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
              />
              <label htmlFor="biometric" className={styles.toggleLabel}></label>
            </div>
          </div>

          {/* Dark Mode Toggle */}
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
                onChange={() => handleToggle('darkMode')}
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
          {/* Change Password */}
          <button className={styles.settingRowLink}>
            <p className={styles.settingLabel}>Change Password</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          {/* Two Factor Auth */}
          <button className={styles.settingRowLink}>
            <div>
              <p className={styles.settingLabel}>Two-Factor Authentication</p>
              <p className={styles.settingSubtext}>Disabled</p>
            </div>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          {/* Session Management */}
          <button className={styles.settingRowLink}>
            <p className={styles.settingLabel}>Active Sessions</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>
        </div>
      </div>

      {/* About Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>About</h3>
        <div className={styles.settingsList}>
          {/* Help & Support */}
          <button className={styles.settingRowLink}>
            <p className={styles.settingLabel}>Help & Support</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          {/* Terms of Service */}
          <button className={styles.settingRowLink}>
            <p className={styles.settingLabel}>Terms of Service</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          {/* Privacy Policy */}
          <button className={styles.settingRowLink}>
            <p className={styles.settingLabel}>Privacy Policy</p>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>
        </div>
      </div>

      {/* App Info Section */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>App Info</h3>
        <div className={styles.settingsList}>
          {/* App Version */}
          <div className={styles.settingRow}>
            <p className={styles.settingLabel}>App Version</p>
            <p className={styles.versionBadge}>v 1.0.0</p>
          </div>

          {/* Build Number */}
          <div className={styles.settingRow}>
            <p className={styles.settingLabel}>Build Number</p>
            <p className={styles.settingSubtext}>2024.05.001</p>
          </div>

          {/* Environment */}
          <div className={styles.settingRow}>
            <p className={styles.settingLabel}>Environment</p>
            <p className={styles.settingSubtext}>Production</p>
          </div>
        </div>
      </div>

      {/* Logout Button */}
      <button className={styles.logoutBtn}>Log Out</button>
    </>
  );
}
