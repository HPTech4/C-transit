import { useState, useEffect } from 'react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { FaWallet, FaArrowRight, FaWifi } from 'react-icons/fa';
import styles from './DashboardHome.module.css';

// StatsCard Component
function StatsCard({ label, value, subValue, badge, badgeColor, trend, secondaryTrend }) {
  return (
    <div className={styles.statsCard}>
      <p className={styles.statsLabel}>{label}</p>
      <p className={styles.statsValue}>{value}</p>
      {subValue && <p className={styles.statsSubValue}>{subValue}</p>}
      {badge && (
        <span className={`${styles.badge} ${styles[badgeColor]}`}>
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

// TapRow Component
function TapRow({ tap }) {
  const statusStyles = {
    success: styles.success,
    failed: styles.failed,
    pending: styles.pending,
  };

  const statusLabels = {
    success: 'Success',
    failed: 'Failed',
    pending: 'Pending',
  };

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
        <p className={styles.tapAmount}>-₦{tap.amount.toLocaleString('en-NG')}</p>
        <span className={`${styles.statusBadge} ${statusStyles[tap.status]}`}>
          {statusLabels[tap.status]}
        </span>
      </div>
    </div>
  );
}

export default function DashboardHome({ userData, walletBalance, recentTaps, onFundWallet, onTransfer, onViewAll }) {
  const [activeChartTab, setActiveChartTab] = useState('month');
  const [chartData, setChartData] = useState([]);

  // Sample chart data
  const fareChartData = {
    week: [
      { date: 'Mon', amount: 150 },
      { date: 'Tue', amount: 250 },
      { date: 'Wed', amount: 100 },
      { date: 'Thu', amount: 300 },
      { date: 'Fri', amount: 200 },
      { date: 'Sat', amount: 400 },
      { date: 'Sun', amount: 160 },
    ],
    month: [
      { date: '7 May', amount: 300 },
      { date: '8 May', amount: 450 },
      { date: '15 May', amount: 200 },
      { date: '22 May', amount: 600 },
      { date: '29 May', amount: 400 },
    ],
    year: [
      { date: 'Jan', amount: 1800 },
      { date: 'Feb', amount: 2100 },
      { date: 'Mar', amount: 1600 },
      { date: 'Apr', amount: 2800 },
      { date: 'May', amount: 4560 },
    ],
  };

  useEffect(() => {
    setChartData(fareChartData[activeChartTab]);
  }, [activeChartTab]);

  return (
    <>
      {/* Greeting Section */}
      <div className={styles.greeting}>
        <p className={styles.greetingTitle}>Hello, {userData?.firstName || 'John'} 👋</p>
        <p className={styles.greetingSubtitle}>Welcome back to C-Transit</p>
      </div>

      {/* Wallet Card */}
      <div className={styles.walletCard}>
        <p className={styles.walletLabel}>Wallet Balance</p>
        <p className={styles.walletBalance}>
          ₦{(walletBalance || 2350.50).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </p>
        <p className={styles.walletAvailable}>Available Balance</p>
        <div className={styles.walletActions}>
          <button className={styles.fundBtn} onClick={onFundWallet || (() => {})}>
            <FaWallet size={14} />
            Fund Wallet
          </button>
          <button className={styles.transferBtn} onClick={onTransfer || (() => {})}>
            <FaArrowRight size={14} />
            Transfer
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        <StatsCard
          label="Total Trips"
          value="32"
          subValue="This Month"
        />
        <StatsCard
          label="Active Card"
          value="**** 5678"
          subValue="Virtual NFC Card"
          badge="Active"
          badgeColor="green"
        />
        <StatsCard
          label="Monthly Spending"
          value="₦4,560.00"
          subValue="This Month"
          trend={12}
          secondaryTrend={-8}
        />
      </div>

      {/* Tap Activity Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Recent Tap Activity</h3>
          <button className={styles.viewAll} onClick={onViewAll || (() => {})}>
            View All
          </button>
        </div>

        <div className={styles.tapActivityList}>
          {(recentTaps || []).slice(0, 5).map(tap => (
            <TapRow key={tap.id} tap={tap} />
          ))}
        </div>
      </div>

      {/* Fare Analytics Section */}
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
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="date" fontSize={10} stroke="#9CA3AF" />
              <YAxis fontSize={10} stroke="#9CA3AF" />
              <Tooltip
                formatter={(value) => `₦${value}`}
                labelFormatter={(label) => [`₦${label}`, 'Fare']}
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
        </div>

        <div className={styles.summary}>
          <div className={styles.summaryItem}>
            <p className={styles.summaryLabel}>Top Route</p>
            <p className={styles.summaryValue}>Lekki - VI</p>
          </div>
          <div className={styles.summaryItem}>
            <p className={styles.summaryLabel}>Total Spent</p>
            <p className={styles.summaryValue}>₦4,560.00</p>
          </div>
          <div className={styles.summaryItem}>
            <p className={styles.summaryLabel}>Avg. Per Trip</p>
            <p className={styles.summaryValue}>₦142.50</p>
          </div>
        </div>
      </div>
    </>
  );
}
