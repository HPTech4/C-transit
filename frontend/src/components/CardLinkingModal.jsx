import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheckCircle, FaLock, FaTimes } from 'react-icons/fa';

import styles from './CardLinkingModal.module.css';

export default function CardLinkingModal({ isOpen, onClose }) {
  const [pin, setPin] = useState('');
  const [isSuccessful, setIsSuccessful] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPin('');
      setIsSuccessful(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isSuccessful) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      onClose();
    }, 1600);

    return () => window.clearTimeout(timer);
  }, [isSuccessful, onClose]);

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(pin)) {
      return;
    }

    // Backend integration placeholder: POST /api/user/card-linking
    // This endpoint is not ready yet, so the modal shows a demo success state for now.
    sessionStorage.setItem('authSuccessMessage', 'Card linked successfully. You can now use wallet funding tools.');
    setIsSuccessful(true);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={styles.overlay}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.section
            className={styles.modal}
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(event) => event.stopPropagation()}
            aria-modal="true"
            role="dialog"
            aria-label="Card linking"
          >
            <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close card linking modal">
              <FaTimes />
            </button>

            <div className={styles.header}>
              <span className={styles.badge}>Wallet Setup</span>
              <h2>Link Your Card</h2>
              <p>Enter the 6-digit card PIN to complete linking.</p>
            </div>

            {isSuccessful ? (
              <div className={styles.successBox}>
                <FaCheckCircle />
                <h3>Card linked successfully</h3>
                <p>Returning to your dashboard in a moment.</p>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <label>
                  <span>
                    <FaLock /> 6-digit PIN
                  </span>
                  <input
                    value={pin}
                    onChange={(event) => setPin(event.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit PIN"
                    inputMode="numeric"
                    maxLength={6}
                    pattern="\\d{6}"
                  />
                </label>

                <div className={styles.noteBox}>
                  <p>Your PIN is used to verify card ownership. This is a demo flow; no card data is stored.</p>
                </div>

                <button className={styles.submitBtn} type="submit" disabled={!/^\d{6}$/.test(pin)}>
                  Link Card
                </button>
              </form>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}