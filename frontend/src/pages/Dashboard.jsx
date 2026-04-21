import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'react-icons/fa';

import { AUTH_API_URL, USER_API_URL } from '../config/api';

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

  // Existing mock student data wiring retained.
  const student = {
    fullName: 'Alimi Azeez Opeyemi',
    studentId: '20230154',
    matricNumber: 'PHY/2026/154',
    department: 'Department of Physics',
    level: '500 Level',
    email: 'azeez.alimi@campusmail.edu',
    phone: '+234 (0) 802-345-6789',
    joinDate: 'February 2026',
    campus: 'Gidan Kwano Campus',
  };

  const userName = (localStorage.getItem('userName') || '').trim();
  const userEmail = (localStorage.getItem('studentEmail') || '').trim();
  const storedMatricNumber = (localStorage.getItem('matricNumber') || '').trim();
  const displayNameFromEmail = userEmail
    ? userEmail
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
      .trim()
    : '';
  const displayName = (userName || displayNameFromEmail).trim();
  const displayMatricNumber = storedMatricNumber || 'Not available';
  const displayEmail = userEmail || student.email;
  const userInitials = (displayName || 'Campus Transit')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || 'CT';
  const zeroBalance = 0;

  const recentTrips = [
    { id: 1, title: 'Shuttle Ride', status: 'Completed', amount: -150, date: 'Dec 16, 2023', type: 'ride' },
    { id: 2, title: 'Wallet Funding', status: 'Completed', amount: 3000, date: 'Jan 18, 2023', type: 'fund' },
    { id: 3, title: 'Shuttle Ride', status: 'Completed', amount: -150, date: 'Jan 16, 2023', type: 'ride' },
  ];

  useEffect(() => {
    const fetchRegisteredUsers = async () => {
      try {
        const response = await fetch(`${USER_API_URL}/users/count`);
        const data = await response.json();
        setRegisteredUsers(data.registeredUsers);
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
      return undefined;
    }

    setAuthFlashMessage(successMessage);
    sessionStorage.removeItem('authSuccessMessage');

    const timer = setTimeout(() => {
      setAuthFlashMessage('');
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const handleComingSoon = (feature) => {
    setComingSoonMessage(feature);
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  const handleLogout = () => {
    const shouldLogout = window.confirm('Are you sure you want to logout now?');
    if (!shouldLogout) {
      return;
    }

    localStorage.removeItem('token');
    localStorage.removeItem('studentEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('matricNumber');
    navigate('/login', { replace: true });
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

      <main className={styles.dashboardShell}>
        <header className={styles.topHeader}>
          <div className={styles.brandWrap}>
            <div className={styles.brandBadge}>C</div>
            <h1 className={styles.brandTitle}>C-Transit</h1>
          </div>

          <div className={styles.headerActions}>
            <button
              className={styles.headerActionBtn}
              onClick={() => setActiveTab('settings')}
              aria-label="Open settings"
            >
              <FaCog />
            </button>
            <button
              className={styles.headerActionBtn}
              onClick={() => setActiveTab('profile')}
              aria-label="Open profile"
            >
              <FaUser />
            </button>
            <div className={styles.userIdentity}>
              <p>{displayName || 'Campus User'}</p>
              <span>{displayMatricNumber}</span>
            </div>
            <button className={styles.avatarBtn} onClick={() => setActiveTab('profile')}>
              {userInitials}
            </button>
            <button className={styles.logoutBtn} onClick={handleLogout}>
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </header>

        <div className={styles.mainGrid}>
            <section className={styles.leftColumn}>
              <div className={styles.greetingBlock}>
                <h2>Hello, {displayName || 'Campus User'}</h2>
                <p>Matric No: {displayMatricNumber}</p>
              </div>

              <div className={styles.walletCard}>
                <div className={styles.walletHead}>
                  <p>Wallet Balance</p>
                  <h3>₦{zeroBalance.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
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
                <button className={styles.linkBtn} onClick={() => setActiveTab('history')}>
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
    </div>
  );
}
