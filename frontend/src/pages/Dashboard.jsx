import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaUser, FaChartBar, FaBus, FaWallet, FaCog, FaSignOutAlt, FaEdit, FaDownload, FaQrcode, FaWalletAlt, FaStar, FaArrowRight } from 'react-icons/fa';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonMessage, setComingSoonMessage] = useState('');

  // Mock student data
  const student = {
    fullName: 'Alimi Azeez',
    studentId: '20230154',
    matricNumber: 'PHY/2026/154',
    department: 'Department of Physics',
    level: '700 Level',
    email: 'azeez.alimi@campusmail.edu',
    phone: '+234 (0) 802-345-6789',
    profileImage: 'AZ',
    joinDate: 'Februrary 2026',
    campus: 'Gidan Kwano Campus',
  };

  const userBalance = 2500; // Mock balance in cents
  const recentTrips = [
    { id: 1, from: 'School Gate ', to: 'SLS', fare: 150, time: '2 hours ago' },
    { id: 2, from: 'Library', to: 'Hostel A', fare: 150, time: '5 hours ago' },
    { id: 3, from: 'Bus Park', to: 'Engineering', fare: 150, time: '1 day ago' },
  ];

  const handleComingSoon = (feature) => {
    setComingSoonMessage(feature);
    setShowComingSoon(true);
    setTimeout(() => setShowComingSoon(false), 3000);
  };

  return (
    <div className={styles.wrapper}>
      {/* Sidebar - Desktop and Mobile */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBadge}>CT</div>
          <button 
            className={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            <FaBars size={20} />
          </button>
        </div>

        {/* Profile Preview in Sidebar */}
        {!sidebarOpen && (
          <div className={styles.profilePreview}>
            <div className={styles.profileAvatar}>{student.profileImage}</div>
            <div className={styles.profileInfo}>
              <p className={styles.profileName}>{student.fullName}</p>
              <p className={styles.profileId}>{student.studentId}</p>
              <p className={styles.profileDept}>{student.level}</p>
            </div>
          </div>
        )}

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('overview');
              setMobileMenuOpen(false);
            }}
          >
            <FaChartBar /> Overview
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'trips' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('trips');
              setMobileMenuOpen(false);
            }}
          >
            <FaBus /> Trips
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'wallet' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('wallet');
              setMobileMenuOpen(false);
            }}
          >
            <FaWallet /> Wallet
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'profile' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('profile');
              setMobileMenuOpen(false);
            }}
          >
            <FaUser /> Profile
          </button>
          <button
            className={`${styles.navItem} ${activeTab === 'settings' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('settings');
              setMobileMenuOpen(false);
            }}
          >
            <FaCog /> Settings
          </button>
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn}>
            <FaSignOutAlt /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.main}>
        <header className={styles.header}>
          <button 
            className={styles.mobileMenuBtn}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <FaBars size={24} />
          </button>
          <h1>Campus Transit Dashboard</h1>
          <div className={styles.headerActions}>
            <span className={styles.userGreeting}>Welcome, {student.fullName.split(' ')[0]}</span>
          </div>
        </header>

        {/* Coming Soon Toast */}
        {showComingSoon && (
          <div className={styles.toast}>
            <span><FaStar /> {comingSoonMessage}</span>
            <span>We're preparing this feature...</span>
          </div>
        )}

        <div className={styles.content}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <section className={styles.section}>
              <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                  <div className={styles.largeAvatar}>{student.profileImage}</div>
                  <div className={styles.profileHeaderInfo}>
                    <h2>{student.fullName}</h2>
                    <p className={styles.profileBadge}>{student.level}</p>
                    <p className={styles.profileCampus}>{student.campus}</p>
                  </div>
                </div>

                <div className={styles.profileGrid}>
                  <div className={styles.profileField}>
                    <label>Student ID</label>
                    <p>{student.studentId}</p>
                  </div>
                  <div className={styles.profileField}>
                    <label>Matric Number</label>
                    <p>{student.matricNumber}</p>
                  </div>
                  <div className={styles.profileField}>
                    <label>Department</label>
                    <p>{student.department}</p>
                  </div>
                  <div className={styles.profileField}>
                    <label>Email</label>
                    <p>{student.email}</p>
                  </div>
                  <div className={styles.profileField}>
                    <label>Phone</label>
                    <p>{student.phone}</p>
                  </div>
                  <div className={styles.profileField}>
                    <label>Member Since</label>
                    <p>{student.joinDate}</p>
                  </div>
                </div>

                <div className={styles.profileActions}>
                  <button 
                    className={styles.btn}
                    onClick={() => handleComingSoon('Profile Update')}
                  >
                    <FaEdit /> Edit Profile
                  </button>
                  <button 
                    className={styles.btn}
                    onClick={() => handleComingSoon('ID Card Download')}
                  >
                    <FaDownload /> Download ID Card
                  </button>
                  <button 
                    className={styles.btn}
                    onClick={() => handleComingSoon('QR Code')}
                  >
                    <FaQrcode /> View QR Code
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <section className={styles.section}>
              <h2>Dashboard Overview</h2>
              <div className={styles.cardGrid}>
                {/* Balance Card */}
                <div className={styles.card}>
                  <div className={styles.cardIcon}><FaWalletAlt /></div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardLabel}>Wallet Balance</p>
                    <p className={styles.cardValue}>₦{(userBalance / 100).toFixed(2)}</p>
                  </div>
                  <button 
                    className={styles.cardAction}
                    onClick={() => handleComingSoon('Top Up')}
                  >
                    Top up
                  </button>
                </div>

                {/* Rides This Month */}
                <div className={styles.card}>
                  <div className={styles.cardIcon}><FaBus /></div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardLabel}>Rides This Month</p>
                    <p className={styles.cardValue}>12</p>
                  </div>
                  <button 
                    className={styles.cardAction}
                    onClick={() => handleComingSoon('Analytics')}
                  >
                    View
                  </button>
                </div>

                {/* Total Spent */}
                <div className={styles.card}>
                  <div className={styles.cardIcon}><FaChartBar /></div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardLabel}>Total Spent</p>
                    <p className={styles.cardValue}>₦1,050</p>
                  </div>
                  <button 
                    className={styles.cardAction}
                    onClick={() => handleComingSoon('Reports')}
                  >
                    Report
                  </button>
                </div>

                {/* Quick Book Ride */}
                <div className={`${styles.card} ${styles.highlight}`}>
                  <div className={styles.cardIcon}><FaArrowRight /></div>
                  <div className={styles.cardBody}>
                    <p className={styles.cardLabel}>Ready to Ride?</p>
                    <p className={styles.cardValue}>Book Now</p>
                  </div>
                  <button 
                    className={styles.cardAction}
                    onClick={() => handleComingSoon('Ride Booking')}
                  >
                    + Book
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Trips Tab */}
          {activeTab === 'trips' && (
            <section className={styles.section}>
              <h2>Recent Trips</h2>
              <div className={styles.tripsList}>
                {recentTrips.map((trip) => (
                  <div key={trip.id} className={styles.tripItem}>
                    <div className={styles.tripInfo}>
                      <p className={styles.tripRoute}>{trip.from} → {trip.to}</p>
                      <p className={styles.tripTime}>{trip.time}</p>
                    </div>
                    <div className={styles.tripFare}>₦{(trip.fare).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <button 
                className={styles.btn}
                onClick={() => handleComingSoon('Full Trip History')}
                style={{ marginTop: '1.5rem' }}
              >
                View Full History
              </button>
            </section>
          )}

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <section className={styles.section}>
              <h2>Wallet Management</h2>
              <div className={styles.walletCard}>
                <p>Current Balance: <strong>₦{(userBalance / 100).toFixed(2)}</strong></p>
                <div className={styles.walletActions}>
                  <button 
                    className={styles.btn}
                    onClick={() => handleComingSoon('Add Funds')}
                  >
                    + Add Funds
                  </button>
                  <button 
                    className={styles.btn}
                    onClick={() => handleComingSoon('Transaction History')}
                  >
                    View History
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <section className={styles.section}>
              <h2>Account Settings</h2>
              <div className={styles.settingsForm}>
                <div className={styles.settingItem}>
                  <label>Email</label>
                  <input type="email" disabled value={student.email} />
                </div>
                <div className={styles.settingItem}>
                  <label>Phone</label>
                  <input type="tel" disabled value={student.phone} />
                </div>
                <div className={styles.settingItem}>
                  <label>Emergency Contact</label>
                  <input type="tel" placeholder="Add emergency contact number" />
                </div>
                <div className={styles.settingItem}>
                  <label>Two-Factor Authentication</label>
                  <button 
                    className={styles.btn}
                    onClick={() => handleComingSoon('2FA Setup')}
                  >
                    Enable 2FA
                  </button>
                </div>
                <button 
                  className={styles.btn}
                  onClick={() => handleComingSoon('Settings Save')}
                >
                  Save Changes
                </button>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
