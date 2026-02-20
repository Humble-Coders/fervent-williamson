'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/authStore';

interface AuthPromptOptions {
  title?: string;
  message?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const useAuthPrompt = () => {
  const { isAuthenticated } = useAuthStore();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [promptOptions, setPromptOptions] = useState<AuthPromptOptions>({});
  const callbacksRef = useRef<AuthPromptOptions>({});

  const promptLogin = useCallback((options: AuthPromptOptions = {}) => {
    if (isAuthenticated) {
      // User is already authenticated, call success immediately
      options.onSuccess?.();
      return;
    }

    // Store callbacks in ref to avoid stale closure issues
    callbacksRef.current = options;
    // Show login modal
    setPromptOptions(options);
    setIsLoginModalOpen(true);
  }, [isAuthenticated]);

  const handleLoginSuccess = useCallback(() => {
    setIsLoginModalOpen(false);
    setPromptOptions({});
    // Use the ref to get the latest callbacks
    callbacksRef.current.onSuccess?.();
    callbacksRef.current = {};
  }, []);

  const handleLoginCancel = useCallback(() => {
    setIsLoginModalOpen(false);
    setPromptOptions({});
    // Use the ref to get the latest callbacks
    callbacksRef.current.onCancel?.();
    callbacksRef.current = {};
  }, []);

  return {
    isLoginModalOpen,
    promptOptions,
    promptLogin,
    handleLoginSuccess,
    handleLoginCancel,
  };
};

export default useAuthPrompt;
