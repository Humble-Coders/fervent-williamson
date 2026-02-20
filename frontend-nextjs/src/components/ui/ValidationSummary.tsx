import React from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ValidationSummaryProps {
  errors: string[];
  title?: string;
  className?: string;
  onDismiss?: () => void;
  showIcon?: boolean;
}

const ValidationSummary: React.FC<ValidationSummaryProps> = ({
  errors,
  title = 'Please fix the following errors:',
  className,
  onDismiss,
  showIcon = true,
}) => {
  if (!errors || errors.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      'bg-red-50 border border-red-200 rounded-lg p-4',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {showIcon && (
            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          )}
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800 mb-2">
              {title}
            </h3>
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index} className="flex items-start gap-1">
                  <span className="text-red-500 mt-1">•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-red-400 hover:text-red-600 transition-colors ml-2"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default ValidationSummary;
