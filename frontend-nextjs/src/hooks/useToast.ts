import { useState, useCallback } from 'react';
import { ToastProps } from '../components/ui/Toast';

interface ToastOptions {
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
}

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substr(2, 9);
    const toast: ToastProps = {
      id,
      ...options,
      onClose: removeToast,
    };

    setToasts((prev) => [...prev, toast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback((message: string, title?: string) => {
    return addToast({ type: 'success', message, title });
  }, [addToast]);

  const error = useCallback((message: string, title?: string) => {
    return addToast({ type: 'error', message, title });
  }, [addToast]);

  const warning = useCallback((message: string, title?: string) => {
    return addToast({ type: 'warning', message, title });
  }, [addToast]);

  const info = useCallback((message: string, title?: string) => {
    return addToast({ type: 'info', message, title });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
};