import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaWallet,
  FaCog,
  FaSignOutAlt,
  FaStar,
  FaHistory,
  FaClock,
  FaArrowRight,
  FaUser,
  FaBus,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaExclamationCircle,
} from 'react-icons/fa';

import NotificationCenter from '../components/NotificationCenter';
import CardLinkingModal from '../components/CardLinkingModal';
import { USER_API_URL } from '../config/api';

import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonMessage, setComingSoonMessage] = useState('');
  const [authFlashMessage, setAuthFlashMessage] = useState('');
  const [overlayVisible, setOverlayVisible] = useState(true);
  const [registeredUsers, setRegisteredUsers] = useState(0);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showKycReminder, setShowKycReminder] = useState(false);
  const [kycReminderMessage, setKycReminderMessage] = useState('');
  const [showCardLinkModal, setShowCardLinkModal] = useState(false);
  
  // Real user data from API
  const [userData, setUserData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [recentTrips, setRecentTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  // Mock user data (using until backend API is available)
  const mockUserData = {
    firstname: 'Alimi',
    lastname: 'Azeez',
    email: 'alimi@st.futminna.edu',
    matricNumber: 'PHY/2026/154',
    walletBalance: 0.00 ,
    recentTrips: [
      {
        id: 1,
        destination: 'Engineering Block',
        fare: 500.00,
        time: '10:30 AM',
        date: '2026-04-24',
      },
      {
        id: 2,
        destination: 'Library',
        fare: 500.00,
        time: '2:15 PM',
        date: '2026-04-24',
      },
      {
        id: 3,
        destination: 'Medical Center',
        fare: 1000.00,
        time: '4:45 PM',
        date: '2026-04-23',
      },
    ],
  };

  const student = {
    studentId: 'PHY/2026/154',
    department: 'Physics',
    phone: '+234 81 XXXX XXXX',
    level: '300 Level',
    campus: 'Main Campus',
    joinDate: 'January 2026',
  };

  // Extract user info
  const displayName = userData?.firstname ? `${userData.firstname} ${userData.lastname || ''}` : 'Campus User';
  const displayMatricNumber = userData?.matricNumber || 'Not available';
  const displayEmail = userData?.email || 'email@example.com';
  const userInitials = (displayName || 'Campus Transit')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'CT';

  useEffect(() => {
    // Use mock data for now (until backend API is available)
    setUserData(mockUserData);
    setWalletBalance(mockUserData.walletBalance);
    setRecentTrips(mockUserData.recentTrips);
    setLoading(false);
  }, []);

  useEffect(() => {
    // BACKEND INTEGRATION: GET /api/users/count
    // Response: { data: { count: { registeredUsers: 150 } } }
    const fetchRegisteredUsers = async () => {
      try {
        const response = await fetch(`${USER_API_URL}/users/count`);
        const json = await response.json();
        const count = json.data.count;
        setRegisteredUsers(count.registeredUsers);
      } catch (error) {
        console.error('Error fetching registered users:', error);
      }
    };

    fetchRegisteredUsers();
  }, []);

  useEffect(() => {
    const handleError = (error) => {
      console.error('Network error:', error);
      alert('A network error occurred. Please check your connection.');
    };

    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('error', handleError);
    };
  }, []);

  useEffect(() => {
    const successMessage = sessionStorage.getItem('authSuccessMessage');
    if (!successMessage) {
      return;
    }

    setAuthFlashMessage(successMessage);
    sessionStorage.removeItem('authSuccessMessage');

    // Auto-dismiss success message after 2.5 seconds
    const timer = setTimeout(() => {
      setAuthFlashMessage('');
    }, 2500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const reminder = sessionStorage.getItem('kycReminderMessage');

    if (!reminder) {
      return;
    }

    setKycReminderMessage(reminder);
    setShowKycReminder(true);
    sessionStorage.removeItem('kycReminderMessage');
  }, []);

  const handleComingSoon = (feature) => {
    setComingSoonMessage(feature);
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const goToSettings = () => {
    setShowKycReminder(false);
    navigate('/settings');
  };

  const openCardLinkModal = () => {
    setShowProfileMenu(false);
    setShowMobileMenu(false);
    setShowCardLinkModal(true);
  };

  const confirmLogout = () => {
    localStorage.removeItem('token');
    setShowLogoutModal(false);
    navigate('/login', { replace: true });
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleCopyAccount = async () => {
    try {
      await navigator.clipboard.writeText('1234 5678 90');
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 1800);
    } catch (error) {
      console.error('Failed to copy account number:', error);
      alert('Copy failed. Please copy manually.');
    }
  };

  const renderAmount = (amount) => {
    const sign = amount > 0 ? '+' : '-';
    const formatted = Math.abs(amount).toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return `${sign} ₦${formatted}`;
  };

  const getDrawerTitle = () => {
    if (activeTab === 'profile') {
      return 'Profile';
    }

    if (activeTab === 'history') {
      return 'Transfer History';
    }

    return 'Settings';
  };

  return (
    <div className={styles.wrapper}>
      {overlayVisible && (
        <div className={styles.overlay}>
          <div className={styles.overlayContent}>
            <h1>Welcome, {displayName || 'Campus User'}</h1>
            <p>You are part of the early access group for CTransit.</p>
            <p>
              <strong>Early Access Status:</strong> You are among the first students preparing to use CTransit.
              <br />
              <span className={styles.registeredUsersCounter}>{registeredUsers} registered users</span>
            </p>
            <p><strong>System Preparation in Progress:</strong></p>
            <ul className={styles.overlayList}>
              <li className={styles.animatedListItem}>
                Wallet system: <div className={styles.progressBar} style={{ '--progress-value': '90%' }} /> 90%
              </li>
              <li className={styles.animatedListItem}>
                Driver terminals: <div className={styles.progressBar} style={{ '--progress-value': '45%' }} /> 45%
              </li>
              <li className={styles.animatedListItem}>
                Campus rollout: <div className={styles.progressBar} style={{ '--progress-value': '5%' }} /> 5%
              </li>
            </ul>
            <a
              href="https://whatsapp.com/channel/0029VbCHvnf6BIEah3Yiqh2q"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.whatsappLink}
            >
              Join the WhatsApp Community
            </a>
            <button className={styles.dismissOverlayBtn} onClick={() => setOverlayVisible(false)}>
              Continue to Dashboard
            </button>
          </div>
        </div>
      )}

      {showComingSoon && (
        <div className={styles.toast}>
          <span><FaStar /> {comingSoonMessage}</span>
          <span>We are preparing this feature...</span>
        </div>
      )}

      {authFlashMessage && (
        <div className={styles.authToast}>
          <strong>Success</strong>
          <span>{authFlashMessage}</span>
        </div>
      )}

      {showKycReminder && (
        <motion.div className={styles.kycPrompt} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div>
            <strong><FaExclamationCircle /> KYC Required</strong>
            <span>{kycReminderMessage || 'Complete your KYC to unlock card linking and wallet features.'}</span>
          </div>
          <button onClick={goToSettings}>Open Settings</button>
        </motion.div>
      )}

      <main className={styles.dashboardShell}>
        <header className={styles.topHeader}>
          <div className={styles.brandWrap}>
            <div className={styles.brandBadge}>C</div>
            <h1 className={styles.brandTitle}>C-Transit</h1>
          </div>

          <nav className={styles.quickNav} aria-label="Account shortcuts">
            <button type="button" className={styles.quickNavButton} onClick={openCardLinkModal}>
              Link Card
            </button>
          </nav>

          <div className={styles.headerActions}>
            <button
              className={styles.mobileMenuBtn}
              onClick={() => setShowMobileMenu(true)}
              aria-label="Open dashboard menu"
            >
              <FaBars />
            </button>

            {/* Notification Center Bell */}
            <div className={styles.notificationWrapper}>
              <NotificationCenter />
            </div>

            {/* Profile Menu Dropdown */}
            <div className={styles.profileMenuWrapper}>
              <button
                className={styles.profileMenuBtn}
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                aria-label="Open profile menu"
              >
                <div className={styles.profileMenuHeader}>
                  <div className={styles.avatarCircle}>{userInitials}</div>
                  <div className={styles.profileMenuInfo}>
                    <p className={styles.profileMenuName}>{displayName || 'Campus User'}</p>
                    <span className={styles.profileMenuMatric}>{displayMatricNumber}</span>
                  </div>
                  <FaChevronDown className={styles.profileMenuChevron} />
                </div>
              </button>

              {/* Dropdown Menu */}
              {showProfileMenu && (
                <motion.div
                  className={styles.profileDropdown}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      navigate('/profile');
                      setShowProfileMenu(false);
                    }}
                  >
                    <FaUser /> View Profile
                  </button>
                  <button
                    className={styles.dropdownItem}
                    onClick={() => {
                      navigate('/settings');
                      setShowProfileMenu(false);
                    }}
                  >
                    <FaCog /> Settings
                  </button>
                  <div className={styles.dropdownDivider} />
                  <button
                    className={`${styles.dropdownItem} ${styles.dropdownLogout}`}
                    onClick={handleLogout}
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </motion.div>
              )}
            </div>
          </div>
        </header>

        <AnimatePresence>
          {showMobileMenu && (
            <motion.div
              className={styles.mobileMenuBackdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
            >
              <motion.aside
                className={styles.mobileMenuPanel}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className={styles.mobileMenuHead}>
                  <h3>Dashboard Menu</h3>
                  <button
                    className={styles.mobileCloseBtn}
                    onClick={() => setShowMobileMenu(false)}
                    aria-label="Close dashboard menu"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className={styles.mobileMenuBody}>
                      <button
                        className={styles.mobileMenuItem}
                        onClick={() => {
                          openCardLinkModal();
                        }}
                      >
                        <FaWallet /> Link Card
                      </button>

                  <div className={styles.mobileNotificationWrap}>
                    <NotificationCenter />
                  </div>

                  <button
                    className={styles.mobileMenuItem}
                    onClick={() => {
                      navigate('/profile');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FaUser /> View Profile
                  </button>

                  <button
                    className={styles.mobileMenuItem}
                    onClick={() => {
                      navigate('/settings');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FaCog /> Settings
                  </button>

                  <button
                    className={styles.mobileMenuItem}
                    onClick={() => {
                      navigate('/history');
                      setShowMobileMenu(false);
                    }}
                  >
                    <FaHistory /> Transfer History
                  </button>

                  <button
                    className={`${styles.mobileMenuItem} ${styles.mobileMenuLogout}`}
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                  >
                    <FaSignOutAlt /> Logout
                  </button>
                </div>
              </motion.aside>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={styles.mainGrid}>
            <section className={styles.leftColumn}>
              <div className={styles.greetingBlock}>
                <h2>Hello, {displayName || 'Campus User'}</h2>
                <p>Matric No: {displayMatricNumber}</p>
              </div>

              <div className={styles.walletCard}>
                <div className={styles.walletHead}>
                  <p>Wallet Balance</p>
                  <h3>₦{walletBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                  <small>Tap your student ID card to pay for rides.</small>
                </div>

                <div className={styles.transferCard}>
                  <div>
                    <span>Fund via Bank Transfer</span>
                    <p>Wema Bank</p>
                    <strong>1234 5678 90</strong>
                  </div>
                  <button onClick={handleCopyAccount}>{copySuccess ? 'Copied' : 'Copy'}</button>
                </div>
              </div>

              <div className={styles.quickActionsRow}>
                <button
                  className={styles.primaryAction}
                  onClick={() => handleComingSoon('Fund Wallet')}
                >
                  <FaWallet /> Fund Wallet
                </button>
                <button
                  className={styles.secondaryAction}
                  onClick={() => setActiveTab('history')}
                >
                  <FaHistory /> History
                </button>
              </div>
            </section>

            <section className={styles.rightColumn}>
              <div className={styles.activityHead}>
                <h3>Recent Activity</h3>
                <button className={styles.linkBtn} onClick={() => navigate('/history')}>
                  View Transfer History <FaArrowRight />
                </button>
              </div>

              <div className={styles.activityList}>
                {recentTrips.map((item, index) => (
                  <article
                    key={item.id}
                    className={`${styles.activityCard} ${index === 2 ? styles.dimmedCard : ''}`}
                  >
                    <div className={styles.activityLeft}>
                      <div className={`${styles.activityIcon} ${item.type === 'fund' ? styles.fundIcon : styles.rideIcon}`}>
                        {item.type === 'fund' ? <FaWallet /> : <FaBus />}
                      </div>
                      <div>
                        <h4>{item.title}</h4>
                        <p>{item.status}</p>
                      </div>
                    </div>
                    <div className={styles.activityRight}>
                      <h4 className={item.amount > 0 ? styles.credit : styles.debit}>{renderAmount(item.amount)}</h4>
                      <p>{item.date}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          </div>

        {activeTab !== 'overview' && (
          <div
            className={styles.drawerBackdrop}
            role="presentation"
            onClick={() => setActiveTab('overview')}
          >
            <aside
              className={styles.drawerPanel}
              role="dialog"
              aria-modal="true"
              aria-label={getDrawerTitle()}
              onClick={(event) => event.stopPropagation()}
            >
              <div className={styles.drawerHeader}>
                <h3>{getDrawerTitle()}</h3>
                <button
                  className={styles.drawerCloseBtn}
                  onClick={() => setActiveTab('overview')}
                >
                  Close
                </button>
              </div>

              <div className={styles.drawerBody}>
                {activeTab === 'profile' && (
                  <div className={styles.profileGrid}>
                    <div><label>Full Name</label><p>{displayName || 'Campus User'}</p></div>
                    <div><label>Student ID</label><p>{student.studentId}</p></div>
                    <div><label>Matric Number</label><p>{displayMatricNumber}</p></div>
                    <div><label>Department</label><p>{student.department}</p></div>
                    <div><label>Email</label><p>{displayEmail}</p></div>
                    <div><label>Phone</label><p>{student.phone}</p></div>
                    <div><label>Level</label><p>{student.level}</p></div>
                    <div><label>Campus</label><p>{student.campus}</p></div>
                    <div><label>Member Since</label><p>{student.joinDate}</p></div>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className={styles.activityList}>
                    {recentTrips.map((item) => (
                      <article key={`history-${item.id}`} className={styles.activityCard}>
                        <div className={styles.activityLeft}>
                          <div className={`${styles.activityIcon} ${item.type === 'fund' ? styles.fundIcon : styles.rideIcon}`}>
                            {item.type === 'fund' ? <FaWallet /> : <FaClock />}
                          </div>
                          <div>
                            <h4>{item.title}</h4>
                            <p>{item.status}</p>
                          </div>
                        </div>
                        <div className={styles.activityRight}>
                          <h4 className={item.amount > 0 ? styles.credit : styles.debit}>{renderAmount(item.amount)}</h4>
                          <p>{item.date}</p>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {activeTab === 'settings' && (
                  <>
                    <p className={styles.settingsText}>
                      Settings is now available in this drawer. More account controls will be added here.
                    </p>
                    <div className={styles.settingsActions}>
                      <button className={styles.secondaryAction} onClick={() => handleComingSoon('Notification Settings')}>
                        Notification Settings
                      </button>
                      <button className={styles.secondaryAction} onClick={() => handleComingSoon('Security Settings')}>
                        Security Settings
                      </button>
                    </div>
                  </>
                )}
              </div>
            </aside>
          </div>
        )}
      </main>

      {showLogoutModal && (
        <motion.div
          className={styles.modalOverlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={cancelLogout}
        >
          <motion.div
            className={styles.logoutModal}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Logout</h2>
            <p>Are you sure you want to logout?</p>
            <div className={styles.modalActions}>
              <motion.button
                className={styles.cancelBtn}
                onClick={cancelLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
              <motion.button
                className={styles.confirmBtn}
                onClick={confirmLogout}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Logout
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      <CardLinkingModal isOpen={showCardLinkModal} onClose={() => setShowCardLinkModal(false)} />
    </div>
  );
}