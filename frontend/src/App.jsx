import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import './App.css';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';

const isAuthenticated = () => Boolean(localStorage.getItem('token'));

function ProtectedRoute({ children }) {
  return isAuthenticated() ? children : <Navigate to="/login" replace />;
}

function PublicAuthRoute({ children }) {
  return isAuthenticated() ? <Navigate to="/dashboard" replace /> : children;
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

