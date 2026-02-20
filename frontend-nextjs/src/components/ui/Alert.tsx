import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface AlertProps {
  type: 'success' | 'warning' | 'error' | 'info';
  title?: string;
  message: string;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({
  type,
  title,
  message,
  dismissible = false,
  onDismiss,
  className,
}) => {
  const icons = {
    success: CheckCircle,
    warning: AlertCircle,
    error: XCircle,
    info: Info,
  };

  const alertClasses = {
    success: 'bg-green-50 border border-green-200 text-green-800 flex items-start p-4 rounded-lg',
    warning: 'bg-yellow-50 border border-yellow-200 text-yellow-800 flex items-start p-4 rounded-lg',
    error: 'bg-red-50 border border-red-200 text-red-800 flex items-start p-4 rounded-lg',
    info: 'bg-blue-50 border border-blue-200 text-blue-800 flex items-start p-4 rounded-lg',
  };

  const Icon = icons[type];

  return (
    <div className={cn(alertClasses[type], className)}>
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      
      <div className="flex-1">
        {title && (
          <h4 className="font-medium mb-1">{title}</h4>
        )}
        <p className={title ? 'text-small' : ''}>{message}</p>
      </div>
      
      {dismissible && onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 ml-4 p-1 hover:bg-black hover:bg-opacity-10 rounded-full transition-colors focus-ring"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default Alert;