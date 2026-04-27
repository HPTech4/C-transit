import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaBroadcastTower,
  FaChartLine,
  FaHeadset,
  FaMoneyBillWave,
  FaSignOutAlt,
  FaUserCheck,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import Sidebar from '../components/Admin/Sidebar';
import Navbar from '../components/Admin/Navbar';
import StatCard from '../components/Admin/StatCard';
import ActivityTable from '../components/Admin/ActivityTable';
import PrimaryButton from '../components/Admin/PrimaryButton';
import Modal from '../components/Admin/Modal';
import { clearAdminSession, getAdminProfile } from '../config/adminAuth';

import styles from './AdminDashboard.module.css';

const statCards = [
  {
    id: 'revenue',
    title: 'Total Revenue (This Month)',
    value: '₦12,450,000',
    trend: '+14.2% from last month',
    icon: FaMoneyBillWave,
  },
  {
    id: 'activeUsers',
    title: 'Active Riders',
    value: '8,942',
    trend: '+380 this week',
    icon: FaUserCheck,
  },
  {
    id: 'openTickets',
    title: 'Open Support Tickets',
    value: '47',
    trend: '11 high-priority',
    icon: FaHeadset,
  },
  {
    id: 'paymentSuccess',
    title: 'Payment Success Rate',
    value: '98.4%',
    trend: '+0.6% this week',
    icon: FaChartLine,
  },
];

// Demand data points for the heat-like bar chart.
const demandHeatData = [
  { slot: '08:00', demand: 72 },
  { slot: '09:00', demand: 55 },
  { slot: '10:00', demand: 43 },
  { slot: '11:00', demand: 86 },
  { slot: '12:00', demand: 63 },
  { slot: '13:00', demand: 40 },
  { slot: '14:00', demand: 79 },
  { slot: '15:00', demand: 61 },
  { slot: '16:00', demand: 57 },
  { slot: '17:00', demand: 75 },
  { slot: '18:00', demand: 91 },
  { slot: '19:00', demand: 68 },
];

// Revenue curve points in Naira for the area chart.
const revenueTrendData = [
  { hour: '08:00', revenue: 280000 },
  { hour: '09:00', revenue: 310000 },
  { hour: '10:00', revenue: 295000 },
  { hour: '11:00', revenue: 360000 },
  { hour: '12:00', revenue: 335000 },
  { hour: '13:00', revenue: 390000 },
  { hour: '14:00', revenue: 420000 },
  { hour: '15:00', revenue: 402000 },
];

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});

function getHeatColor(demand, isDarkMode) {
  if (isDarkMode) {
    if (demand >= 85) return '#38bdf8';
    if (demand >= 70) return '#22d3ee';
    if (demand >= 55) return '#60a5fa';
    return '#93c5fd';
  }

  if (demand >= 85) return '#1d4ed8';
  if (demand >= 70) return '#2563eb';
  if (demand >= 55) return '#3b82f6';
  return '#60a5fa';
}

const recentActivityRows = [
  {
    id: 1,
    type: 'Wallet Top-up',
    reference: 'TRX-778102',
    user: 'Ibrahim Musa',
    amount: 6500,
    status: 'Success',
    time: '4 mins ago',
  },
  {
    id: 2,
    type: 'Support Escalation',
    reference: 'SUP-00931',
    user: 'Support Queue',
    amount: 0,
    status: 'Pending',
    time: '12 mins ago',
  },
  {
    id: 3,
    type: 'Settlement Batch',
    reference: 'SET-22014',
    user: 'Finance Engine',
    amount: 320000,
    status: 'Success',
    time: '28 mins ago',
  },
  {
    id: 4,
    type: 'Refund Attempt',
    reference: 'RFD-10082',
    user: 'Amina Bello',
    amount: 1200,
    status: 'Failed',
    time: '37 mins ago',
  },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const adminProfile = useMemo(() => getAdminProfile(), []);

  const [activeNav, setActiveNav] = useState('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('admin_dark_mode') === 'true');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCards, setLoadingCards] = useState(true);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setLoadingCards(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem('admin_dark_mode', darkMode ? 'true' : 'false');
  }, [darkMode]);

  const handleLogout = () => {
    clearAdminSession();
    navigate('/admin/login', { replace: true });
  };

  const handleToggleDarkMode = () => {
    setDarkMode((previousValue) => !previousValue);
  };

  const chartColors = darkMode
    ? {
        grid: 'rgba(148, 163, 184, 0.24)',
        tick: '#cbd5e1',
        tooltipBg: '#17213d',
        tooltipBorder: '#334155',
        tooltipText: '#e2e8f0',
        revenueStroke: '#38bdf8',
        revenueFillStart: '#38bdf8',
      }
    : {
        grid: 'rgba(148, 163, 184, 0.25)',
        tick: '#64748b',
        tooltipBg: '#ffffff',
        tooltipBorder: '#dbe7ff',
        tooltipText: '#0f172a',
        revenueStroke: '#2563eb',
        revenueFillStart: '#2563eb',
      };

  return (
    <div className={`${styles.wrapper} ${darkMode ? styles.dark : ''}`.trim()}>
      <Sidebar
        activeNav={activeNav}
        onNavSelect={(id) => {
          setActiveNav(id);
          setMobileSidebarOpen(false);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((prev) => !prev)}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      <div className={`${styles.main} ${sidebarCollapsed ? styles.mainExpanded : ''}`.trim()}>
        <Navbar
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          darkMode={darkMode}
          onToggleDarkMode={handleToggleDarkMode}
          notificationCount={5}
          adminName={adminProfile?.name || 'Admin'}
          onToggleProfileMenu={() => setShowProfileMenu((prev) => !prev)}
          onToggleMobileSidebar={() => setMobileSidebarOpen(true)}
        />

        <AnimatePresence>
          {showProfileMenu && (
            <motion.div
              className={styles.profileMenu}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <p>{adminProfile?.email || 'admin@ctransit.ng'}</p>
              <span>{adminProfile?.role || 'Super Admin'}</span>
              <button onClick={handleLogout}>
                <FaSignOutAlt /> Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <section className={styles.welcomeSection}>
          <div>
            <h1>Welcome back, {adminProfile?.name || 'Operations Admin'}</h1>
            <p>
              You are viewing the operational command center for C-Transit with live placeholders and
              dashboard-ready widgets.
            </p>
          </div>
          <div className={styles.actionGroup}>
            <PrimaryButton onClick={() => setShowBroadcastModal(true)}>
              <FaBroadcastTower /> Broadcast Notice
            </PrimaryButton>
            <PrimaryButton variant="ghost" onClick={() => setActiveNav('reports')}>
              View Reports
            </PrimaryButton>
          </div>
        </section>

        <section className={styles.cardGrid}>
          {statCards.map((card) => (
            <StatCard key={card.id} {...card} loading={loadingCards} />
          ))}
        </section>

        <section className={styles.chartGrid}>
          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Realtime Demand Heat Trend</h2>
              <span>Last 12 intervals</span>
            </div>

            {/* Recharts BarChart styled to behave like a demand heat panel. */}
            <div className={styles.chartCanvas}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandHeatData} barCategoryGap={8}>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="slot" tick={{ fill: chartColors.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: chartColors.tick, fontSize: 11 }} axisLine={false} tickLine={false} width={32} />
                  <Tooltip
                    formatter={(value) => [`${value}%`, 'Demand']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      background: chartColors.tooltipBg,
                      color: chartColors.tooltipText,
                    }}
                    labelStyle={{ color: chartColors.tooltipText }}
                  />
                  <Bar dataKey="demand" radius={[7, 7, 0, 0]}>
                    {demandHeatData.map((entry) => (
                      <Cell key={entry.slot} fill={getHeatColor(entry.demand, darkMode)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </article>

          <article className={styles.panel}>
            <div className={styles.panelHead}>
              <h2>Revenue Wave (Dummy Data)</h2>
              <span>NGN hourly trend</span>
            </div>

            {/* Recharts AreaChart with Naira formatting for tooltip and y-axis. */}
            <div className={styles.chartCanvas}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrendData}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.revenueFillStart} stopOpacity={0.36} />
                      <stop offset="100%" stopColor={chartColors.revenueFillStart} stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.grid} />
                  <XAxis dataKey="hour" tick={{ fill: chartColors.tick, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fill: chartColors.tick, fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => `${Math.round(value / 1000)}k`}
                    width={36}
                  />
                  <Tooltip
                    formatter={(value) => [nairaFormatter.format(value), 'Revenue']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: `1px solid ${chartColors.tooltipBorder}`,
                      background: chartColors.tooltipBg,
                      color: chartColors.tooltipText,
                    }}
                    labelStyle={{ color: chartColors.tooltipText }}
                  />
                  <Area
                    dataKey="revenue"
                    type="monotone"
                    stroke={chartColors.revenueStroke}
                    strokeWidth={3}
                    fill="url(#revenueFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </article>
        </section>

        <section className={styles.tableSection}>
          <div className={styles.tableHead}>
            <h2>Recent Activity</h2>
            <p>Latest payments, support, and settlement actions across the system.</p>
          </div>
          <ActivityTable rows={recentActivityRows} />
        </section>
      </div>

      <Modal open={showBroadcastModal} title="Broadcast Notification" onClose={() => setShowBroadcastModal(false)}>
        <div className={styles.modalContent}>
          <label htmlFor="broadcastMessage">Message</label>
          <textarea
            id="broadcastMessage"
            rows="4"
            placeholder="Service update: Route A buses delayed by 10 minutes due to campus gate checks."
          />
          <div className={styles.modalActions}>
            <PrimaryButton variant="ghost" onClick={() => setShowBroadcastModal(false)}>
              Cancel
            </PrimaryButton>
            <PrimaryButton>
              Send Broadcast
            </PrimaryButton>
          </div>
          <small>
            Backend integration: connect this modal to POST /api/admin/notifications/broadcast with audience filters.
          </small>
        </div>
      </Modal>
    </div>
  );
}
