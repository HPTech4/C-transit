import { useState, useContext } from 'react';
import { FaBars, FaWifi, FaCog, FaBell } from 'react-icons/fa';
import styles from './HeaderBar.module.css';

export default function HeaderBar({ onMenuClick }) {
  const [unreadNotifications, setUnreadNotifications] = useState(1); // Demo: 1 unread notification

  return (
    <header className={styles.header}>
      {/* Left: Hamburger Menu */}
      <button className={styles.menuBtn} onClick={onMenuClick} aria-label="Open menu">
        <FaBars size={24} />
      </button>

      {/* Center: Logo */}
      <div className={styles.logo}>
        <FaWifi size={16} />
        <span>C-Transit</span>
      </div>

      {/* Right: Action Buttons */}
      <div className={styles.actions}>
        <button className={styles.iconBtn} aria-label="Settings">
          <FaCog size={22} />
        </button>

        <div style={{ position: 'relative' }}>
          <button className={styles.iconBtn} aria-label="Notifications">
            <FaBell size={22} />
            {unreadNotifications > 0 && <div className={styles.notifBadge} />}
          </button>
        </div>
      </div>
    </header>
  );
}
