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
      const loggedInUser = await authService.login(credentials);
      setUser(loggedInUser);
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
      const newUser = await authService.register(userData);
      setUser(newUser);
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      logger.warn('Logout error:', error);
    }

    // Clear localStorage booking drafts etc.
    if (typeof window !== 'undefined') {
      localStorage.removeItem('booking-draft');
    }

    // Reset other stores
    try {
      import('../store/salonStore').then(({ useSalonStore }) => {
        const store = useSalonStore.getState();
        store.setCurrentSalon(null);
        store.setServices([]);
        store.setReviews([]);
        store.setError(null);
        store.setLoading(false);
      });

      import('../store/bookingStore').then(({ useBookingStore }) => {
        useBookingStore.getState().reset();
      });
    } catch (error) {
      logger.warn('Error resetting stores during logout:', error);
    }

    logoutStore();
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('No authenticated user');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedUser = await authService.updateProfile(user.id, updates);
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

  const isAdmin = (): boolean => hasRole([UserRole.ADMIN]);
  const isSalonOwner = (): boolean => hasRole([UserRole.SALON_OWNER]);
  const isCustomer = (): boolean => hasRole([UserRole.CUSTOMER]);
  const canAccessAdminPanel = (): boolean => hasRole([UserRole.ADMIN]);
  const canAccessSalonPanel = (): boolean => hasRole([UserRole.ADMIN, UserRole.SALON_OWNER]);
  const canAccessCustomerPanel = (): boolean => hasRole([UserRole.ADMIN, UserRole.CUSTOMER]);

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
    hasRole,
    isAdmin,
    isSalonOwner,
    isCustomer,
    canAccessAdminPanel,
    canAccessSalonPanel,
    canAccessCustomerPanel,
  };
};
