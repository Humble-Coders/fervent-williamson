'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import Button from './Button';

interface EmptyStateProps {
  icon?: LucideIcon | React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'illustration';
  image?: string;
  imageAlt?: string;
  children?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: IconOrNode,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  size = 'md',
  variant = 'default',
  image,
  imageAlt,
  children,
}) => {
  const sizeClasses = {
    sm: {
      container: 'py-8 px-4',
      iconContainer: 'w-12 h-12 mb-3',
      icon: 'w-6 h-6',
      title: 'text-base font-semibold',
      description: 'text-sm',
      maxWidth: 'max-w-sm',
    },
    md: {
      container: 'py-12 px-4',
      iconContainer: 'w-16 h-16 mb-4',
      icon: 'w-8 h-8',
      title: 'text-lg font-semibold',
      description: 'text-base',
      maxWidth: 'max-w-md',
    },
    lg: {
      container: 'py-16 px-6',
      iconContainer: 'w-20 h-20 mb-6',
      icon: 'w-10 h-10',
      title: 'text-xl font-semibold',
      description: 'text-lg',
      maxWidth: 'max-w-lg',
    },
  };

  const variantClasses = {
    default: 'bg-gray-50 rounded-lg',
    minimal: '',
    illustration: 'bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200',
  };

  const renderIcon = () => {
    if (image) {
      return (
        <div className="mb-6">
          <img
            src={image}
            alt={imageAlt || title}
            className="w-32 h-32 mx-auto object-contain opacity-75"
          />
        </div>
      );
    }

    if (!IconOrNode) return null;

    if (React.isValidElement(IconOrNode)) {
      return (
        <div className={cn(
          'mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center',
          sizeClasses[size].iconContainer
        )}>
          {IconOrNode}
        </div>
      );
    }

    const Icon = IconOrNode as LucideIcon;
    return (
      <div className={cn(
        'mx-auto bg-gray-100 rounded-full flex items-center justify-center',
        sizeClasses[size].iconContainer
      )}>
        <Icon className={cn('text-gray-400', sizeClasses[size].icon)} />
      </div>
    );
  };

  const renderActions = () => {
    if (!actionLabel && !onAction && !secondaryActionLabel && !onSecondaryAction) {
      return null;
    }

    return (
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
        {actionLabel && onAction && (
          <Button
            variant="primary"
            onClick={onAction}
            size={size === 'lg' ? 'lg' : 'md'}
          >
            {actionLabel}
          </Button>
        )}
        {secondaryActionLabel && onSecondaryAction && (
          <Button
            variant="outline"
            onClick={onSecondaryAction}
            size={size === 'lg' ? 'lg' : 'md'}
          >
            {secondaryActionLabel}
          </Button>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      'text-center',
      sizeClasses[size].container,
      variantClasses[variant],
      className
    )}>
      <div className={cn('mx-auto', sizeClasses[size].maxWidth)}>
        {renderIcon()}

        <h3 className={cn(
          'text-gray-900 mb-2',
          sizeClasses[size].title
        )}>
          {title}
        </h3>

        {description && (
          <p className={cn(
            'text-gray-600 mb-6',
            sizeClasses[size].description
          )}>
            {description}
          </p>
        )}

        {children && (
          <div className="mb-6">
            {children}
          </div>
        )}

        {renderActions()}
      </div>
    </div>
  );
};

export default EmptyState;
