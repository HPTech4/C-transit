import { useState } from 'react';
import { FaArrowLeft, FaEllipsisV, FaWifi, FaWallet, FaArrowRight, FaToggleOn, FaToggleOff, FaChevronRight } from 'react-icons/fa';
import styles from './NfcCardPage.module.css';

export default function NfcCardPage({ onBack }) {
  const [cardFrozen, setCardFrozen] = useState(false);

  const demoActivity = [
    { id: '1', terminal: 'Victoria Island Terminal', time: 'Today, 9:41 AM', amount: 150 },
    { id: '2', terminal: 'Lekki Expressway Bus Stop', time: 'Today, 7:20 AM', amount: 100 },
    { id: '3', terminal: 'Yaba Metro Station', time: 'Yesterday, 6:15 PM', amount: 100 },
  ];

  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <FaArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>NFC Card</h1>
        <button className={styles.moreBtn}>
          <FaEllipsisV size={20} />
        </button>
      </div>

      {/* NFC Card Visual */}
      <div className={styles.nfcCard}>
        <div className={styles.cardTop}>
          <FaWifi size={20} color="white" />
          <span className={styles.cardBadge}>Active</span>
        </div>
        <p className={styles.cardNumber}>**** **** **** 5678</p>
        <div className={styles.cardBottom}>
          <p>Wallet No. CT-9NL-S67890</p>
        </div>
      </div>

      {/* Balance + Actions */}
      <div className={styles.balanceDisplay}>
        <p className={styles.balanceAmount}>₦2,350.50</p>
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn}>
            <FaWallet size={24} />
            <span>Fund</span>
          </button>
          <button className={styles.actionBtn}>
            <FaArrowRight size={24} />
            <span>Transfer</span>
          </button>
          <button className={styles.actionBtn}>
            <FaEllipsisV size={24} />
            <span>More</span>
          </button>
          <button className={styles.actionBtn}>
            <FaChevronRight size={24} />
            <span>Details</span>
          </button>
        </div>
      </div>

      {/* Recent Activity (Mini List) */}
      <div className={styles.activitySection}>
        <h3 className={styles.activityTitle}>Recent Activity</h3>
        <div className={styles.activityList}>
          {demoActivity.map(activity => (
            <div key={activity.id} className={styles.activityRow}>
              <div className={styles.activityIcon}>
                <FaWifi />
              </div>
              <div className={styles.activityInfo}>
                <p className={styles.activityTerminal}>{activity.terminal}</p>
                <p className={styles.activityTime}>{activity.time}</p>
              </div>
              <p className={styles.activityAmount}>-₦{activity.amount}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Card Settings */}
      <div className={styles.settingsSection}>
        <h3 className={styles.settingsTitle}>Card Settings</h3>
        <div className={styles.settingsList}>
          {/* Freeze Card Toggle */}
          <div className={styles.settingRow}>
            <span className={styles.settingLabel}>Freeze Card</span>
            <button
              className={styles.toggle}
              onClick={() => setCardFrozen(!cardFrozen)}
            >
              {cardFrozen ? <FaToggleOn color="#1A56DB" size={24} /> : <FaToggleOff color="#9CA3AF" size={24} />}
            </button>
          </div>

          {/* Card Settings Link */}
          <button className={styles.settingRow}>
            <span className={styles.settingLabel}>Card Settings</span>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          {/* Replace Card */}
          <button className={styles.settingRow}>
            <span className={styles.settingLabel}>Replace Card</span>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          {/* View Tap History */}
          <button className={styles.settingRow}>
            <span className={styles.settingLabel}>View Tap History</span>
            <FaChevronRight color="#9CA3AF" size={16} />
          </button>

          {/* Card Status */}
          <div className={styles.settingRow}>
            <div>
              <span className={styles.settingLabel}>Card Status</span>
              <p className={styles.settingSubtext}>Card is ready to use</p>
            </div>
            <span className={styles.activeBadge}>Active</span>
          </div>

          {/* View Details Link */}
          <button className={`${styles.settingRow} ${styles.linkRow}`}>
            <span className={styles.settingLink}>View Details</span>
          </button>
        </div>
      </div>
    </>
  );
}
