'use client';

import React from 'react';
import { cn } from '../../utils/cn';
import LoadingSpinner from './LoadingSpinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  rounded = 'md',
  children,
  className,
  disabled,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';

  const variantClasses = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-sm hover:shadow-md',
    accent: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    outline: 'border-2 border-primary-300 text-primary-700 hover:bg-primary-50 focus:ring-primary-500 hover:border-primary-400',
    ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500 hover:text-gray-900',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm hover:shadow-md',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-sm hover:shadow-md',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500 shadow-sm hover:shadow-md',
    gradient: 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:from-primary-700 hover:to-accent-700 focus:ring-primary-500 shadow-lg hover:shadow-xl transform hover:scale-105',
  };

  const sizeClasses = {
    xs: 'px-2 py-1 text-xs',
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base',
    lg: 'px-4 py-2 sm:px-6 sm:py-3 text-base sm:text-lg',
    xl: 'px-6 py-3 sm:px-8 sm:py-4 text-lg sm:text-xl',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    full: 'rounded-full',
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-3 h-3 sm:w-4 sm:h-4',
    md: 'w-4 h-4 sm:w-5 sm:h-5',
    lg: 'w-5 h-5 sm:w-6 sm:h-6',
    xl: 'w-6 h-6 sm:w-7 sm:h-7',
  };

  const renderIcon = () => {
    if (!icon) return null;
    const iconElement = icon as React.ReactElement<{ className?: string }>;
    return React.cloneElement(iconElement, {
      className: cn(iconSizeClasses[size], iconElement.props?.className),
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <LoadingSpinner size={size === 'xs' ? 'xs' : size === 'xl' ? 'lg' : 'sm'} color="white" />
          <span className="ml-2">{loadingText || 'Loading...'}</span>
        </>
      );
    }

    return (
      <>
        {icon && iconPosition === 'left' && (
          <span className={cn('mr-2', children && 'mr-2')}>{renderIcon()}</span>
        )}
        {children}
        {icon && iconPosition === 'right' && (
          <span className={cn('ml-2', children && 'ml-2')}>{renderIcon()}</span>
        )}
      </>
    );
  };

  return (
    <button
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses[rounded],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default Button;