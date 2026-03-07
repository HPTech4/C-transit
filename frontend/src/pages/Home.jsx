import { Link } from 'react-router-dom';
import styles from './Home.module.css';
import { FaUserPlus, FaMoneyBillWave, FaQrcode, FaBolt, FaShieldAlt, FaWhatsapp, FaTwitter, FaFacebook, FaInstagram, FaLinkedin } from 'react-icons/fa';

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
            <div className={styles.placeholder}>
              <ul className={styles.bulletList}>
                <li>No change for cash</li>
                <li>Fare disputes</li>
                <li>No payment records</li>
                <li>No delay at peak hours</li>
              </ul>
            </div>
            <p className={styles.cardDescription}>
              We're solving the transportation challenge on campus. Placeholder text for why students and the institution need this solution.
            </p>
          </div>

          <div className={styles.infoCard}>
            <FaShieldAlt className={styles.cardIcon} />
            <h2>What We're Building</h2>
            <div className={styles.placeholder}>
              <ul className={styles.bulletList}>
                <li>Student wallet for cashless payments</li>
                <li>Fixed campus fare enforcement</li>
                <li>Tap/Scan boarding system</li>
                <li>Instant ride history</li>
              </ul>
            </div>
            <p className={styles.cardDescription}>
              A complete digital wallet and transportation ecosystem. Placeholder text describing the comprehensive solution.
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
            <h3>Scan & Ride Instantly</h3>
            <p>Scan the QR code when boarding. Instant deduction. No cash, no delays.</p>
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
            <a href="https://twitter.com/ctransit" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <FaTwitter />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <FaFacebook />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <FaInstagram />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <FaLinkedin />
            </a>
          </div>

          <a href="https://whatsapp.com/channel/0029VbCHvnf6BIEah3Yiqh2q" target="_blank" rel="noopener noreferrer" className={styles.whatsappButton}>
            <FaWhatsapp className={styles.whatsappIcon} />
            Join WhatsApp Community
          </a>
        </div>
      </section>
    </main>
  );
}
