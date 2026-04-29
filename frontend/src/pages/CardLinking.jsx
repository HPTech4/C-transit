import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FaLock, FaArrowLeft, FaCheckCircle } from 'react-icons/fa';

import styles from './CardLinking.module.css';

export default function CardLinking() {
  const navigate = useNavigate();
  const [pin, setPin] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (event) => {
    event.preventDefault();
    // simple validation: 6 digits
    if (!/^\d{6}$/.test(pin)) return;

    // BACKEND INTEGRATION: POST /api/user/card-linking
    // Send: { pin: "123456", cardToken: "token_from_payment_gateway" }
    // Response: { success: true, message: "Card linked successfully", cardLast4: "1234" }
    // TODO: Replace with actual API endpoint when backend is ready
    setSuccess(true);
    sessionStorage.setItem('authSuccessMessage', 'Verification successful. Redirecting to login...');

    setTimeout(() => navigate('/login', { replace: true }), 1600);
  };

  return (
    <main className={styles.page}>
      <motion.section className={styles.card} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <FaArrowLeft /> Back Home
        </button>

        <div className={styles.header}>
          <span className={styles.badge}>Wallet Setup</span>
          <h1>Link Your Card</h1>
          <p>Enter the 6-digit card PIN to complete linking.</p>
        </div>

        {success ? (
          <div className={styles.successBox}>
            <FaCheckCircle />
            <h2>Card linked successfully</h2>
            <p>Redirecting you to login now.</p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label>
              <span><FaLock /> 6-digit PIN</span>
              <input
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="Enter 6-digit PIN"
                inputMode="numeric"
                maxLength={6}
                pattern="\\d{6}"
              />
            </label>

            
            <button className={styles.submitBtn} type="submit" disabled={!/^\d{6}$/.test(pin)}>Link Card</button>
          </form>
        )}
      </motion.section>
    </main>
  );
}