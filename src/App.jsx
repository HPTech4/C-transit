import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import './App.css';
import './styles/designSystem.css';
import ToastProvider from './context/ToastProvider';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import DashboardWrapper from './pages/DashboardWrapper';
import UserProfile from './pages/UserProfile';
import Settings from './pages/Settings';
import KYC from './pages/KYC';
import TransferHistory from './pages/TransferHistory';
import ReportDispute from './pages/ReportDispute';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AgentLogin from './pages/AgentLogin';
import AgentDashboard from './pages/AgentDashboard';

// New Auth Screens
import LoginPage from './pages/Login.page';
import RegisterPage from './pages/Register.page';
import VerifyPhonePage from './pages/VerifyPhone.page';
import ForgotPasswordPage from './pages/ForgotPassword.page';
import ResetPasswordPage from './pages/ResetPassword.page';
import AuthGuard from './components/Auth/AuthGuard';

import { isAdminAuthenticated } from './config/adminAuth';

const isAgentAuthenticated = () => Boolean(localStorage.getItem('agentSession'));

const isAuthenticated = () => Boolean(localStorage.getItem('token'));

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/auth/login" replace />;
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

function ProtectedAgentRoute({ children }) {
  return isAgentAuthenticated() ? children : <Navigate to="/agent/login" replace />;
}

function PublicAgentRoute({ children }) {
  return isAgentAuthenticated() ? <Navigate to="/agent/dashboard" replace /> : children;
}

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Home />} />
            {/* New Auth Routes */}
            <Route
              path="/auth/login"
              element={
                <PublicAuthRoute>
                  <LoginPage />
                </PublicAuthRoute>
              }
            />
            <Route
              path="/auth/register"
              element={
                <PublicAuthRoute>
                  <RegisterPage />
                </PublicAuthRoute>
              }
            />
            <Route
              path="/auth/verify-phone"
              element={
                <PublicAuthRoute>
                  <VerifyPhonePage />
                </PublicAuthRoute>
              }
            />
            <Route
              path="/auth/forgot-password"
              element={
                <PublicAuthRoute>
                  <ForgotPasswordPage />
                </PublicAuthRoute>
              }
            />
            <Route
              path="/auth/reset-password"
              element={
                <PublicAuthRoute>
                  <ResetPasswordPage />
                </PublicAuthRoute>
              }
            />
            
            {/* Legacy routes for backward compatibility (redirect to new auth screens) */}
            <Route path="/login" element={<Navigate to="/auth/login" replace />} />
            <Route path="/register" element={<Navigate to="/auth/register" replace />} />
            <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
            <Route path="/password-reset-otp" element={<Navigate to="/auth/reset-password" replace />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardWrapper />
                </ProtectedRoute>
              }
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
        <Route
          path="/agent/login"
          element={(
            <PublicAgentRoute>
              <AgentLogin />
            </PublicAgentRoute>
          )}
        />
        <Route
          path="/agent/dashboard"
          element={(
            <ProtectedAgentRoute>
              <AgentDashboard />
            </ProtectedAgentRoute>
          )}
        />
        <Route
          path="/agent"
          element={<Navigate to={isAgentAuthenticated() ? '/agent/dashboard' : '/agent/login'} replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
        </Router>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;

