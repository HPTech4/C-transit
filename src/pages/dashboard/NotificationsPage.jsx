import { useState } from 'react';
import { FaArrowLeft, FaEllipsisV } from 'react-icons/fa';
import styles from './NotificationsPage.module.css';

export default function NotificationsPage({ onBack }) {
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Wallet Funded', message: 'You have successfully funded your wallet with ₦5,000', time: '2 hours ago', read: false, type: 'success' },
    { id: '2', title: 'Low Balance Alert', message: 'Your wallet balance is below ₦100. Fund now to continue using C-Transit.', time: '1 day ago', read: false, type: 'warning' },
    { id: '3', title: 'Card Activated', message: 'Your new NFC card **** 5678 has been activated successfully', time: '2 days ago', read: true, type: 'info' },
    { id: '4', title: 'Fare Charged', message: 'Fare payment of ₦100 has been charged to your account', time: '3 days ago', read: true, type: 'info' },
    { id: '5', title: 'Security Alert', message: 'Your account was accessed from a new device. Please verify if this was you.', time: '1 week ago', read: true, type: 'alert' },
  ]);

  const handleMarkAsRead = (id) => {
    setNotifications(notifications.map(notif =>
      notif.id === id ? { ...notif, read: true } : notif
    ));
  };

  const handleDeleteNotification = (id) => {
    setNotifications(notifications.filter(notif => notif.id !== id));
  };

  const todayNotifications = notifications.filter(n => n.time.includes('ago') && (n.time.includes('hours') || n.time.includes('minutes')));
  const earlierNotifications = notifications.filter(n => !n.time.includes('hours') && !n.time.includes('minutes'));

  return (
    <div className={styles.notificationPage}>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <FaArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Notifications</h1>
      </div>

      {/* Today Notifications */}
      {todayNotifications.length > 0 && (
        <div className={styles.notificationGroup}>
          <p className={styles.groupTitle}>Today</p>
          <div className={styles.notificationList}>
            {todayNotifications.map(notif => (
              <div
                key={notif.id}
                className={`${styles.notificationRow} ${!notif.read ? styles.unread : ''} ${styles[`type-${notif.type}`]}`}
              >
                <div className={styles.notificationIcon}>
                  <span className={styles.iconBadge}></span>
                </div>
                <div className={styles.notificationContent}>
                  <p className={styles.notificationTitle}>{notif.title}</p>
                  <p className={styles.notificationMessage}>{notif.message}</p>
                  <p className={styles.notificationTime}>{notif.time}</p>
                </div>
                <div className={styles.notificationActions}>
                  <button
                    className={styles.moreBtn}
                    onClick={() => handleMarkAsRead(notif.id)}
                  >
                    <FaEllipsisV size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Earlier Notifications */}
      {earlierNotifications.length > 0 && (
        <div className={styles.notificationGroup}>
          <p className={styles.groupTitle}>Earlier</p>
          <div className={styles.notificationList}>
            {earlierNotifications.map(notif => (
              <div
                key={notif.id}
                className={`${styles.notificationRow} ${!notif.read ? styles.unread : ''} ${styles[`type-${notif.type}`]}`}
              >
                <div className={styles.notificationIcon}>
                  <span className={styles.iconBadge}></span>
                </div>
                <div className={styles.notificationContent}>
                  <p className={styles.notificationTitle}>{notif.title}</p>
                  <p className={styles.notificationMessage}>{notif.message}</p>
                  <p className={styles.notificationTime}>{notif.time}</p>
                </div>
                <div className={styles.notificationActions}>
                  <button
                    className={styles.moreBtn}
                    onClick={() => handleDeleteNotification(notif.id)}
                  >
                    <FaEllipsisV size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No Notifications</p>
          <p className={styles.emptyMessage}>You're all caught up!</p>
        </div>
      )}
    </div>
  );
}
