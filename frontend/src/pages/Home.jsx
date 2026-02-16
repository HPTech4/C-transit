import styles from './Home.module.css';

export default function Home() {
  return (
    <main className={styles.hero}>
      <header className={styles.nav}>
        <div className={styles.brand}>C Transit</div>
        <div className={styles.tagline}>Smart campus transit platform</div>
      </header>

      <section className={styles.content}>
        <p className={styles.kicker}>Reliable journeys, every day</p>
        <h1 className={styles.title}>Move with confidence across the campus.</h1>
        <p className={styles.subtitle}>
          Plan routes, track arrivals, and stay informed with real-time updates built
          for modern commuters.
        </p>

        <div className={styles.actions}>
          <a className={`${styles.button} ${styles.primary}`} href="/login">
            Login
          </a>
          <a className={`${styles.button} ${styles.secondary}`} href="/register">
            Register
          </a>
        </div>

        <div className={styles.trust}>
          Serving riders with live schedules, alerts, and trip planning.
        </div>
      </section>
    </main>
  );
}
