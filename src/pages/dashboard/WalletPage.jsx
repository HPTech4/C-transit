import { useState, useEffect, useCallback } from 'react';
import { FaArrowLeft, FaEllipsisV, FaWifi, FaWallet, FaArrowRight } from 'react-icons/fa';
import axios from 'axios';
import styles from './WalletPage.module.css';
import { USER_API_URL } from '../../config/api';

export default function WalletPage({ walletBalance, onBack }) {
  const [selectedAmount, setSelectedAmount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const quickAmounts = [1000, 2000, 5000];

  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}` };

      const res = await axios.get(
        `${USER_API_URL}/transactions/history`,
        { headers, params: { page: 1, limit: 5 } } // wallet page only needs a short recent list
      );

      const tripsData = res.data.data.transactions;
      const normalized = tripsData.map(t => ({
        id: `${t.terminal_id}-${t.synced_at}-${t.amount}`, // composite key, no real id from backend yet
        title: t.type === 'RIDE' ? `Fare Payment - ${t.terminal_id}` : 'Wallet Funded',
        date: t.synced_at,
        amount: t.type === 'RIDE' ? -Math.abs(Number(t.amount)) : Math.abs(Number(t.amount)),
        type: t.type === 'RIDE' ? 'fare' : 'fund',
      }));

      setTransactions(normalized);
      setError(null);
    } catch (err) {
      console.error('Failed to load wallet transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

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
        <p className={styles.cardNumber}>**** **** **** ****</p>
        <div className={styles.cardBottom}>
          <p>Wallet</p>
          <p>Tap to view details</p>
        </div>
      </div>

      {/* Balance Display */}
      <div className={styles.balanceDisplay}>
        <p className={styles.balanceAmount}>
          ₦{(walletBalance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} disabled title="Coming soon">
            <FaWallet size={24} />
            <span>Fund Wallet</span>
          </button>
          <button className={styles.actionBtn} disabled title="Coming soon">
            <FaArrowRight size={24} />
            <span>Transfer</span>
          </button>
          <button className={styles.actionBtn} disabled title="Coming soon">
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

        {loading && <p>Loading...</p>}
        {error && <p>{error}</p>}
        {!loading && !error && transactions.length === 0 && (
          <p className={styles.emptyState}>No transactions yet.</p>
        )}

        <div className={styles.transactionList}>
          {transactions.map(tx => (
            <div key={tx.id} className={styles.transactionRow}>
              <div className={styles.txIcon}>
                {tx.type === 'fund' ? <FaWallet /> : <FaArrowRight />}
              </div>
              <div className={styles.txInfo}>
                <p className={styles.txTitle}>{tx.title}</p>
                <p className={styles.txDate}>
                  {new Date(tx.date).toLocaleString('en-NG', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
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