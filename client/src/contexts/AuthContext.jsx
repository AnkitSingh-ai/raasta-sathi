import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import apiService from '../utils/api';
import toast from 'react-hot-toast';

/**
 * @typedef {Object} User
 * @property {string} id
 * @property {string} name
 * @property {string} email
 * @property {'citizen' | 'police' | 'municipal' | 'service_provider'} role
 * @property {number} points
 * @property {string} badge
 * @property {string} [avatar]
 * @property {string} joinDate
 * @property {string} [location]
 * @property {string[]} [preferredLocations]
 * @property {string} [department]
 * @property {string} [badgeNumber]
 * @property {string} [jurisdiction]
 * @property {string} [serviceType]
 * @property {string} [contactNumber]
 * @property {string} [businessName]
 * @property {number} [serviceRadius]
 * @property {boolean} [notificationsEnabled]
 * @property {boolean} [notificationsPaused]
 * @property {boolean} [isAvailable]
 * @property {number} [rating]
 * @property {number} [completedServices]
 */

/**
 * @typedef {Object} AuthContextType
 * @property {User|null} user
 * @property {(email: string, password: string, role?: string, name?: string) => Promise<void>} login
 * @property {() => void} logout
 * @property {boolean} isAuthenticated
 * @property {boolean} loading
 * @property {(location: string) => void} updateUserLocation
 * @property {(updates: Partial<User>) => Promise<void>} updateProfile
 * @property {(userData: any) => Promise<void>} register
 */

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
// Correct for JS
const [user, setUser] = useState(null);
 const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('raasta_sathi_token');
        if (token) {
          apiService.setToken(token);
          const response = await apiService.getCurrentUser();
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('raasta_sathi_token');
        apiService.setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const register = async (userData) => {
    try {
      setLoading(true);
      const response = await apiService.register(userData);
      setUser(response.data.user);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, role, name) => {
    try {
      setLoading(true);
      
      // For demo purposes, if role and name are provided, register first
      if (role && name) {
        await register({
          name,
          email,
          password,
          role,
          contactNumber: '+91-9876543210', // Demo number
          location: 'New Delhi'
        });
        return;
      }

      const response = await apiService.login({ email, password });
      setUser(response.data.user);
      
      const welcomeMessage = response.data.user.role === 'citizen' 
        ? 'Welcome back!' 
        : `Welcome, ${response.data.user.role === 'police' ? 'Officer' : 
            response.data.user.role === 'municipal' ? 'Municipal Authority' : 'Service Provider'}!`;
      
      toast.success(welcomeMessage);
    } catch (error) {
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    apiService.logout();
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUserLocation = (location) => {
    if (user) {
      const updatedUser = { ...user, location };
      setUser(updatedUser);
    }
  };

  const updateProfile = async (updates) => {
    try {
      const response = await apiService.updateProfile(updates);
      setUser(response.data.user);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isAuthenticated: !!user,
      loading,
      updateUserLocation,
      updateProfile,
      register
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}