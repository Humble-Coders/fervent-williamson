'use client';

import { useCallback } from 'react';
import { logger } from '@/config/logger';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';
import { User, UserRole, LoginCredentials, RegisterData } from '../types';

export const useAuth = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    setUser,
    setLoading,
    setError,
    logout: logoutStore,
    updateUser,
  } = useAuthStore();


  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.login(credentials);
      const { user, token } = response;
      
      localStorage.setItem('auth_token', token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await authService.register(userData);
      const { user, token } = response;
      
      localStorage.setItem('auth_token', token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear all localStorage data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('booking-draft');
    localStorage.removeItem('refresh_token');

    // Clear any other salon-related cached data
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('salon-') || key.startsWith('booking-') || key.includes('auth'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));

    // Reset all stores
    try {
      // Import and reset salon store
      import('../store/salonStore').then(({ useSalonStore }) => {
        const store = useSalonStore.getState();
        store.setCurrentSalon(null);
        store.setServices([]);
        store.setReviews([]);
        store.setError(null);
        store.setLoading(false);
      });

      // Import and reset booking store
      import('../store/bookingStore').then(({ useBookingStore }) => {
        useBookingStore.getState().reset();
      });
    } catch (error) {
      logger.warn('Error resetting stores during logout:', error);
    }

    // Call auth service logout and reset auth store
    authService.logout();
    logoutStore();
  };

  const updateProfile = async (updates: Partial<User>) => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    setLoading(true);
    setError(null);
    
    try {
      const updatedUser = await authService.updateProfile(updates);
      updateUser(updatedUser);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Update failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const clearError = useCallback(() => {
    if (error) {
      setError(null);
    }
  }, [setError, error]);

  // Role checking helpers
  const hasRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role as UserRole) : false;
  };

  const isAdmin = (): boolean => {
    return hasRole([UserRole.ADMIN]);
  };

  const isSalonOwner = (): boolean => {
    return hasRole([UserRole.SALON_OWNER]);
  };

  const isCustomer = (): boolean => {
    return hasRole([UserRole.CUSTOMER]);
  };

  const canAccessAdminPanel = (): boolean => {
    return hasRole([UserRole.ADMIN]);
  };

  const canAccessSalonPanel = (): boolean => {
    return hasRole([UserRole.ADMIN, UserRole.SALON_OWNER]);
  };

  const canAccessCustomerPanel = (): boolean => {
    return hasRole([UserRole.ADMIN, UserRole.CUSTOMER]);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    clearError,

    // Role helpers
    hasRole,
    isAdmin,
    isSalonOwner,
    isCustomer,
    canAccessAdminPanel,
    canAccessSalonPanel,
    canAccessCustomerPanel,
  };
};