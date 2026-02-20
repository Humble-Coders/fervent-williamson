'use client';

import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  variant?: 'default' | 'centered' | 'drawer' | 'fullscreen';
  className?: string;
  overlayClassName?: string;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
  footer?: React.ReactNode;
  preventScroll?: boolean;
  initialFocus?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  variant = 'default',
  className,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  footer,
  preventScroll = true,
  initialFocus = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-full mx-4',
  };

  const variantClasses = {
    default: 'rounded-xl shadow-2xl',
    centered: 'rounded-xl shadow-2xl',
    drawer: 'rounded-t-xl shadow-2xl',
    fullscreen: 'rounded-none shadow-none h-full',
  };

  const overlayVariantClasses = {
    default: 'items-center justify-center p-4',
    centered: 'items-center justify-center p-4',
    drawer: 'items-end justify-center',
    fullscreen: 'items-center justify-center',
  };

  useEffect(() => {
    if (isOpen && preventScroll) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';

      if (initialFocus && modalRef.current) {
        const focusableElement = modalRef.current.querySelector(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        ) as HTMLElement;

        if (focusableElement) {
          setTimeout(() => focusableElement.focus(), 100);
        }
      }
    } else if (preventScroll) {
      document.body.style.overflow = 'unset';

      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }

    return () => {
      if (preventScroll) {
        document.body.style.overflow = 'unset';
      }
    };
  }, [isOpen, preventScroll, initialFocus]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = modalRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('keydown', handleTabKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm transition-all duration-300',
        overlayVariantClasses[variant],
        overlayClassName
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={cn(
          'relative bg-white transition-all duration-300 transform',
          'animate-in fade-in-0 zoom-in-95',
          variant === 'drawer' && 'slide-in-from-bottom-4',
          sizeClasses[size],
          variantClasses[variant],
          variant === 'fullscreen' && 'w-full',
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              {title && (
                <h3 id="modal-title" className="text-lg font-semibold text-gray-900">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className={cn(
          'overflow-y-auto',
          (title || showCloseButton) ? 'p-6' : 'p-6',
          variant === 'fullscreen' && 'flex-1'
        )}>
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

export default Modal;