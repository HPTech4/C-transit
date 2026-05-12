import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTimes, FaCheck } from 'react-icons/fa';
import styles from './NotificationCenter.module.css';

/**
 * NotificationCenter Component
 * 
 * Notification system with:
 * - Bell icon with unread count badge
 * - Notification drawer/dropdown
 * - Different notification types (bus, payment, trip, promo, system)
 * - Mark as read functionality
 * - Delete notifications
 * 
 * BACKEND INTEGRATION:
 * - GET /api/notifications (fetch all notifications)
 * - POST /api/notifications/mark-read (mark as read)
 * - DELETE /api/notifications/:id (delete notification)
 * - WebSocket for real-time notifications (optional)
 */
export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Mock notifications (replace with API response)
  useEffect(() => {
    const mockNotifications = [
      {
        id: 1,
        type: 'bus',
        title: 'Bus Arriving Soon',
        message: 'Bus to Engineering Block arriving in 5 minutes',
        timestamp: new Date(Date.now() - 5 * 60000), // 5 mins ago
        isRead: false,
        icon: '🚌',
        actionUrl: '/dashboard',
      },
      {
        id: 2,
        type: 'payment',
        title: 'Payment Successful',
        message: 'Wallet recharged with ₦5,000',
        timestamp: new Date(Date.now() - 30 * 60000), // 30 mins ago
        isRead: false,
        icon: '💳',
        actionUrl: '/dashboard?tab=wallet',
      },
      {
        id: 3,
        type: 'trip',
        title: 'Trip Completed',
        message: 'Your trip to Library has been completed',
        timestamp: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
        isRead: true,
        icon: '📍',
        actionUrl: '/dashboard?tab=history',
      },
      {
        id: 4,
        type: 'promo',
        title: 'Special Offer',
        message: 'Get 20% off on Sunday rides - Use code SUNDAY20',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60000), // 1 day ago
        isRead: true,
        icon: '🎉',
        actionUrl: null,
      },
      {
        id: 5,
        type: 'system',
        title: 'App Update Available',
        message: 'Version 2.1 is now available with bug fixes',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000), // 2 days ago
        isRead: true,
        icon: '🔧',
        actionUrl: null,
      },
    ];

    setNotifications(mockNotifications);
    updateUnreadCount(mockNotifications);
  }, []);

  const updateUnreadCount = (notifList) => {
    const unread = notifList.filter((n) => !n.isRead).length;
    setUnreadCount(unread);
  };

  // BACKEND: POST /api/notifications/mark-read
  // Send: { notificationId }
  // Response: { success: true }
  const handleMarkAsRead = async (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    );
    setNotifications(updated);
    updateUnreadCount(updated);
    // TODO: Call API when backend is ready
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    setNotifications(updated);
    updateUnreadCount(updated);
    // TODO: Call API when backend is ready
  };

  // BACKEND: DELETE /api/notifications/:id
  // Send: { notificationId }
  // Response: { success: true }
  const handleDeleteNotification = async (id) => {
    const updated = notifications.filter((n) => n.id !== id);
    setNotifications(updated);
    updateUnreadCount(updated);
    // TODO: Call API when backend is ready
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'bus':
        return '#3b82f6';
      case 'payment':
        return '#10b981';
      case 'trip':
        return '#f59e0b';
      case 'promo':
        return '#ec4899';
      case 'system':
        return '#6366f1';
      default:
        return '#64748b';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return timestamp.toLocaleDateString();
  };

  return (
    <div className={styles.notificationCenter}>
      {/* Notification Bell Button */}
      <motion.button
        className={styles.bellBtn}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <FaBell />
        {unreadCount > 0 && (
          <motion.span
            className={styles.badge}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Notification Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.drawer}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className={styles.drawerHeader}>
              <h3>Notifications</h3>
              <motion.button
                className={styles.closeBtn}
                onClick={() => setIsOpen(false)}
                whileHover={{ rotate: 90 }}
              >
                <FaTimes />
              </motion.button>
            </div>

            {/* Notifications List */}
            <div className={styles.notificationsList}>
              {notifications.length === 0 ? (
                <div className={styles.empty}>
                  <p>No notifications yet</p>
                  <span>You're all caught up! 🎉</span>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((notif, index) => (
                    <motion.div
                      key={notif.id}
                      className={`${styles.notificationItem} ${
                        notif.isRead ? styles.read : styles.unread
                      }`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className={styles.iconWrapper}>
                        <span className={styles.icon}>{notif.icon}</span>
                      </div>

                      <div
                        className={styles.content}
                        onClick={() => {
                          if (!notif.isRead) handleMarkAsRead(notif.id);
                          if (notif.actionUrl) {
                            // Navigate to action URL
                            window.location.href = notif.actionUrl;
                          }
                        }}
                      >
                        <div className={styles.titleRow}>
                          <h4>{notif.title}</h4>
                          {!notif.isRead && (
                            <div
                              className={styles.unreadDot}
                              style={{
                                backgroundColor: getNotificationColor(
                                  notif.type
                                ),
                              }}
                            />
                          )}
                        </div>
                        <p>{notif.message}</p>
                        <span className={styles.time}>
                          {formatTime(notif.timestamp)}
                        </span>
                      </div>

                      <motion.button
                        className={styles.deleteBtn}
                        onClick={() => handleDeleteNotification(notif.id)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaTimes />
                      </motion.button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && unreadCount > 0 && (
              <div className={styles.drawerFooter}>
                <motion.button
                  className={styles.markAllBtn}
                  onClick={handleMarkAllAsRead}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FaCheck /> Mark all as read
                </motion.button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay to close drawer when clicking outside */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={styles.overlay}
            onClick={() => setIsOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
