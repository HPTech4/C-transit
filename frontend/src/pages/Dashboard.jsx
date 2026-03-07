import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaBars, FaUser, FaChartBar, FaBus, FaWallet, FaCog, FaSignOutAlt, 
  FaEdit, FaDownload, FaQrcode, FaStar, FaArrowRight, FaHistory, FaClock,
  FaEnvelope, FaPhone, FaIdCard, FaUniversity, FaCalendar, FaMapMarkerAlt
} from 'react-icons/fa';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [comingSoonMessage, setComingSoonMessage] = useState('');

  // Mock student data
  const student = {
    fullName: 'Alimi Azeez',
    studentId: '20230154',
    matricNumber: 'PHY/2026/154',
    department: 'Department of Physics',
    level: '500 Level',
    email: 'azeez.alimi@campusmail.edu',
    phone: '+234 (0) 802-345-6789',
    profileImage: 'AZ',
    joinDate: 'February 2026',
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('studentEmail');
    navigate('/login', { replace: true });
  };

  return (
    <div className={styles.wrapper}>
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div 
          className={styles.backdrop} 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop and Mobile */}
      <aside className={`${styles.sidebar} ${mobileMenuOpen ? styles.open : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoBadge}>CT</div>
        </div>

        <nav className={styles.sidebarNav}>
          <button
            className={`${styles.navItem} ${activeTab === 'overview' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('overview');
              setMobileMenuOpen(false);
            }}
          >
            <FaChartBar  /> Overview
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
            className={`${styles.navItem} ${activeTab === 'history' ? styles.active : ''}`}
            onClick={() => {
              setActiveTab('history');
              setMobileMenuOpen(false);
            }}
          >
            <FaHistory /> History
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
          <button className={styles.logoutBtn} onClick={handleLogout}>
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
            <div className={styles.userProfile}>
              <div className={styles.userAvatar}>{student.profileImage}</div>
              <div className={styles.userInfo}>
                <p className={styles.userName}>{student.fullName}</p>
                <p className={styles.userLevel}>{student.level}</p>
              </div>
            </div>
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
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <section className={styles.section}>
              <h2>Dashboard Overview</h2>
              <div className={styles.cardGrid}>
                {/* Balance Card */}
                <div className={styles.card}>
                  <div className={styles.cardIcon}><FaWallet size={25}/></div>
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
                  <div className={styles.cardIcon}><FaBus size={25} /></div>
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
                  <div className={styles.cardIcon}><FaChartBar size={25}/></div>
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
                  <div className={styles.cardIcon}><FaArrowRight size={25}/></div>
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

              {/* Recent Activity Section */}
              <div className={styles.recentSection}>
                <div className={styles.sectionHeader}>
                  <h3><FaHistory /> Recent Activity</h3>
                  <button 
                    className={styles.viewMoreBtn}
                    onClick={() => setActiveTab('history')}
                  >
                    View More <FaArrowRight />
                  </button>
                </div>
                <div className={styles.activityList}>
                  {recentTrips.slice(0, 3).map((trip) => (
                    <div key={trip.id} className={styles.activityItem}>
                      <div className={styles.activityIcon}>
                        <FaBus />
                      </div>
                      <div className={styles.activityInfo}>
                        <p className={styles.activityTitle}>{trip.from} → {trip.to}</p>
                        <p className={styles.activityTime}><FaClock /> {trip.time}</p>
                      </div>
                      <div className={styles.activityAmount}>₦{trip.fare.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <section className={styles.section}>
              <div className={styles.profileCard}>
                <div className={styles.profileHeader}>
                  <div className={styles.largeAvatar}>{student.profileImage}</div>
                  <div className={styles.profileHeaderInfo}>
                    <h2>{student.fullName}</h2>
                    <p className={styles.profileBadge}>{student.level}</p>
                    <p className={styles.profileCampus}>
                      <FaMapMarkerAlt /> {student.campus}
                    </p>
                  </div>
                </div>

                <div className={styles.profileGrid}>
                  <div className={styles.profileFieldPro}>
                    <div className={styles.fieldIcon}>
                      <FaIdCard />
                    </div>
                    <div className={styles.fieldContent}>
                      <label>Student ID</label>
                      <p>{student.studentId}</p>
                    </div>
                  </div>
                  <div className={styles.profileFieldPro}>
                    <div className={styles.fieldIcon}>
                      <FaIdCard />
                    </div>
                    <div className={styles.fieldContent}>
                      <label>Matric Number</label>
                      <p>{student.matricNumber}</p>
                    </div>
                  </div>
                  <div className={styles.profileFieldPro}>
                    <div className={styles.fieldIcon}>
                      <FaUniversity />
                    </div>
                    <div className={styles.fieldContent}>
                      <label>Department</label>
                      <p>{student.department}</p>
                    </div>
                  </div>
                  <div className={styles.profileFieldPro}>
                    <div className={styles.fieldIcon}>
                      <FaEnvelope />
                    </div>
                    <div className={styles.fieldContent}>
                      <label>Email</label>
                      <p>{student.email}</p>
                    </div>
                  </div>
                  <div className={styles.profileFieldPro}>
                    <div className={styles.fieldIcon}>
                      <FaPhone />
                    </div>
                    <div className={styles.fieldContent}>
                      <label>Phone</label>
                      <p>{student.phone}</p>
                    </div>
                  </div>
                  <div className={styles.profileFieldPro}>
                    <div className={styles.fieldIcon}>
                      <FaCalendar />
                    </div>
                    <div className={styles.fieldContent}>
                      <label>Member Since</label>
                      <p>{student.joinDate}</p>
                    </div>
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

          {/* Wallet Tab */}
          {activeTab === 'wallet' && (
            <section className={styles.section}>
              <div className={styles.comingSoonContainer}>
                <div className={styles.comingSoonIcon}>
                  <FaWallet className={styles.pulseIcon} />
                </div>
                <h2 className={styles.comingSoonTitle}>Wallet Management</h2>
                <p className={styles.comingSoonText}>
                  Your digital wallet is coming soon with exciting features.
                </p>
                <p className={styles.comingSoonSubtext}>
                  Manage your balance, add funds, view transactions, and transfer money seamlessly.
                </p>
                <div className={styles.comingSoonFeatures}>
                  <span className={styles.featureBadge}>Add Funds</span>
                  <span className={styles.featureBadge}>Transaction History</span>
                  <span className={styles.featureBadge}>Quick Transfer</span>
                </div>
              </div>
            </section>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <section className={styles.section}>
              <div className={styles.comingSoonContainer}>
                <div className={styles.comingSoonIcon}>
                  <FaCog className={styles.spinIcon} />
                </div>
                <h2 className={styles.comingSoonTitle}>Account Settings</h2>
                <p className={styles.comingSoonText}>
                  We're working on bringing you advanced account settings.
                </p>
                <p className={styles.comingSoonSubtext}>
                  Soon you'll be able to manage your profile, security settings, and preferences all in one place.
                </p>
                <div className={styles.comingSoonFeatures}>
                  <span className={styles.featureBadge}>Two-Factor Authentication</span>
                  <span className={styles.featureBadge}>Privacy Controls</span>
                  <span className={styles.featureBadge}>Notification Settings</span>
                </div>
              </div>
            </section>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <section className={styles.section}>
              <div className={styles.comingSoonContainer}>
                <div className={styles.comingSoonIcon}>
                  <FaHistory className={styles.pulseIcon} />
                </div>
                <h2 className={styles.comingSoonTitle}>Transaction History</h2>
                <p className={styles.comingSoonText}>
                  Your complete transaction history is coming soon.
                </p>
                <p className={styles.comingSoonSubtext}>
                  View detailed records of all your rides, payments, and refunds with advanced filtering options.
                </p>
                <div className={styles.comingSoonFeatures}>
                  <span className={styles.featureBadge}>Filter by Date</span>
                  <span className={styles.featureBadge}>Export Data</span>
                </div>
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
}
