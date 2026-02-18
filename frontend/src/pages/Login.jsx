import { Link } from 'react-router-dom';
import styles from './Login.module.css';

export default function Login() {
  return (
    <div className={styles.hero}>
      <div className={styles.container}>
        <h1 className={styles.title}>Welcome Back</h1>
        <p className={styles.subtitle}>Access your campus wallet and ride history in seconds.</p>
        <form className={styles.form}>
          <input
            type="email"
            placeholder="Campus email"
            className={styles.input}
          />
          <input
            className={styles.input}
            type="password"
            placeholder="Password"
          />
          <div className={styles.row}>
            <Link to="/forgot" className={styles.link}>Forgot password?</Link>
          </div>
          <div className={styles.actions}>
            <button className={styles.btn} type="submit">Sign in</button>
            <button className={styles.btnsec} type="button">Continue with Google</button>
          </div>
          <p className={styles.footnote}>
            New to C Transit? <Link to="/register" className={styles.link}>Create an account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
