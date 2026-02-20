import { useEffect } from 'react';
import { logger } from '@/config/logger';
import { useAuthStore } from '../store/authStore';

/**
 * Custom hook to handle authentication initialization
 * This replaces the AuthProvider component functionality
 */
export const useAuthInitialization = () => {
  const { validateToken, setLoading } = useAuthStore();

  useEffect(() => {
    const initializeAuth = async () => {
      logger.info('🔐 Checking for existing authentication...');

      // Only validate if there's a token in localStorage
      const token = localStorage.getItem('auth_token');
      if (token) {
        logger.info('🔑 Found existing token, validating...');
        // Don't set loading here as it should already be set by onRehydrateStorage

        try {
          await validateToken();
          logger.info('✅ Token validation complete');
        } catch (error) {
          logger.error('❌ Token validation failed:', error);
        }
        // validateToken will handle setting loading to false
      } else {
        logger.info('ℹ️ No token found, allowing guest browsing');
        setLoading(false);
      }
    };

    initializeAuth();
  }, [validateToken, setLoading]);
};
