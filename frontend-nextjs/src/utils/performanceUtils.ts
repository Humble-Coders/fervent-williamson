import { logger } from '@/config/logger';

/**
 * Performance monitoring and optimization utilities for SEO
 */

// import googleAnalyticsService from '../services/googleAnalytics';

/**
 * Measure and report Core Web Vitals
 */
// export const measureCoreWebVitals = () => {
//   // Largest Contentful Paint (LCP)
//   // const measureLCP = () => {
//   //   new PerformanceObserver((entryList) => {
//   //     const entries = entryList.getEntries();
//   //     const lastEntry = entries[entries.length - 1];
//   //     logger.info('LCP:', lastEntry.startTime);
      
//   //     // Report to analytics
//   //     googleAnalyticsService.trackWebVitals('LCP', lastEntry.startTime, 'Web Vitals');
//   //   }).observe({ entryTypes: ['largest-contentful-paint'] });
//   // };

//   // First Input Delay (FID)
//   // const measureFID = () => {
//   //   new PerformanceObserver((entryList) => {
//   //     const entries = entryList.getEntries();
//   //     entries.forEach((entry) => {
//   //       logger.info('FID:', entry.processingStart - entry.startTime);
        
//   //       googleAnalyticsService.trackWebVitals('FID', entry.processingStart - entry.startTime, 'Web Vitals');
//   //     });
//   //   }).observe({ entryTypes: ['first-input'] });
//   // };

//   // Cumulative Layout Shift (CLS)
//   // const measureCLS = () => {
//   //   let clsValue = 0;
//   //   new PerformanceObserver((entryList) => {
//   //     const entries = entryList.getEntries();
//   //     entries.forEach((entry) => {
//   //       if (!entry.hadRecentInput) {
//   //         clsValue += entry.value;
//   //       }
//   //     });
      
//   //     logger.info('CLS:', clsValue);
      
//   //     googleAnalyticsService.trackWebVitals('CLS', clsValue * 1000, 'Web Vitals');
//   //   }).observe({ entryTypes: ['layout-shift'] });
//   // };

//   // Initialize measurements
//   // if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
//   //   measureLCP();
//   //   measureFID();
//   //   measureCLS();
//   // }
// };

/**
 * Preload critical resources
 */
export const preloadCriticalResources = () => {
  const criticalResources = [
    '/logo.png',
    '/images/cutq-og-image.png',
    '/favicon.svg'
  ];

  criticalResources.forEach(resource => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = resource;
    link.as = 'image';
    document.head.appendChild(link);
  });
};

/**
 * Optimize images with lazy loading
 */
export const optimizeImages = () => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          img.src = img.dataset.src || img.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
      imageObserver.observe(img);
    });
  }
};

/**
 * Monitor page load performance
 */
// export const monitorPageLoad = () => {
//   window.addEventListener('load', () => {
//     setTimeout(() => {
//       const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
//       const metrics = {
//         dns: navigation.domainLookupEnd - navigation.domainLookupStart,
//         tcp: navigation.connectEnd - navigation.connectStart,
//         ttfb: navigation.responseStart - navigation.requestStart,
//         download: navigation.responseEnd - navigation.responseStart,
//         domParse: navigation.domContentLoadedEventStart - navigation.responseEnd,
//         domReady: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
//         onLoad: navigation.loadEventEnd - navigation.loadEventStart,
//         total: navigation.loadEventEnd - navigation.navigationStart
//       };

//       logger.info('Page Load Metrics:', metrics);

//       // Report to analytics
//       Object.entries(metrics).forEach(([key, value]) => {
//         googleAnalyticsService.trackEvent('timing_complete', {
//           name: key,
//           value: Math.round(value),
//           event_category: 'Performance'
//         });
//       });
//     }, 0);
//   });
// };

/**
 * Initialize all performance monitoring
 */
export const initPerformanceMonitoring = () => {
  // measureCoreWebVitals();
  preloadCriticalResources();
  optimizeImages();
  // monitorPageLoad();
};

// Global type declarations
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export default {
  // measureCoreWebVitals,
  preloadCriticalResources,
  optimizeImages,
  // monitorPageLoad,
  initPerformanceMonitoring
};
