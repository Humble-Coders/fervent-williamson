import React, { useCallback, useEffect, useRef } from 'react';
import { logger } from '@/config/logger';
import { useAnalytics } from './useAnalytics';

// Performance monitoring hook
export function usePerformanceAnalytics() {
  const { trackAction } = useAnalytics();
  const performanceObserverRef = useRef<PerformanceObserver | null>(null);

  // Track page load performance
  useEffect(() => {
    const trackPageLoadPerformance = () => {
      if ('performance' in window && 'getEntriesByType' in performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          const metrics = {
            // Core Web Vitals and performance metrics
            domContentLoaded: Math.round(navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart),
            loadComplete: Math.round(navigation.loadEventEnd - navigation.loadEventStart),
            firstByte: Math.round(navigation.responseStart - navigation.requestStart),
            domInteractive: Math.round(navigation.domInteractive - navigation.startTime),
            
            // Network timing
            dnsLookup: Math.round(navigation.domainLookupEnd - navigation.domainLookupStart),
            tcpConnect: Math.round(navigation.connectEnd - navigation.connectStart),
            serverResponse: Math.round(navigation.responseEnd - navigation.responseStart),
            
            // Page size and resources
            transferSize: navigation.transferSize || 0,
            encodedBodySize: navigation.encodedBodySize || 0,
            decodedBodySize: navigation.decodedBodySize || 0,
            
            // Connection info
            connectionType: (navigator as any).connection?.effectiveType || 'unknown',
            downlink: (navigator as any).connection?.downlink || 0,

            // Device info
            deviceMemory: (navigator as any).deviceMemory || 0,
            hardwareConcurrency: navigator.hardwareConcurrency || 0,
          };

          trackAction('page_load_performance', {
            metrics,
            url: window.location.href,
            timestamp: new Date().toISOString()
          });
        }
      }
    };

    // Track performance after page load
    if (document.readyState === 'complete') {
      setTimeout(trackPageLoadPerformance, 100);
    } else {
      window.addEventListener('load', () => {
        setTimeout(trackPageLoadPerformance, 100);
      });
    }
  }, [trackAction]);

  // Track Core Web Vitals
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      // Track Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        trackAction('core_web_vital_lcp', {
          value: Math.round(lastEntry.startTime),
          metric: 'LCP',
          timestamp: new Date().toISOString()
        });
      });

      // Track First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          trackAction('core_web_vital_fid', {
            value: Math.round((entry as any).processingStart - entry.startTime),
            metric: 'FID',
            timestamp: new Date().toISOString()
          });
        });
      });

      // Track Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        });
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        fidObserver.observe({ entryTypes: ['first-input'] });
        clsObserver.observe({ entryTypes: ['layout-shift'] });

        performanceObserverRef.current = lcpObserver;

        // Report CLS on page unload
        const reportCLS = () => {
          if (clsValue > 0) {
            trackAction('core_web_vital_cls', {
              value: Math.round(clsValue * 1000) / 1000,
              metric: 'CLS',
              timestamp: new Date().toISOString()
            });
          }
        };

        window.addEventListener('beforeunload', reportCLS);
        window.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            reportCLS();
          }
        });

        return () => {
          lcpObserver.disconnect();
          fidObserver.disconnect();
          clsObserver.disconnect();
          window.removeEventListener('beforeunload', reportCLS);
        };
      } catch (error) {
        logger.warn('Performance Observer not supported:', error);
        return undefined;
      }
    }
    return undefined;
  }, [trackAction]);

  // Track resource loading performance
  const trackResourcePerformance = useCallback(() => {
    if ('performance' in window && 'getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      const resourceMetrics = resources.map(resource => ({
        name: resource.name,
        type: resource.initiatorType,
        duration: Math.round(resource.duration),
        size: resource.transferSize || 0,
        cached: resource.transferSize === 0 && resource.decodedBodySize > 0
      }));

      // Group by resource type
      const groupedMetrics = resourceMetrics.reduce((acc, resource) => {
        if (!acc[resource.type]) {
          acc[resource.type] = {
            count: 0,
            totalDuration: 0,
            totalSize: 0,
            cached: 0
          };
        }
        
        acc[resource.type].count++;
        acc[resource.type].totalDuration += resource.duration;
        acc[resource.type].totalSize += resource.size;
        if (resource.cached) acc[resource.type].cached++;
        
        return acc;
      }, {} as Record<string, { count: number; totalDuration: number; totalSize: number; cached: number }>);

      trackAction('resource_performance', {
        groupedMetrics,
        totalResources: resourceMetrics.length,
        timestamp: new Date().toISOString()
      });
    }
  }, [trackAction]);

  // Track API call performance
  const trackApiPerformance = useCallback((
    endpoint: string,
    method: string,
    duration: number,
    status: number,
    size?: number
  ) => {
    trackAction('api_performance', {
      endpoint,
      method,
      duration: Math.round(duration),
      status,
      size: size || 0,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track component render performance
  const trackComponentPerformance = useCallback((
    componentName: string,
    renderTime: number,
    props?: Record<string, unknown>
  ) => {
    trackAction('component_performance', {
      componentName,
      renderTime: Math.round(renderTime),
      propsCount: props ? Object.keys(props).length : 0,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track memory usage
  const trackMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory;

      trackAction('memory_usage', {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        memoryPressure: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
        timestamp: new Date().toISOString()
      });
    }
  }, [trackAction]);

  // Track user interaction performance
  const trackInteractionPerformance = useCallback((
    interactionType: 'click' | 'scroll' | 'input' | 'navigation',
    duration: number,
    target?: string
  ) => {
    trackAction('interaction_performance', {
      interactionType,
      duration: Math.round(duration),
      target,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track bundle size and loading
  const trackBundlePerformance = useCallback(() => {
    if ('performance' in window) {
      const scripts = performance.getEntriesByType('resource').filter(
        (resource) => (resource as any).initiatorType === 'script'
      ) as PerformanceResourceTiming[];

      const bundleMetrics = {
        totalScripts: scripts.length,
        totalSize: scripts.reduce((sum, script) => sum + (script.transferSize || 0), 0),
        totalDuration: scripts.reduce((sum, script) => sum + script.duration, 0),
        largestScript: scripts.reduce((largest, script) => 
          (script.transferSize || 0) > (largest.transferSize || 0) ? script : largest, scripts[0]
        )
      };

      trackAction('bundle_performance', {
        bundleMetrics,
        timestamp: new Date().toISOString()
      });
    }
  }, [trackAction]);

  return {
    trackResourcePerformance,
    trackApiPerformance,
    trackComponentPerformance,
    trackMemoryUsage,
    trackInteractionPerformance,
    trackBundlePerformance
  };
}

// Higher-order component for tracking component performance
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
) {
  const WrappedComponent: React.FC<P> = (props: P) => {
    const { trackComponentPerformance } = usePerformanceAnalytics();
    const renderStartRef = useRef<number>(0);

    useEffect(() => {
      renderStartRef.current = performance.now();
    });

    useEffect(() => {
      if (renderStartRef.current) {
        const renderTime = performance.now() - renderStartRef.current;
        trackComponentPerformance(
          componentName || Component.displayName || Component.name || 'Unknown',
          renderTime,
          props as Record<string, unknown>
        );
      }
    });

    return React.createElement(Component, props);
  };

  WrappedComponent.displayName = `withPerformanceTracking(${Component.displayName || Component.name})`;

  return WrappedComponent;
}
