import { Link } from 'react-router-dom';
import styles from './Register.module.css';

export default function Register() {
  return (
    <div className={styles.hero}>
      <div className={styles.container}>
        <h1 className={styles.title}>Create Your C Transit Wallet</h1>
        <p className={styles.subtitle}>Set up fast, cashless rides across campus in minutes.</p>
        <form className={styles.form}>
          <input className={styles.input} type="text" placeholder="Full name" />
          <input className={styles.input} type="email" placeholder="Campus email" />
          <input className={styles.input} type="password" placeholder="Create password" />
          <input className={styles.input} type="password" placeholder="Confirm password" />
          <div className={styles.actions}>
            <button className={styles.btn} type="submit">Create account</button>
            <button className={styles.btnsec} type="button">Continue with Google</button>
          </div>
          <p className={styles.footnote}>
            Already have an account? <Link to="/login" className={styles.link}>Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
