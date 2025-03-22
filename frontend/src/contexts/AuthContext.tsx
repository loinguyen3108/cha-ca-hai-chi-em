import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api';
import { AxiosError } from 'axios';
import { Alert } from '@mui/material';

interface User {
  id: number;
  username: string;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const clearError = () => setError(null);

  const checkAuth = async () => {
    // Don't check auth for public routes
    if (['/signin', '/signup'].includes(location.pathname)) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await authAPI.getCurrentUser();
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
        navigate('/signin');
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setUser(null);
      navigate('/signin');
    } finally {
      setLoading(false);
    }
  };

  // Check auth when the route changes
  useEffect(() => {
    checkAuth();
  }, [location.pathname]);

  const login = async (username: string, password: string) => {
    setError(null);
    try {
      const response = await authAPI.login(username, password);
      if (response.data.success && response.data.user) {
        setUser(response.data.user);
        navigate('/');
      } else {
        setError(response.data.message || 'Invalid username or password');
      }
    } catch (error) {
      console.error('Login failed:', error);
      if (error instanceof AxiosError) {
        setError(error.response?.data?.message || 'Login failed. Please check your credentials.');
      } else {
        setError('Login failed. Please try again.');
      }
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      navigate('/signin');
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {error && (
        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
          {error}
        </Alert>
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 