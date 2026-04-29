import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import './App.css';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import KYC from './pages/KYC';
import TransferHistory from './pages/TransferHistory';
import ReportDispute from './pages/ReportDispute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import { isAdminAuthenticated } from './config/adminAuth';

const isAuthenticated = () => Boolean(localStorage.getItem('token'));

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function PublicAuthRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
}

function ProtectedAdminRoute({ children }) {
  return isAdminAuthenticated() ? children : <Navigate to="/admin/login" replace />;
}

function PublicAdminRoute({ children }) {
  return isAdminAuthenticated() ? <Navigate to="/admin/dashboard" replace /> : children;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/login"
          element={(
            <PublicAuthRoute>
              <AuthPage />
            </PublicAuthRoute>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicAuthRoute>
              <AuthPage />
            </PublicAuthRoute>
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/kyc"
          element={(
            <ProtectedRoute>
              <KYC />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/card-linking"
          element={<Navigate to="/dashboard" replace />}
        />
        <Route
          path="/history"
          element={(
            <ProtectedRoute>
              <TransferHistory />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/report-dispute"
          element={(
            <ProtectedRoute>
              <ReportDispute />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/profile"
          element={(
            <ProtectedRoute>
              <UserProfile />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/settings"
          element={(
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          )}
        />
        <Route
          path="/admin/login"
          element={(
            <PublicAdminRoute>
              <AdminLogin />
            </PublicAdminRoute>
          )}
        />
        <Route
          path="/admin/dashboard"
          element={(
            <ProtectedAdminRoute>
              <AdminDashboard />
            </ProtectedAdminRoute>
          )}
        />
        <Route
          path="/admin"
          element={<Navigate to={isAdminAuthenticated() ? '/admin/dashboard' : '/admin/login'} replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

