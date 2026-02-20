import React from 'react';
import { AnalyticsProvider, AnalyticsDebugPanel } from './AnalyticsProvider';

// Wrapper component that provides analytics context
interface AnalyticsWrapperProps {
  children: React.ReactNode;
}

export function AnalyticsWrapper({ children }: AnalyticsWrapperProps) {
  return (
    <AnalyticsProvider
      enabled={true}
      debug={process.env.NODE_ENV === 'development'}>
      {children}
      <AnalyticsDebugPanel />
    </AnalyticsProvider>
  );
}

export default AnalyticsWrapper;
