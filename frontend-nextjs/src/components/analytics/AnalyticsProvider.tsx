import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { logger } from '@/config/logger';
import { useAnalytics } from '../../hooks/useAnalytics';
import { usePerformanceAnalytics } from '../../hooks/usePerformanceAnalytics';
import { ErrorBoundary } from './ErrorBoundary';

// Analytics context
interface AnalyticsContextType {
  isEnabled: boolean;
  sessionId: string;
  enableAnalytics: () => void;
  disableAnalytics: () => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

// Analytics provider props
interface AnalyticsProviderProps {
  children: ReactNode;
  enabled?: boolean;
  debug?: boolean;
}

// Analytics provider component
export function AnalyticsProvider({
  children,
  enabled = true,
  debug = false
}: AnalyticsProviderProps) {
  const [isEnabled, setIsEnabled] = React.useState(enabled);
  const { sessionId, trackAction } = useAnalytics();
  const { trackBundlePerformance, trackMemoryUsage } = usePerformanceAnalytics();

  // Initialize analytics
  useEffect(() => {
    if (isEnabled) {
      // Note: trackAction will internally check if analytics is enabled via config
      // before making any API calls, so we don't need to duplicate that check here

      // Track app initialization
      trackAction('app_initialized', {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        platform: navigator.platform,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine,
        screenResolution: `${screen.width}x${screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        debug
      });

      // Track bundle performance after initialization
      setTimeout(() => {
        trackBundlePerformance();
      }, 1000);

      // Track memory usage periodically
      const memoryInterval = setInterval(() => {
        trackMemoryUsage();
      }, 30000); // Every 30 seconds

      // Track online/offline status changes
      const handleOnline = () => trackAction('connection_online');
      const handleOffline = () => trackAction('connection_offline');
      
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Track visibility changes
      const handleVisibilityChange = () => {
        trackAction('page_visibility_changed', {
          visibilityState: document.visibilityState,
          timestamp: new Date().toISOString()
        });
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Track page unload
      const handleBeforeUnload = () => {
        trackAction('page_unload', {
          timestamp: new Date().toISOString()
        });
      };
      
      window.addEventListener('beforeunload', handleBeforeUnload);

      // Cleanup
      return () => {
        clearInterval(memoryInterval);
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      };
    }
    // Return undefined when analytics is disabled
    return undefined;
  }, [isEnabled, trackAction, trackBundlePerformance, trackMemoryUsage, debug]);

  // Global error handling
  useEffect(() => {
    if (isEnabled) {
      const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
        logger.error('Unhandled promise rejection:', event.reason);
        
        trackAction('unhandled_promise_rejection', {
          error: event.reason?.toString() || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      };

      const handleError = (event: ErrorEvent) => {
        logger.error('Global error:', event.error);
        
        trackAction('global_error', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          error: event.error?.toString() || 'Unknown error',
          timestamp: new Date().toISOString()
        });
      };

      window.addEventListener('unhandledrejection', handleUnhandledRejection);
      window.addEventListener('error', handleError);

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection);
        window.removeEventListener('error', handleError);
      };
    }
    // Return undefined when analytics is disabled
    return undefined;
  }, [isEnabled, trackAction]);

  // Debug logging
  useEffect(() => {
    if (debug && isEnabled) {
      logger.info('🔍 Analytics Debug Mode Enabled');
      logger.info('📊 Session ID:', sessionId);
      logger.info('🌐 User Agent:', navigator.userAgent);
      logger.info('📱 Device Info:', {
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine
      });
    }
  }, [debug, isEnabled, sessionId]);

  const enableAnalytics = React.useCallback(() => {
    setIsEnabled(true);
    if (debug) logger.info('✅ Analytics enabled');
  }, [debug]);

  const disableAnalytics = React.useCallback(() => {
    setIsEnabled(false);
    if (debug) logger.info('❌ Analytics disabled');
  }, [debug]);

  const contextValue: AnalyticsContextType = {
    isEnabled,
    sessionId,
    enableAnalytics,
    disableAnalytics
  };

  return (
    <AnalyticsContext.Provider value={contextValue}>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AnalyticsContext.Provider>
  );
}

// Hook to use analytics context
export function useAnalyticsContext(): AnalyticsContextType {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}

// Analytics debug panel component (for development)
export function AnalyticsDebugPanel() {
  const { isEnabled, sessionId, enableAnalytics, disableAnalytics } = useAnalyticsContext();
  const [isVisible, setIsVisible] = React.useState(false);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <></>

  return (
    <>
      {/* Debug toggle button */}
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-2 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Analytics Debug Panel"
      >
        📊
      </button>

      {/* Debug panel */}
      {isVisible && (
        <div className="fixed bottom-16 right-4 z-50 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80 max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold text-gray-900">Analytics Debug</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Status:</span>{' '}
              <span className={isEnabled ? 'text-green-600' : 'text-red-600'}>
                {isEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            
            <div>
              <span className="font-medium">Session ID:</span>{' '}
              <span className="font-mono text-xs">{sessionId}</span>
            </div>
            
            <div>
              <span className="font-medium">Page:</span>{' '}
              <span className="text-gray-600">{window.location.pathname}</span>
            </div>
            
            <div>
              <span className="font-medium">Device:</span>{' '}
              <span className="text-gray-600">
                {navigator.userAgent.includes('Mobile') ? 'Mobile' : 
                 navigator.userAgent.includes('Tablet') ? 'Tablet' : 'Desktop'}
              </span>
            </div>
            
            <div className="pt-2 border-t">
              <button
                onClick={isEnabled ? disableAnalytics : enableAnalytics}
                className={`w-full px-3 py-1 rounded text-sm font-medium ${
                  isEnabled 
                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {isEnabled ? 'Disable Analytics' : 'Enable Analytics'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default AnalyticsProvider;
