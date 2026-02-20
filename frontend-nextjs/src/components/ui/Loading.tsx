import React from 'react';
import { cn } from '../../utils/cn';
import LoadingSpinner from './LoadingSpinner';

interface LoadingProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'spinner' | 'dots' | 'pulse' | 'beauty' | 'skeleton';
  text?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  className?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'white';
  rows?: number; // For skeleton variant
}

const Loading: React.FC<LoadingProps> = ({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  overlay = false,
  className,
  color = 'primary',
  rows = 3,
}) => {
  const renderSkeleton = () => (
    <div className={cn('animate-pulse space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  const renderContent = () => {
    if (variant === 'skeleton') {
      return renderSkeleton();
    }

    return (
      <div className="flex flex-col items-center justify-center gap-3">
        <LoadingSpinner size={size} variant={variant} color={color} />
        {text && (
          <p className={cn(
            'text-sm font-medium',
            color === 'white' ? 'text-white' : 'text-gray-600'
          )}>
            {text}
          </p>
        )}
      </div>
    );
  };

  if (fullScreen) {
    return (
      <div className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        overlay ? 'bg-black/50 backdrop-blur-sm' : 'bg-white',
        className
      )}>
        {renderContent()}
      </div>
    );
  }

  return (
    <div className={cn(
      'flex items-center justify-center p-8',
      overlay && 'absolute inset-0 bg-white/80 backdrop-blur-sm z-10',
      className
    )}>
      {renderContent()}
    </div>
  );
};

export default Loading;
