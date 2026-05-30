import { useState } from 'react';
import { FaArrowLeft, FaEllipsisV, FaWifi, FaWallet, FaArrowRight, FaLock } from 'react-icons/fa';
import styles from './WalletPage.module.css';

export default function WalletPage({ userData, walletBalance, onBack }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const quickAmounts = [1000, 2000, 5000];

  const demoTransactions = [
    { id: '1', type: 'fund', title: 'Wallet Funded', date: 'Today, 2:30 PM', amount: 5000 },
    { id: '2', type: 'fare', title: 'Fare Payment - Lekki', date: 'Today, 9:41 AM', amount: -150 },
    { id: '3', type: 'fund', title: 'Wallet Funded', date: 'Yesterday, 10:00 AM', amount: 3000 },
  ];

  return (
    <>
      {/* Page Header */}
      <div className={styles.pageHeader}>
        <button className={styles.backBtn} onClick={onBack}>
          <FaArrowLeft size={20} />
        </button>
        <h1 className={styles.pageTitle}>Wallet</h1>
        <button className={styles.moreBtn}>
          <FaEllipsisV size={20} />
        </button>
      </div>

      {/* NFC Card Visual */}
      <div className={styles.nfcCard}>
        <div className={styles.cardTop}>
          <FaWifi size={20} color="white" />
          <span className={styles.cardBadge}>Active</span>
        </div>
        <p className={styles.cardNumber}>**** **** **** 5678</p>
        <div className={styles.cardBottom}>
          <p>Wallet No. CT-9NL-S67890</p>
          <p>Tap to view details</p>
        </div>
      </div>

      {/* Balance Display */}
      <div className={styles.balanceDisplay}>
        <p className={styles.balanceAmount}>
          ₦{(walletBalance || 2350.50).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn}>
            <FaWallet size={24} />
            <span>Fund Wallet</span>
          </button>
          <button className={styles.actionBtn}>
            <FaArrowRight size={24} />
            <span>Transfer</span>
          </button>
          <button className={styles.actionBtn}>
            <FaEllipsisV size={24} />
            <span>More</span>
          </button>
        </div>
      </div>

      {/* Quick Amount Pills */}
      <div className={styles.quickAmountSection}>
        <p className={styles.quickAmountLabel}>Quick Amount</p>
        <div className={styles.amountPills}>
          {quickAmounts.map(amount => (
            <button
              key={amount}
              className={`${styles.amountPill} ${selectedAmount === amount ? styles.amountPillActive : ''}`}
              onClick={() => setSelectedAmount(amount)}
            >
              ₦{(amount / 1000).toFixed(0)}K
            </button>
          ))}
          <button
            className={`${styles.amountPill} ${selectedAmount === 'other' ? styles.amountPillActive : ''}`}
            onClick={() => setSelectedAmount('other')}
          >
            Other
          </button>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className={styles.transactionSection}>
        <h3 className={styles.transactionTitle}>Recent Transactions</h3>
        <div className={styles.transactionList}>
          {demoTransactions.map(tx => (
            <div key={tx.id} className={styles.transactionRow}>
              <div className={styles.txIcon}>
                {tx.type === 'fund' ? <FaWallet /> : <FaArrowRight />}
              </div>
              <div className={styles.txInfo}>
                <p className={styles.txTitle}>{tx.title}</p>
                <p className={styles.txDate}>{tx.date}</p>
              </div>
              <div className={styles.txAmount}>
                <p className={tx.amount > 0 ? styles.txCredit : styles.txDebit}>
                  {tx.amount > 0 ? '+' : ''} ₦{Math.abs(tx.amount).toLocaleString('en-NG')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
