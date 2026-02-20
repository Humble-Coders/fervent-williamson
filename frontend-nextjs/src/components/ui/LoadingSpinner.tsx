import React from 'react';
import { Loader2, Sparkles, Palette } from 'lucide-react';
import { cn } from '../../utils/cn';

interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'beauty';
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'white';
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  variant = 'spinner',
  className,
  color = 'primary',
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colorClasses = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    accent: 'text-primary-500',
    white: 'text-white',
  };

  if (variant === 'beauty') {
    return (
      <div className={cn('flex items-center justify-center gap-2', className)}>
        <Sparkles className={cn(sizeClasses[size], colorClasses[color], 'animate-bounce-soft')} />
        <Palette className={cn(sizeClasses[size], colorClasses[color], 'animate-bounce-soft')} style={{ animationDelay: '0.5s' }} />
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex items-center justify-center gap-1', className)}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={cn(
              'rounded-full animate-pulse',
              sizeClasses[size],
              colorClasses[color].replace('text-', 'bg-')
            )}
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div
        className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          colorClasses[color].replace('text-', 'bg-'),
          className
        )}
      />
    );
  }

  // Default spinner variant
  return (
    <Loader2
      className={cn(
        'animate-spin',
        sizeClasses[size],
        colorClasses[color],
        className
      )}
    />
  );
};

export default LoadingSpinner;