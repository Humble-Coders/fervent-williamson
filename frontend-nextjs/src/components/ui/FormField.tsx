import React, { forwardRef } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface FormFieldProps {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FormField = forwardRef<HTMLDivElement, FormFieldProps>(({
  label,
  error,
  success,
  helperText,
  required = false,
  children,
  className,
}, ref) => {
  return (
    <div ref={ref} className={cn('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {children}
      </div>

      {error && (
        <div className="flex items-start gap-1 text-red-600">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && !error && (
        <div className="flex items-start gap-1 text-green-600">
          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      {helperText && !error && !success && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

FormField.displayName = 'FormField';

export default FormField;
