import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import DashboardLayout from '../components/Dashboard/DashboardLayout';
import DashboardHome from './dashboard/DashboardHome';
import WalletPage from './dashboard/WalletPage';
import TapHistoryPage from './dashboard/TapHistoryPage';
import NfcCardPage from './dashboard/NfcCardPage';
import NotificationsPage from './dashboard/NotificationsPage';
import ProfilePage from './dashboard/ProfilePage';
import SettingsPage from './dashboard/SettingsPage';
import axios from 'axios';

export default function DashboardWrapper() {
  const { user, logout } = useContext(AuthContext);
  const [currentPage, setCurrentPage] = useState('home');
  const [userData, setUserData] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [recentTaps, setRecentTaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const User_API_URL = '/api';

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      // Fetch user profile
      const userResponse = await axios.get(`${User_API_URL}/users/myprofile`, { headers });
      setUserData(userResponse.data);
      setWalletBalance(userResponse.data.wallet?.balance || 0);

      // Fetch recent trips/taps
      const tripsResponse = await axios.get(`${User_API_URL}/transfers/history`, { headers });
      setRecentTaps(tripsResponse.data.slice(0, 5) || []);

      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    logout();
    // Navigate to login would be handled by parent router
  };

  const pageProps = {
    userData,
    walletBalance,
    recentTaps,
    onBack: () => handleNavigate('home'),
    onFundWallet: () => handleNavigate('wallet'),
    onTransfer: () => handleNavigate('wallet'),
    onViewAll: () => handleNavigate('history'),
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <DashboardHome {...pageProps} />;
      case 'wallet':
        return <WalletPage {...pageProps} />;
      case 'history':
        return <TapHistoryPage {...pageProps} />;
      case 'card':
        return <NfcCardPage {...pageProps} />;
      case 'notifications':
        return <NotificationsPage {...pageProps} />;
      case 'profile':
        return <ProfilePage {...pageProps} />;
      case 'settings':
        return <SettingsPage {...pageProps} />;
      default:
        return <DashboardHome {...pageProps} />;
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <DashboardLayout
      activeTab={currentPage}
      onNavigate={handleNavigate}
      onLogout={handleLogout}
    >
      {renderPage()}
    </DashboardLayout>
  );
}
