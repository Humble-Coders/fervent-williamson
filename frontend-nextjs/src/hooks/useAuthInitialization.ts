import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

/**
 * Custom hook to initialize Firebase Auth listener.
 * Sets up onAuthStateChanged and returns cleanup on unmount.
 */
export const useAuthInitialization = () => {
  const { initializeAuth } = useAuthStore();

  useEffect(() => {
    const unsubscribe = initializeAuth();
    return unsubscribe;
  }, [initializeAuth]);
};
