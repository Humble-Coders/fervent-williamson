import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/config/logger';
import { AlertTriangle } from 'lucide-react';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('ErrorBoundary caught an error:', { error, errorInfo });
    
    this.setState({
      errorInfo,
    });

    // Dispatch custom event for global error handling
    window.dispatchEvent(new CustomEvent('react-error', {
      detail: { error, errorInfo }
    }));

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-md w-full text-center" padding="lg">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Oops! Something went wrong
              </h2>
              
              <p className="text-gray-600 mb-6">
                We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
              </p>

              {this.props.showDetails && this.state.error && (
                <details className="text-left mb-6">
                  <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                    Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-700 overflow-auto max-h-32 scrollbar-thin">
                    <div className="mb-2">
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorId && (
                      <div className="mb-2">
                        <strong>Error ID:</strong> {this.state.errorId}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>

            <div className="space-y-3">
              <Button
                onClick={this.handleRetry}
                variant="primary"
                fullWidth
              >
                Try Again
              </Button>
              
              <Button
                onClick={this.handleReload}
                variant="outline"
                fullWidth
              >
                Reload Page
              </Button>
            </div>

            {this.state.errorId && (
              <div className="mt-6 text-xs text-gray-500">
                Error ID: {this.state.errorId}
              </div>
            )}
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
