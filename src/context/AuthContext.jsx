import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import axios from 'axios';
import { AUTH_API_URL, USER_API_URL } from '../config/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');

        if (storedToken && storedUser) {
          try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            const isExpired = payload.exp * 1000 < Date.now();
            if (isExpired) {
              localStorage.removeItem('authToken');
              localStorage.removeItem('authUser');
              return;
            }
            const userData = JSON.parse(storedUser);
            setUser(userData);
            setIsAuthenticated(true);
            axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          } catch {
            localStorage.removeItem('authToken');
            localStorage.removeItem('authUser');
          }
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (emailOrPhone, password) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${AUTH_API_URL}/login`, {
        email: emailOrPhone.includes('@') ? emailOrPhone : undefined,
        phone: !emailOrPhone.includes('@') ? emailOrPhone : undefined,
        password,
      });

      const { token, user: userData } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Login failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ UPDATED — with debug logs to find field name mismatch
  const register = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
  firstname: data.firstName,
  lastname: data.lastName,
  email: data.email,
  matricNumber: data.matricNumber,
  password: data.password,
      };

      // DEBUG — check what we're sending and what comes back
      console.log('📤 Sending to backend:', payload);

      const response = await axios.post(`${AUTH_API_URL}/register`, payload);

      console.log('✅ Register success:', response.data);

      return { success: true, data: response.data };
    } catch (err) {
      // DEBUG — this tells us exactly what the server rejected
      console.log('❌ Server rejected with:', err.response?.data);
      console.log('❌ Status code:', err.response?.status);
      console.log('❌ Full error:', err.response);

      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error
        || err.response?.data?.msg
        || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyOTP = useCallback(async (phone, otp) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${AUTH_API_URL}/verify-otp`, {
        phone,
        otp,
      });

      const { token, user: userData } = response.data;

      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      setUser(userData);
      setIsAuthenticated(true);

      return { success: true, user: userData };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'OTP verification failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resendOTP = useCallback(async (phone) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${AUTH_API_URL}/resend-otp`, { phone });
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const forgotPassword = useCallback(async (emailOrPhone) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = emailOrPhone.includes('@')
        ? { email: emailOrPhone }
        : { phone: emailOrPhone };

      const response = await axios.post(`${USER_API_URL}/users/forgot-password`, payload);
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to process request. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (emailOrPhone, otp, newPassword) => {
    setIsLoading(true);
    setError(null);

    try {
      const payload = emailOrPhone.includes('@')
        ? { email: emailOrPhone }
        : { phone: emailOrPhone };

      const response = await axios.put(`${AUTH_API_URL}/reset-password`, {
        ...payload,
        otp,
        newPassword,
      });

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Password reset failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    logout,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}