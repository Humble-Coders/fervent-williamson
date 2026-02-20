import React, { forwardRef } from 'react';
import { Eye, EyeOff, Search, X, AlertCircle, CheckCircle } from 'lucide-react';
import { cn } from '../../utils/cn';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  success?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined' | 'underlined';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  clearable?: boolean;
  onClear?: () => void;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  success,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  size = 'md',
  fullWidth = true,
  clearable = false,
  onClear,
  className,
  type = 'text',
  value,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const isPassword = type === 'password';
  const isSearch = type === 'search';
  const hasValue = value !== undefined && value !== '';

  const baseClasses = 'transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    default: 'border-2 border-gray-300 rounded-lg bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
    filled: 'border-0 rounded-lg bg-gray-100 focus:bg-white focus:ring-2 focus:ring-primary-200',
    outlined: 'border-2 border-gray-300 rounded-lg bg-transparent focus:border-primary-500 focus:ring-2 focus:ring-primary-200',
    underlined: 'border-0 border-b-2 border-gray-300 rounded-none bg-transparent focus:border-primary-500',
  };

  const sizeClasses = {
    sm: 'px-2 py-1.5 sm:px-3 sm:py-2 text-sm',
    md: 'px-3 py-2 sm:px-4 sm:py-3 text-sm sm:text-base',
    lg: 'px-4 py-2.5 sm:px-5 sm:py-4 text-base sm:text-lg',
  };

  const getStateClasses = () => {
    if (error) return 'border-red-500 focus:border-red-500 focus:ring-red-200';
    if (success) return 'border-green-500 focus:border-green-500 focus:ring-green-200';
    return '';
  };

  const handleTogglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  const isSearchIcon = (icon: React.ReactNode): boolean => {
    return React.isValidElement(icon) && icon.type === Search;
  };

  const renderLeftIcon = () => {
    if (isSearch && !leftIcon) {
      return <Search className="hidden md:block w-5 h-5 text-gray-400" />;
    }
    // If leftIcon is a Search icon, hide it on mobile
    if (leftIcon && isSearchIcon(leftIcon)) {
      const iconElement = leftIcon as React.ReactElement<{ className?: string }>;
      return React.cloneElement(iconElement, {
        ...iconElement.props,
        className: `hidden md:block ${iconElement.props.className || ''}`
      });
    }
    return leftIcon;
  };

  const getLeftPadding = () => {
    const hasLeftIcon = renderLeftIcon();
    if (!hasLeftIcon) return '';

    // If it's a search icon (hidden on mobile), use responsive padding
    if (isSearch || (leftIcon && isSearchIcon(leftIcon))) {
      return 'pl-3 md:pl-10';
    }

    // For other icons, always use padding
    return 'pl-10';
  };

  const renderRightIcon = () => {
    if (isPassword) {
      return (
        <button
          type="button"
          onClick={handleTogglePassword}
          className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      );
    }

    if (clearable && hasValue) {
      return (
        <button
          type="button"
          onClick={handleClear}
          className="text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      );
    }

    return rightIcon;
  };

  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={cn('relative', fullWidth && 'w-full')}>
      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            'block text-xs sm:text-sm font-medium mb-1 sm:mb-2 transition-colors',
            error ? 'text-red-700' : success ? 'text-green-700' : 'text-gray-700',
            isFocused && !error && !success && 'text-primary-700'
          )}
        >
          {label}
        </label>
      )}

      <div className="relative">
        {renderLeftIcon() && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            {renderLeftIcon()}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          type={inputType}
          value={value}
          className={cn(
            baseClasses,
            variantClasses[variant],
            sizeClasses[size],
            getStateClasses(),
            getLeftPadding(),
            renderRightIcon() && 'pr-10',
            fullWidth && 'w-full',
            className
          )}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {renderRightIcon() && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {renderRightIcon()}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-red-600 flex items-center">
          <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
          {error}
        </p>
      )}

      {success && !error && (
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-green-600 flex items-center">
          <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
          {success}
        </p>
      )}

      {helperText && !error && !success && (
        <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;