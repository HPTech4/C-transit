import { useState, useEffect } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaWallet, FaArrowRight, FaWifi } from 'react-icons/fa';
import styles from './DashboardHome.module.css';

// ─── Status config (defined once, shared across component) ────────────────────
const statusStyles = {
  success: styles.statusSuccess,
  failed:  styles.statusFailed,
  pending: styles.statusPending,
};

const statusLabels = {
  success: 'Success',
  failed:  'Failed',
  pending: 'Pending',
};

// ─── StatsCard ────────────────────────────────────────────────────────────────
function StatsCard({ label, value, subValue, badge, badgeColor, trend, secondaryTrend }) {
  return (
    <div className={styles.statsCard}>
      <p className={styles.statsLabel}>{label}</p>
      <p className={styles.statsValue}>{value}</p>
      {subValue && <p className={styles.statsSubValue}>{subValue}</p>}
      {badge && (
        <span className={`${styles.badge} ${styles[badgeColor] ?? ''}`}>
          {badge}
        </span>
      )}
      {trend !== undefined && (
        <div className={trend >= 0 ? styles.trendUp : styles.trendDown}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
        </div>
      )}
      {secondaryTrend !== undefined && (
        <div className={styles.secondaryTrend}>
          ▼ {Math.abs(secondaryTrend)}%
        </div>
      )}
    </div>
  );
}

// ─── TapRow ───────────────────────────────────────────────────────────────────
function TapRow({ tap }) {
  // Normalise status so casing differences don't break lookups
  const normalizedStatus = tap.status?.toLowerCase();

  return (
    <div className={styles.tapRow}>
      <div className={styles.tapIcon}>
        <FaWifi />
      </div>
      <div className={styles.tapInfo}>
        <p className={styles.tapTerminal}>{tap.terminal}</p>
        <p className={styles.tapTime}>{tap.time}</p>
      </div>
      <div className={styles.tapRight}>
        <p className={styles.tapAmount}>
          -₦{Number(tap.amount || 0).toLocaleString('en-NG')}
        </p>
        <span className={`${styles.statusBadge} ${statusStyles[normalizedStatus] ?? ''}`}>
          {statusLabels[normalizedStatus] ?? tap.status}
        </span>
      </div>
    </div>
  );
}

// ─── DashboardHome ────────────────────────────────────────────────────────────
export default function DashboardHome({
  userData,
  walletBalance,
  recentTaps,
  chartData,
  stats,
  onFundWallet,
  onTransfer,
  onViewAll,
}) {
  const [activeChartTab, setActiveChartTab] = useState('month');
  const [activeChartData, setActiveChartData] = useState([]);

  useEffect(() => {
    if (chartData?.[activeChartTab]) {
      setActiveChartData(chartData[activeChartTab]);
    } else {
      setActiveChartData([]);
    }
  }, [activeChartTab, chartData]);

  // Guard: always use a safe array
  const safeTaps = Array.isArray(recentTaps) ? recentTaps : [];

  return (
    <div className={styles.dashboardHome}>

      {/* ── Greeting ─────────────────────────────────────────────────────── */}
      <div className={styles.greeting}>
        <p className={styles.greetingTitle}>
          Hello, {userData?.firstName || ''}
        </p>
        <p className={styles.greetingSubtitle}>Welcome back to C-Transit</p>
      </div>

      {/* ── Wallet Card ───────────────────────────────────────────────────── */}
      <div className={styles.walletCard}>
        <p className={styles.walletLabel}>Wallet Balance</p>
        <p className={styles.walletBalance}>
          ₦{(walletBalance || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
        <p className={styles.walletAvailable}>Available Balance</p>
        <div className={styles.walletActions}>
          <button className={styles.fundBtn} onClick={onFundWallet ?? (() => {})}>
            <FaWallet size={14} />
            Fund Wallet
          </button>
          <button className={styles.transferBtn} onClick={onTransfer ?? (() => {})}>
            <FaArrowRight size={14} />
            Transfer
          </button>
        </div>
      </div>

      {/* ── Stats Row ─────────────────────────────────────────────────────── */}
      <div className={styles.statsRow}>
        <StatsCard
          label="Total Trips"
          value={stats?.totalTrips ?? '-'}
          subValue="This Month"
        />
        <StatsCard
          label="Active Card"
          value={stats?.cardNumber ?? '-'}
          subValue="Virtual NFC Card"
          badge={stats?.cardStatus ?? null}
          badgeColor="green"
        />
        <StatsCard
          label="Monthly Spending"
          value={
            stats?.monthlySpending != null
              ? `₦${Number(stats.monthlySpending).toLocaleString('en-NG', { minimumFractionDigits: 2 })}`
              : '-'
          }
          subValue="This Month"
          trend={stats?.spendingTrend}
          secondaryTrend={stats?.secondaryTrend}
        />
      </div>

      {/* ── Recent Tap Activity ───────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Tap Activity</h3>
          <button className={styles.viewAll} onClick={onViewAll ?? (() => {})}>
            View All
          </button>
        </div>

        <div className={styles.tapActivityList}>
          {safeTaps.length > 0 ? (
            safeTaps.slice(0, 5).map(tap => (
              <TapRow key={tap.id} tap={tap} />
            ))
          ) : (
            <p className={styles.emptyState}>No recent tap activity</p>
          )}
        </div>
      </div>

      {/* ── Fare Analytics ────────────────────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Fare Analytics</h3>
          <div className={styles.tabs}>
            {['Week', 'Month', 'Year'].map(tab => (
              <button
                key={tab}
                className={`${styles.tab} ${activeChartTab === tab.toLowerCase() ? styles.tabActive : ''}`}
                onClick={() => setActiveChartTab(tab.toLowerCase())}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          {activeChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={activeChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" fontSize={10} stroke="#9CA3AF" />
                <YAxis fontSize={10} stroke="#9CA3AF" />
                <Tooltip
                  formatter={(value) => `₦${value}`}
                  contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#1A56DB"
                  strokeWidth={2.5}
                  dot={{ fill: '#1A56DB', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className={styles.emptyState}>No analytics data available</p>
          )}
        </div>
      </div>

    </div>
  );
}