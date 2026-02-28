import { Link } from 'react-router-dom';
import styles from './Home.module.css';


export default function Home() {
  return (
    <main className={styles.hero}>
      <header className={styles.nav}>
        <div className={styles.brand}>C Transit</div>
        <div className={styles.tagline}>Seamless campus transport transactions</div>
      </header>

      <section className={styles.content}>
        <p className={styles.kicker}>Tap, ride, and move faster</p>
        <h1 className={styles.title}>Pay once. Ride anywhere on campus.</h1>
        <p className={styles.subtitle}>
          C Transit makes on-campus transport simple with cashless payments, instant
          verification, and clear trip history. No queues, no confusion, just smooth
          rides between lecture halls, hostels, and labs.
        </p>

        <div className={styles.actions}>
          <Link className={`${styles.button} ${styles.primary}`} to="/login">
            Login
          </Link>
          <Link className={`${styles.button} ${styles.secondary}`} to="/register">
            Register
          </Link>
        </div>

        <div className={styles.trust}>
          Trusted for secure fares, transparent records, and fast boarding.
        </div>
      </section>
    </main>
  );
}
