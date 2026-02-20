import React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info' | 'outline';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  removable?: boolean;
  onRemove?: () => void;
  dot?: boolean;
  pulse?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  rounded = 'full',
  className,
  icon,
  iconPosition = 'left',
  removable = false,
  onRemove,
  dot = false,
  pulse = false,
  onClick,
  disabled = false,
}) => {
  const baseClasses = 'inline-flex items-center font-medium transition-all duration-200';

  const variantClasses = {
    default: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
    primary: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
    accent: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
    success: 'bg-green-100 text-green-800 hover:bg-green-200',
    warning: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    error: 'bg-red-100 text-red-800 hover:bg-red-200',
    info: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50',
  };

  const sizeClasses = {
    xs: 'px-1.5 py-0.5 text-xs',
    sm: 'px-2 py-0.5 sm:px-2.5 sm:py-1 text-xs',
    md: 'px-2 py-1 sm:px-3 sm:py-1.5 text-xs sm:text-sm',
    lg: 'px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base',
  };

  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  const iconSizeClasses = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3 h-3 sm:w-4 sm:h-4',
    lg: 'w-4 h-4 sm:w-5 sm:h-5',
  };

  const dotSizeClasses = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const renderIcon = () => {
    if (!icon) return null;
    const iconElement = icon as React.ReactElement<{ className?: string }>;
    return React.cloneElement(iconElement, {
      className: cn(iconSizeClasses[size], iconElement.props?.className),
    });
  };

  const renderDot = () => {
    if (!dot) return null;
    return (
      <span
        className={cn(
          'rounded-full',
          dotSizeClasses[size],
          variant === 'default' && 'bg-gray-400',
          variant === 'primary' && 'bg-primary-500',
          variant === 'accent' && 'bg-primary-500',
          variant === 'success' && 'bg-green-500',
          variant === 'warning' && 'bg-yellow-500',
          variant === 'error' && 'bg-red-500',
          variant === 'info' && 'bg-blue-500',
          variant === 'outline' && 'bg-gray-400',
          pulse && 'animate-pulse'
        )}
      />
    );
  };

  const renderRemoveButton = () => {
    if (!removable || !onRemove) return null;
    return (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className={cn(
          'ml-1 rounded-full p-0.5 hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-current',
          disabled && 'cursor-not-allowed opacity-50'
        )}
        disabled={disabled}
        aria-label="Remove"
      >
        <X className={cn(iconSizeClasses[size])} />
      </button>
    );
  };

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        roundedClasses[rounded],
        onClick && 'cursor-pointer hover:scale-105 active:scale-95',
        onClick && 'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current',
        disabled && 'opacity-50 cursor-not-allowed',
        pulse && 'animate-pulse',
        className
      )}
      onClick={onClick && !disabled ? onClick : undefined}
      disabled={disabled}
      type={onClick ? 'button' : undefined}
    >
      {dot && iconPosition === 'left' && (
        <span className="mr-1.5">{renderDot()}</span>
      )}

      {icon && iconPosition === 'left' && (
        <span className={cn('mr-1', children && 'mr-1.5')}>{renderIcon()}</span>
      )}

      {children}

      {icon && iconPosition === 'right' && (
        <span className={cn('ml-1', children && 'ml-1.5')}>{renderIcon()}</span>
      )}

      {dot && iconPosition === 'right' && (
        <span className="ml-1.5">{renderDot()}</span>
      )}

      {renderRemoveButton()}
    </Component>
  );
};

export default Badge;