import React from 'react';
import { useToast } from '../../hooks/useToast';
import Toast from '../ui/Toast';

const ToastProvider: React.FC = () => {
  const { toasts } = useToast();

  return (
    <>
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} />
      ))}
    </>
  );
};

export default ToastProvider;