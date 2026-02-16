import styles from './Register.module.css';

export default function Register() {
  return (
    <div className={styles.container}>
      <h1>Register</h1>
      <form className={styles.form}>
        <input type="text" placeholder="Full Name" />
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Password" />
        <input type="password" placeholder="Confirm Password" />
        <button type="submit">Register</button>
      </form>
    </div>
  );
}
