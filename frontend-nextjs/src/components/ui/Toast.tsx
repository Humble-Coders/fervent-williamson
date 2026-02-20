import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, AlertCircle, XCircle, Info } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 5000,
  onClose,
}) => {
  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const styles = {
    success: 'bg-success-50 border-success-200 text-success-800',
    error: 'bg-error-50 border-error-200 text-error-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
  };

  const Icon = icons[type];

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id);
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [id, duration, onClose]);

  return createPortal(
    <div className="fixed top-2 right-2 sm:top-4 sm:right-4 z-50 animate-slide-left">
      <div
        className={cn(
          'max-w-xs sm:max-w-sm w-full bg-white border rounded-lg shadow-soft p-3 sm:p-4',
          styles[type]
        )}
      >
        <div className="flex items-start">
          <Icon className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 mt-0.5" />

          <div className="ml-2 sm:ml-3 flex-1">
            {title && (
              <h4 className="font-medium mb-1 text-sm sm:text-base">{title}</h4>
            )}
            <p className={cn('text-xs sm:text-sm', title ? '' : 'font-medium')}>
              {message}
            </p>
          </div>

          <button
            onClick={() => onClose(id)}
            className="ml-2 sm:ml-4 flex-shrink-0 p-1 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors focus-ring"
          >
            <X className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Toast;