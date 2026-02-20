import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/config/logger';
import { useAnalytics } from '../../hooks/useAnalytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

// Error boundary component with analytics tracking
class ErrorBoundaryClass extends Component<Props & { trackError: (error: Error, errorCode?: string) => void }, State> {
  constructor(props: Props & { trackError: (error: Error, errorCode?: string) => void }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Track the error with analytics
    this.props.trackError(error, 'REACT_ERROR_BOUNDARY');
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      logger.error('Error Boundary caught an error:', { error, errorInfo });
    }

    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Oops! Something went wrong
            </h2>
            <p className="text-gray-600 mb-4">
              We&apos;re sorry for the inconvenience. The error has been reported and we&apos;re working to fix it.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
            >
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Error Details (Development)
                </summary>
                <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to inject analytics hook
export function ErrorBoundary({ children, fallback, onError }: Props) {
  const { trackError } = useAnalytics();
  
  return (
    <ErrorBoundaryClass trackError={trackError} fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  );
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
  onError?: (error: Error, errorInfo: ErrorInfo) => void
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary fallback={fallback} onError={onError}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Hook for manual error reporting
export function useErrorReporting() {
  const { trackError } = useAnalytics();

  const reportError = React.useCallback((
    error: Error | string,
    context?: {
      component?: string;
      action?: string;
      userId?: string;
      additionalData?: Record<string, unknown>;
    }
  ) => {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    // Add context to error if provided
    if (context) {
      (errorObj as Error & { context?: unknown }).context = context;
    }

    trackError(errorObj, 'MANUAL_REPORT');
  }, [trackError]);

  const reportAsyncError = React.useCallback(async (
    asyncOperation: () => Promise<unknown>,
    context?: {
      component?: string;
      action?: string;
      additionalData?: Record<string, unknown>;
    }
  ) => {
    try {
      return await asyncOperation();
    } catch (error) {
      reportError(error as Error, context);
      throw error; // Re-throw to maintain normal error handling
    }
  }, [reportError]);

  return {
    reportError,
    reportAsyncError
  };
}

export default ErrorBoundary;
