import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import { FaUserPlus, FaMoneyBillWave, FaQrcode, FaBolt, FaShieldAlt, FaWhatsapp, FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';

const recentHistory = [
  { id: 1, day: 'Mon', date: '2026-04-29', route: 'Engineering Block', status: 'Success', amount: '₦500' },
  { id: 2, day: 'Tue', date: '2026-04-28', route: 'Library', status: 'Success', amount: '₦500' },
  { id: 3, day: 'Wed', date: '2026-04-27', route: 'Medical Center', status: 'Pending', amount: '₦1000' },
];

export default function Home() {
  return (
    <main className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.overlay}></div>
        <div className={styles.heroContent}>
          <h1 className={styles.mainTitle}>Campus Transport.<br />Reinvented</h1>
          <p className={styles.heroSubtitle}>Cashless rides. Fixed fares. Instant verification.</p>
          <p className={styles.launchTag}>Launching soon at Futminna</p>
          
          <div className={styles.ctaButtons}>
            <Link className={`${styles.button} ${styles.primary}`} to="/register">
              Get Early Access
            </Link>
            <Link className={`${styles.button} ${styles.secondary}`} to="/login">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Why CTransit & What We're Building */}
      <section className={styles.infoSection}>
        <div className={styles.infoGrid}>
          <div className={styles.infoCard}>
            <FaBolt className={styles.cardIcon} />
            <h2>Why CTransit?</h2>
            <div className={styles.featureListShell}>
              <ul className={styles.bulletList}>
                <li>No change for cash</li>
                <li>Fare disputes</li>
                <li>Clear payment records</li>
                <li>Delays at peak hours</li>
              </ul>
            </div>
            <p className={styles.cardDescription}>
              CTransit removes boarding friction by replacing cash handling with secure digital payments, transparent fares, and verifiable trip records for students and operators.
            </p>
          </div>

          <div className={styles.infoCard}>
            <FaShieldAlt className={styles.cardIcon} />
            <h2>What We're Building</h2>
            <div className={styles.featureListShell}>
              <ul className={styles.bulletList}>
                <li>Student wallet for cashless payments</li>
                <li>Fixed campus fare enforcement</li>
                <li>Tap/Scan boarding system</li>
                <li>Instant ride history</li>
              </ul>
            </div>
            <p className={styles.cardDescription}>
              We are delivering a complete campus mobility platform with wallet funding, fare automation, and accountability tools designed for institutional scale.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className={styles.howItWorks}>
        <h2 className={styles.sectionTitle}>How it Works</h2>
        <div className={styles.stepsGrid}>
          
          <div className={styles.step}>
            <div className={styles.stepNumber}>1</div>
            <FaUserPlus className={styles.stepIcon} />
            <h3>Sign Up & Create Your Wallet</h3>
            <p>Register with your campus email and matric number. Set up your digital wallet instantly.</p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>2</div>
            <FaMoneyBillWave className={styles.stepIcon} />
            <h3>Fund Via Bank Transfer</h3>
            <p>Add funds to your wallet using simple bank transfers. Keep track of every transaction.</p>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNumber}>3</div>
            <FaQrcode className={styles.stepIcon} />
            <h3>Tap Your Card & Ride Instantly</h3>
            <p>Tap your card when boarding. Instant deduction. No cash, no delays.</p>
          </div>

        </div>
      </section>

      {/* Footer CTA */}
      <section className={styles.footerCta}>
        <h2>Ready to Transform Campus Transport?</h2>
        <Link className={`${styles.button} ${styles.primary}`} to="/register">
          Create Account
        </Link>

        <div className={styles.socialSection}>
          <p className={styles.socialHeading}>Stay Connected</p>
          <p className={styles.socialSubtext}>Be part of the movement shaping campus mobility</p>
          
          <div className={styles.socialLinks}>
            <a href="https://twitter.com/ctransit" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Follow CTransit on Twitter">
              <FaTwitter />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Follow CTransit on Facebook">
              <FaFacebook />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Follow CTransit on Instagram">
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Follow CTransit on LinkedIn">
              <FaLinkedin />
            </a>
          </div>

          <a href="https://whatsapp.com/channel/0029VbCHvnf6BIEah3Yiqh2q" target="_blank" rel="noopener noreferrer" className={styles.whatsappButton}>
            <FaWhatsapp className={styles.whatsappIcon} />
            Join WhatsApp Community
          </a>
        </div>
      </section>

      {/* Recent Activity */}
      <section className={styles.recentActivity}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <div className={styles.activityList}>
          {recentHistory.map((r) => (
            <div key={r.id} className={styles.activityItem}>
              <div className={styles.activityLeft}>
                <div className={styles.activityRoute}>{r.route}</div>
                <div className={styles.activityDate}>{r.date}</div>
              </div>
              <div className={styles.activityRight}>
                <div className={styles.activityAmount}>{r.amount}</div>
                <div className={r.status === 'Success' ? styles.statusSuccess : styles.statusPending}>{r.status}</div>
              </div>
            </div>
          ))}
        </div>
        <Link to="/history" className={`${styles.button} ${styles.secondary}`}>View Full History</Link>
      </section>
    </main>
  );
}
