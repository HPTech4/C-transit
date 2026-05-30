import React, { createContext, useState, useCallback, useEffect, useContext } from 'react';
import axios from 'axios';
import { AUTH_API_URL, USER_API_URL } from '../config/api';

/**
 * AuthContext - Global authentication state and methods
 * 
 * Usage:
 * const { user, login, register, isLoading } = useContext(AuthContext);
 */
export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken');
        const storedUser = localStorage.getItem('authUser');

        if (storedToken && storedUser) {
          const userData = JSON.parse(storedUser);
          setUser(userData);
          setIsAuthenticated(true);
          // Set default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (err) {
        console.error('Error initializing auth:', err);
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user with email/phone and password
   * @param {string} emailOrPhone - User email or phone number
   * @param {string} password - User password
   * @returns {object} Login result with user data
   */
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

      // Store token and user
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userData));

      // Set axios default header
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

  /**
   * Register new user
   * @param {object} data - Registration data { name, email, phone, password }
   * @returns {object} Registration result
   */
  const register = useCallback(async (data) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${AUTH_API_URL}/register`, {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        password: data.password,
      });

      // Return success - user should verify phone next
      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify OTP after registration or phone change
   * @param {string} phone - User phone number
   * @param {string} otp - 6-digit OTP code
   * @returns {object} Verification result
   */
  const verifyOTP = useCallback(async (phone, otp) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${AUTH_API_URL}/verify-otp`, {
        phone,
        otp,
      });

      const { token, user: userData } = response.data;

      // Store token and user
      localStorage.setItem('authToken', token);
      localStorage.setItem('authUser', JSON.stringify(userData));

      // Set axios default header
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

  /**
   * Resend OTP code
   * @param {string} phone - User phone number
   * @returns {object} Resend result
   */
  const resendOTP = useCallback(async (phone) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${AUTH_API_URL}/resend-otp`, {
        phone,
      });

      return { success: true, data: response.data };
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to resend OTP. Please try again.';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Initiate forgot password flow
   * @param {string} emailOrPhone - User email or phone number
   * @returns {object} Result
   */
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

  /**
   * Reset password with OTP and new password
   * @param {string} emailOrPhone - User email or phone
   * @param {string} otp - 6-digit OTP code
   * @param {string} newPassword - New password
   * @returns {object} Reset result
   */
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

  /**
   * Logout user
   */
  const logout = useCallback(() => {
    setUser(null);
    setIsAuthenticated(false);
    setError(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUser');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,

    // Methods
    login,
    register,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    logout,

    // Helpers
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Custom hook to use AuthContext
 * Usage: const { user, login } = useAuth();
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
