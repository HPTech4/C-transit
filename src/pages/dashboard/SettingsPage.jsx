import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FaArrowLeft,
  FaShieldAlt,
  FaTrash,
  FaCog,
  FaBell,
  FaDownload,
  FaCheckCircle,
  FaLock,
  FaUsers,
  FaInfoCircle,
  FaIdCard,
  FaCreditCard,
  FaExclamationTriangle,
  FaArrowRight,
  FaWifi,
  FaTimesCircle,
} from 'react-icons/fa';
import styles from './SettingsPage.module.css';
import KYCModal from '../../components/KYCModal';


export default function Settings() {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionModal, setActionModal] = useState({ title: '', message: '' });
  const [successMessage, setSuccessMessage] = useState('');
  const toastTimerRef = useRef(null);

  const [preferences, setPreferences] = useState({
    language: 'english',
    theme: 'light',
    currency: 'NGN',
    emailNotif: true,
    pushNotif: true,
    smsNotif: false,
    busAlerts: true,
    paymentAlerts: true,
    tripReminders: true,
    promos: false,
  });

  useEffect(() => {
    const savedTheme    = localStorage.getItem('user_theme');
    const savedLanguage = localStorage.getItem('user_language');
    const savedCurrency = localStorage.getItem('user_currency');
    if (savedTheme || savedLanguage || savedCurrency) {
      setPreferences(prev => ({
        ...prev,
        ...(savedTheme    ? { theme: savedTheme }       : {}),
        ...(savedLanguage ? { language: savedLanguage } : {}),
        ...(savedCurrency ? { currency: savedCurrency } : {}),
      }));
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = preferences.theme;
    localStorage.setItem('user_theme',    preferences.theme);
    localStorage.setItem('user_language', preferences.language);
    localStorage.setItem('user_currency', preferences.currency);
  }, [preferences.theme, preferences.language, preferences.currency]);

  // FIX 3: cleanup timer on unmount to avoid state update on unmounted component
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const handleSavePreferences = (key, value) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const showToast = (message) => {
    setSuccessMessage(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setSuccessMessage(''), 2500);
  };

  const openActionModal = (title, message) => {
    setActionModal({ title, message });
    setShowActionModal(true);
  };

  const handleDeleteAccount = () => {
    setShowDeleteConfirm(false);
    showToast('Delete request captured. Your account removal flow would continue here.');
  };

  const handleDownloadData = () => {
    // API not ready yet — toast only
    showToast('Your data export has been prepared.');
  };

  const containerVariants = {
    hidden:  { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
  };

  const itemVariants = {
    hidden:  { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const tabs = [
    { id: 'general',       label: 'General',           icon: <FaCog /> },
    { id: 'notifications', label: 'Notifications',     icon: <FaBell /> },
    { id: 'cards',         label: 'Card Linking',       icon: <FaCreditCard /> },
    { id: 'kyc',           label: 'Verification',       icon: <FaIdCard /> },
    { id: 'privacy',       label: 'Privacy & Security', icon: <FaShieldAlt /> },
    { id: 'dispute',       label: 'Report Dispute',     icon: <FaExclamationTriangle /> },
  ];

  return (
    <motion.div
      className={styles.settingsPage}
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className={styles.header}>
        <motion.button
          className={styles.backBtn}
          onClick={() => navigate('/dashboard')}
          whileHover={{ x: -4 }}
        >
          <FaArrowLeft /> Back
        </motion.button>
        <h1>Settings & Preferences</h1>
      </div>

      {successMessage && (
        <motion.div
          className={styles.toast}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaCheckCircle /> {successMessage}
        </motion.div>
      )}

      <div className={styles.container}>
        <motion.div variants={itemVariants}>
          <GeneralSettings preferences={preferences} onSave={handleSavePreferences} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <NotificationSettings preferences={preferences} onSave={handleSavePreferences} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <CardLinking onShowInfo={openActionModal} onToast={showToast} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <KYCSection onToast={showToast} />
        </motion.div>
        <motion.div variants={itemVariants}>
          <PrivacySettings
            onDownload={handleDownloadData}
            onDelete={() => setShowDeleteConfirm(true)}
            onShowInfo={openActionModal}
          />
        </motion.div>
        <motion.div variants={itemVariants}>
          <ReportDispute onToast={showToast} />
        </motion.div>
      </div>

      {showDeleteConfirm && (
        <DeleteConfirmModal
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
      {showActionModal && (
        <ActionInfoModal
          title={actionModal.title}
          message={actionModal.message}
          onClose={() => setShowActionModal(false)}
        />
      )}
    </motion.div>
  );
}


/* ── General Settings ──────────────────────────────────────────────────────── */
function GeneralSettings({ preferences, onSave }) {
  return (
    <motion.div className={styles.settingsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2>General Settings</h2>

      <div className={styles.settingItem}>
        <div className={styles.settingLabel}>
          <label>Language</label>
          <p>Choose your preferred language</p>
        </div>
        <select value={preferences.language} onChange={e => onSave('language', e.target.value)} className={styles.select}>
          <option value="english">English</option>
          <option value="yoruba">Yoruba</option>
          <option value="igbo">Igbo</option>
          <option value="hausa">Hausa</option>
        </select>
      </div>

      <div className={styles.settingItem}>
        <div className={styles.settingLabel}>
          <label>Theme</label>
          <p>Choose your preferred theme</p>
        </div>
        <div className={styles.themeButtons}>
          <motion.button
            type="button"
            className={`${styles.themeBtn} ${preferences.theme === 'light' ? styles.active : ''}`}
            onClick={() => onSave('theme', 'light')}
            whileHover={{ scale: 1.05 }}
          > Light</motion.button>
          <motion.button
            type="button"
            className={`${styles.themeBtn} ${preferences.theme === 'dark' ? styles.active : ''}`}
            onClick={() => onSave('theme', 'dark')}
            whileHover={{ scale: 1.05 }}
          > Dark</motion.button>
        </div>
      </div>

      <div className={styles.settingItem}>
        <div className={styles.settingLabel}>
          <label>Currency</label>
          <p>All amounts are displayed in Nigerian Naira (₦)</p>
        </div>
        <select value={preferences.currency} className={styles.select} disabled>
          <option value="NGN">Nigerian Naira (₦)</option>
        </select>
      </div>
    </motion.div>
  );
}

/* ── Notification Settings ─────────────────────────────────────────────────── */
function NotificationSettings({ preferences, onSave }) {
  const methods = [
    { key: 'emailNotif', label: 'Email Notifications', desc: 'Receive updates via email' },
    { key: 'pushNotif',  label: 'Push Notifications',  desc: 'Receive app notifications' },
    { key: 'smsNotif',   label: 'SMS Alerts',           desc: 'Receive text messages' },
  ];

  const types = [
    { key: 'busAlerts',     label: ' Bus Arrival Alerts',    desc: 'Get notified when bus is near' },
    { key: 'paymentAlerts', label: ' Payment Confirmations', desc: 'Confirm after each transaction' },
    { key: 'tripReminders', label: ' Trip Reminders',        desc: 'Remind before your scheduled trips' },
    { key: 'promos',        label: ' Promotions & Offers',   desc: 'Latest deals and special offers' },
  ];

  return (
    <motion.div className={styles.settingsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2>Notification Preferences</h2>

      <div className={styles.sectionGroup}>
        <h3>Notification Methods</h3>
        {methods.map(m => (
          <div key={m.key} className={styles.toggleItem}>
            <div className={styles.toggleLabel}>
              <label>{m.label}</label>
              <p>{m.desc}</p>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" checked={preferences[m.key]} onChange={e => onSave(m.key, e.target.checked)} />
              <span className={styles.slider}></span>
            </label>
          </div>
        ))}
      </div>

      <div className={styles.sectionGroup}>
        <h3>Notification Types</h3>
        {types.map(t => (
          <div key={t.key} className={styles.toggleItem}>
            <div className={styles.toggleLabel}>
              <label>{t.label}</label>
              <p>{t.desc}</p>
            </div>
            <label className={styles.toggle}>
              <input type="checkbox" checked={preferences[t.key]} onChange={e => onSave(t.key, e.target.checked)} />
              <span className={styles.slider}></span>
            </label>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Card Linking ──────────────────────────────────────────────────────────── */
function CardLinking({ onShowInfo, onToast }) {
  const [cards, setCards] = useState([
    { id: 1, uid: 'NFC-4A2F-9B1C', label: 'My Transit Card', linked: true, linkedAt: '2024-11-10' },
  ]);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [newCardUid, setNewCardUid] = useState('');
  const [newCardLabel, setNewCardLabel] = useState('');

  const handleLink = () => {
    if (!newCardUid.trim()) return;
    const newCard = {
      id: Date.now(),
      uid: newCardUid.trim().toUpperCase(),
      label: newCardLabel.trim() || 'My NFC Card',
      linked: true,
      linkedAt: new Date().toISOString().split('T')[0],
    };
    setCards(prev => [...prev, newCard]);
    setNewCardUid('');
    setNewCardLabel('');
    setShowLinkForm(false);
    onToast('NFC card linked successfully.');
  };

  const handleUnlink = (id) => {
    setCards(prev => prev.filter(c => c.id !== id));
    onToast('Card unlinked from your account.');
  };

  return (
    <motion.div className={styles.settingsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className={styles.cardSectionHeader}>
        <div>
          <h2>NFC Card Linking</h2>
          <p className={styles.cardSectionDesc}>Manage physical NFC transit cards linked to your account.</p>
        </div>
        <motion.button
          className={styles.linkCardBtn}
          onClick={() => setShowLinkForm(v => !v)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaWifi /> Link New Card
        </motion.button>
      </div>

      {showLinkForm && (
        <motion.div
          className={styles.linkForm}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className={styles.linkFormGrid}>
            <div className={styles.formGroup}>
              <label>Card UID</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. NFC-4A2F-9B1C"
                value={newCardUid}
                onChange={e => setNewCardUid(e.target.value)}
              />
            </div>
            <div className={styles.formGroup}>
              <label>Card Label (optional)</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. My Transit Card"
                value={newCardLabel}
                onChange={e => setNewCardLabel(e.target.value)}
              />
            </div>
          </div>
          <p className={styles.linkHint}>
            📡 Find your card UID printed on the back of your physical NFC card.
          </p>
          <div className={styles.linkFormActions}>
            <button className={styles.cancelBtn} onClick={() => setShowLinkForm(false)}>Cancel</button>
            <motion.button
              className={styles.actionBtn}
              onClick={handleLink}
              disabled={!newCardUid.trim()}
              whileHover={{ scale: 1.02 }}
            >
              <FaWifi /> Link Card
            </motion.button>
          </div>
        </motion.div>
      )}

      <div className={styles.cardsList}>
        {cards.length === 0 ? (
          <div className={styles.emptyCards}>
            <FaCreditCard size={32} />
            <p>No NFC cards linked yet.</p>
          </div>
        ) : (
          cards.map(card => (
            <div key={card.id} className={styles.cardRow}>
              <div className={styles.cardRowIcon}><FaWifi /></div>
              <div className={styles.cardRowInfo}>
                <p className={styles.cardRowLabel}>{card.label}</p>
                <p className={styles.cardRowUid}>{card.uid}</p>
                <p className={styles.cardRowDate}>Linked on {card.linkedAt}</p>
              </div>
              <div className={styles.cardRowRight}>
                <span className={styles.linkedBadge}><FaCheckCircle /> Active</span>
                <motion.button
                  className={styles.unlinkBtn}
                  onClick={() => handleUnlink(card.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaTimesCircle /> Unlink
                </motion.button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

/* ── KYC Section ───────────────────────────────────────────────────────────── */
function KYCSection({ onToast }) {
  const [showKYCModal, setShowKYCModal] = useState(false);

  // FIX 2: kycStatus must be state so it can update after submission
  const [kycStatus, setKycStatus] = useState('unverified'); // 'unverified' | 'pending' | 'verified'

  const statusConfig = {
    unverified: {
      label: 'Not Verified',
      color: styles.kycBadgeRed,
      icon: <FaTimesCircle />,
      desc: 'Your identity has not been verified. Verify now to unlock full account features.',
    },
    pending: {
      label: 'Verification Pending',
      color: styles.kycBadgeYellow,
      icon: <FaInfoCircle />,
      desc: 'Your documents are under review. This usually takes 1–2 business days.',
    },
    verified: {
      label: 'Verified',
      color: styles.kycBadgeGreen,
      icon: <FaCheckCircle />,
      desc: 'Your identity has been successfully verified.',
    },
  };

  const config = statusConfig[kycStatus];

  // FIX 4: update kycStatus to 'pending' on successful KYC submission
  const handleKYCClose = (result) => {
    setShowKYCModal(false);
    if (result?.success) {
      setKycStatus('pending');
      onToast(result.message || 'KYC submitted successfully.');
    }
  };

  return (
    <>
      <motion.div className={styles.settingsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h2>Identity Verification (KYC)</h2>

        <div className={styles.kycStatusCard}>
          <div className={`${styles.kycBadge} ${config.color}`}>
            {config.icon} {config.label}
          </div>
          <p className={styles.kycDesc}>{config.desc}</p>

          {kycStatus !== 'verified' && (
            <div className={styles.kycFeatures}>
              <p className={styles.kycFeaturesTitle}>Verification unlocks:</p>
              <ul>
                <li><FaCheckCircle /> Higher wallet limits</li>
                <li><FaCheckCircle /> Transfer to other users</li>
                <li><FaCheckCircle /> Full transaction history</li>
                <li><FaCheckCircle /> Priority support</li>
              </ul>
            </div>
          )}
        </div>

        {kycStatus === 'unverified' && (
          <motion.button
            className={styles.kycBtn}
            onClick={() => setShowKYCModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaIdCard /> Start Verification <FaArrowRight />
          </motion.button>
        )}

        {kycStatus === 'pending' && (
          <div className={styles.kycPendingNote}>
             Your submission is being reviewed. We'll notify you once it's complete.
          </div>
        )}
      </motion.div>

      {showKYCModal && (
        <KYCModal onClose={handleKYCClose} />
      )}
    </>
  );
}

/* ── Report Dispute ────────────────────────────────────────────────────────── */
function ReportDispute({ onToast }) {
  const [form, setForm] = useState({
    type: '',
    transactionId: '',
    description: '',
    amount: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const disputeTypes = [
    'Incorrect fare deduction',
    'Duplicate charge',
    'Card tap not recorded',
    'Wallet not credited',
    'Unauthorized transaction',
    'Other',
  ];

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!form.type || !form.description.trim()) return;
    console.log('Dispute submitted:', form);
    setSubmitted(true);
    onToast('Dispute submitted. We will respond within 24–48 hours.');
  };

  if (submitted) {
    return (
      <motion.div
        className={styles.settingsCard}
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className={styles.disputeSuccess}>
          <FaCheckCircle className={styles.disputeSuccessIcon} />
          <h2>Dispute Submitted</h2>
          <p>Your dispute has been logged. Our support team will review and respond within 24–48 hours.</p>
          <motion.button
            className={styles.actionBtn}
            onClick={() => { setSubmitted(false); setForm({ type: '', transactionId: '', description: '', amount: '' }); }}
            whileHover={{ scale: 1.02 }}
          >
            Submit Another
          </motion.button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div className={styles.settingsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2>Report a Dispute</h2>
      <p className={styles.disputeSubtitle}>
        Experiencing an issue with a transaction? Let us know and we'll resolve it.
      </p>

      <div className={styles.disputeForm}>
        <div className={styles.formGroup}>
          <label>Dispute Type <span className={styles.required}>*</span></label>
          <select
            className={styles.select}
            value={form.type}
            onChange={e => handleChange('type', e.target.value)}
          >
            <option value="">Select a dispute type</option>
            {disputeTypes.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className={styles.disputeFormRow}>
          <div className={styles.formGroup}>
            <label>Transaction ID (optional)</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. TXN-20241115-001"
              value={form.transactionId}
              onChange={e => handleChange('transactionId', e.target.value)}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Amount Disputed (optional)</label>
            <input
              className={styles.input}
              type="number"
              placeholder="e.g. 150"
              value={form.amount}
              onChange={e => handleChange('amount', e.target.value)}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Description <span className={styles.required}>*</span></label>
          <textarea
            className={styles.textarea}
            rows={4}
            placeholder="Describe the issue in detail..."
            value={form.description}
            onChange={e => handleChange('description', e.target.value)}
          />
        </div>

        <motion.button
          className={styles.actionBtn}
          onClick={handleSubmit}
          disabled={!form.type || !form.description.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FaExclamationTriangle /> Submit Dispute
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ── Privacy Settings ──────────────────────────────────────────────────────── */
function PrivacySettings({ onDownload, onDelete, onShowInfo }) {
  return (
    <motion.div className={styles.settingsCard} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <h2>Privacy & Security</h2>

      <div className={styles.sectionGroup}>
        <h3>Two-Factor Authentication</h3>
        <div className={styles.actionItem}>
          <div>
            <label>Enable 2FA</label>
            <p>Add extra security to your account</p>
          </div>
          <motion.button
            className={styles.actionBtn}
            onClick={() => onShowInfo('Two-Factor Authentication', '2FA setup would connect to the backend here.')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaLock /> Set Up 2FA
          </motion.button>
        </div>
      </div>

      <div className={styles.sectionGroup}>
        <h3>Active Sessions</h3>
        <div className={styles.actionItem}>
          <div>
            <label>View Active Sessions</label>
            <p>Manage devices where you're logged in</p>
          </div>
          <motion.button
            className={styles.actionBtn}
            onClick={() => onShowInfo('Active Sessions', 'This section would list devices, IPs, and login timestamps once connected to the API.')}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <FaUsers /> View Sessions
          </motion.button>
        </div>
      </div>

      <div className={styles.sectionGroup}>
        <h3>Data Management</h3>
        <div className={styles.actionItem}>
          <div>
            <label>📥 Download Your Data</label>
            <p>Get a copy of all your data</p>
          </div>
          <motion.button className={styles.actionBtn} onClick={onDownload} whileHover={{ scale: 1.02 }}>
            <FaDownload /> Download
          </motion.button>
        </div>
        <div className={styles.actionItem}>
          <div>
            <label>🗑️ Delete Account</label>
            <p>Permanently delete your account and all data</p>
          </div>
          <motion.button
            className={`${styles.actionBtn} ${styles.dangerBtn}`}
            onClick={onDelete}
            whileHover={{ scale: 1.02 }}
          >
            <FaTrash /> Delete
          </motion.button>
        </div>
      </div>

      <div className={styles.sectionGroup}>
        <h3>Legal</h3>
        <div className={styles.legalLinks}>
          <a href="#" className={styles.link}> Privacy Policy</a>
          <a href="#" className={styles.link}> Terms & Conditions</a>
        </div>
      </div>
    </motion.div>
  );
}

/* ── Modals ────────────────────────────────────────────────────────────────── */

// FIX 7: apply singleAction class so the single Close button isn't left-aligned
function ActionInfoModal({ title, message, onClose }) {
  return (
    <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className={styles.modal} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
        <h2>{title}</h2>
        <p className={styles.infoText}><FaInfoCircle /> {message}</p>
        <div className={`${styles.modalActions} ${styles.singleAction}`}>
          <motion.button className={styles.cancelBtn} onClick={onClose} whileHover={{ scale: 1.02 }}>
            Close
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// FIX 5: password validation — require minimum 6 characters to match a real password
function DeleteConfirmModal({ onConfirm, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (password.length < 6) {
      setError('Please enter your full account password.');
      return;
    }
    setError('');
    onConfirm(password);
  };

  return (
    <motion.div className={styles.modalOverlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <motion.div className={styles.modal} initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
        <h2>Delete Account</h2>
        <p className={styles.warningText}>
           This action is permanent and cannot be undone. All your data will be deleted.
        </p>
        <div className={styles.formGroup}>
          <label>Enter your password to confirm</label>
          <input
            type="password"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            placeholder="Enter password"
            className={styles.input}
          />
          {error && <p className={styles.fieldError}>{error}</p>}
        </div>
        <div className={styles.modalActions}>
          <motion.button className={styles.cancelBtn} onClick={onCancel} whileHover={{ scale: 1.02 }}>
            Cancel
          </motion.button>
          <motion.button
            className={`${styles.submitBtn} ${styles.dangerBtn}`}
            onClick={handleConfirm}
            disabled={!password}
            whileHover={{ scale: 1.02 }}
          >
            Delete Account
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}