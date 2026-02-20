import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  padding?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  shadow?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  border?: boolean | 'subtle' | 'strong';
  hover?: boolean | 'lift' | 'glow' | 'scale';
  variant?: 'default' | 'outlined' | 'filled' | 'gradient';
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  title?: string;
  subtitle?: string;
  image?: string;
  imageAlt?: string;
  imagePosition?: 'top' | 'left' | 'right' | 'background';
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  interactive = false,
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  border = true,
  hover = false,
  variant = 'default',
  onClick,
  header,
  footer,
  title,
  subtitle,
  image,
  imageAlt,
  imagePosition = 'top',
}) => {
  const paddingClasses = {
    none: '',
    xs: 'p-1 sm:p-2',
    sm: 'p-3 sm:p-4',
    md: 'p-4 sm:p-6',
    lg: 'p-6 sm:p-8',
    xl: 'p-8 sm:p-10',
  };

  const shadowClasses = {
    none: '',
    xs: 'shadow-xs',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
  };

  const borderClasses = {
    true: 'border border-gray-200',
    subtle: 'border border-gray-100',
    strong: 'border-2 border-gray-300',
    false: '',
  };

  const hoverClasses = {
    true: 'hover:shadow-lg transition-shadow duration-200',
    lift: 'hover:shadow-xl hover:-translate-y-1 transition-all duration-200',
    glow: 'hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200',
    scale: 'hover:scale-105 transition-transform duration-200',
    false: '',
  };

  const variantClasses = {
    default: 'bg-white',
    outlined: 'bg-white border-2 border-gray-200',
    filled: 'bg-gray-50',
    gradient: 'bg-gradient-to-br from-white to-gray-50',
  };

  const renderImage = () => {
    if (!image) return null;

    const imageElement = (
      <img
        src={image}
        alt={imageAlt || title || 'Card image'}
        className={cn(
          'object-cover',
          imagePosition === 'top' && 'w-full h-48 rounded-t-lg',
          imagePosition === 'left' && 'w-24 h-24 rounded-lg',
          imagePosition === 'right' && 'w-24 h-24 rounded-lg',
          imagePosition === 'background' && 'absolute inset-0 w-full h-full rounded-lg opacity-10'
        )}
      />
    );

    if (imagePosition === 'background') {
      return imageElement;
    }

    return (
      <div className={cn(
        imagePosition === 'top' && 'mb-4',
        imagePosition === 'left' && 'mr-4 flex-shrink-0',
        imagePosition === 'right' && 'ml-4 flex-shrink-0'
      )}>
        {imageElement}
      </div>
    );
  };

  const renderHeader = () => {
    if (!header && !title && !subtitle) return null;

    return (
      <div className="mb-4">
        {header || (
          <div>
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-600">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderFooter = () => {
    if (!footer) return null;

    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        {footer}
      </div>
    );
  };

  const cardContent = (
    <>
      {imagePosition === 'background' && renderImage()}

      <div className={cn(
        'relative',
        imagePosition === 'left' && 'flex items-start',
        imagePosition === 'right' && 'flex items-start flex-row-reverse'
      )}>
        {(imagePosition === 'left' || imagePosition === 'right') && renderImage()}

        <div className="flex-1">
          {imagePosition === 'top' && renderImage()}
          {renderHeader()}

          <div className={cn(
            imagePosition === 'background' && 'relative z-10'
          )}>
            {children}
          </div>

          {renderFooter()}
        </div>
      </div>
    </>
  );

  const Component = interactive || onClick ? 'button' : 'div';

  return (
    <Component
      className={cn(
        'relative overflow-hidden',
        variantClasses[variant],
        paddingClasses[padding],
        shadowClasses[shadow],
        roundedClasses[rounded],
        borderClasses[border as keyof typeof borderClasses],
        hoverClasses[hover as keyof typeof hoverClasses],
        (interactive || onClick) && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
        (interactive || onClick) && 'text-left w-full',
        className
      )}
      onClick={onClick}
      role={interactive || onClick ? 'button' : undefined}
      tabIndex={interactive || onClick ? 0 : undefined}
      type={interactive || onClick ? 'button' : undefined}
    >
      {cardContent}
    </Component>
  );
};

export default Card;