import { logger } from '@/config/logger';

/**
 * Simple Google Analytics service - always enabled by default
 */

// Extend Window interface to include gtag
// declare global {
//   interface Window {
//     gtag: (...args: any[]) => void;
//     dataLayer: any[];
//   }
// }

// class GoogleAnalyticsService {
//   private isInitialized = false;
//   private readonly trackingId = 'G-L0GJTG16ZP';

//   /**
//    * Initialize Google Analytics - called automatically
//    */
//   private initializeGA(): void {
//     if (typeof window !== 'undefined' && window.gtag && !this.isInitialized) {
//       try {
//         window.gtag('config', this.trackingId, {
//           send_page_view: false // We'll handle page views manually
//         });
//         this.isInitialized = true;
//         logger.info('📊 Google Analytics initialized with tracking ID:', this.trackingId);
//       } catch (error) {
//         logger.error('📊 Failed to initialize Google Analytics:', error);
//       }
//     } else if (typeof window !== 'undefined' && !window.gtag) {
//       logger.warn('📊 Google Analytics gtag function not available. Make sure the GA script is loaded.');
//     }
//   }

//   /**
//    * Track page view
//    */
//   public trackPageView(path: string, title?: string): void {
//     this.initializeGA();

//     if (typeof window !== 'undefined' && window.gtag) {
//       window.gtag('config', this.trackingId, {
//         page_title: title,
//         page_location: `https://cutq.store${path}`
//       });
//       logger.info('📊 Google Analytics page view tracked:', path);
//     }
//   }

//   /**
//    * Track custom event
//    */
//   public trackEvent(eventName: string, parameters: Record<string, any> = {}): void {
//     this.initializeGA();

//     if (typeof window !== 'undefined' && window.gtag) {
//       window.gtag('event', eventName, parameters);
//       logger.info('📊 Google Analytics event tracked:', { eventName, parameters });
//     }
//   }

//   /**
//    * Track conversion
//    */
//   public trackConversion(conversionType: string, parameters: Record<string, any> = {}): void {
//     this.initializeGA();

//     if (typeof window !== 'undefined' && window.gtag) {
//       window.gtag('event', 'conversion', {
//         ...parameters,
//         conversion_type: conversionType
//       });
//       logger.info('📊 Google Analytics conversion tracked:', { conversionType, parameters });
//     }
//   }

//   /**
//    * Track error
//    */
//   public trackError(error: string, parameters: Record<string, any> = {}): void {
//     this.initializeGA();

//     if (typeof window !== 'undefined' && window.gtag) {
//       window.gtag('event', 'exception', {
//         description: error,
//         fatal: false,
//         ...parameters
//       });
//       logger.info('📊 Google Analytics error tracked:', error);
//     }
//   }

//   /**
//    * Track web vitals
//    */
//   public trackWebVitals(name: string, value: number, category: string = 'Web Vitals'): void {
//     this.initializeGA();

//     if (typeof window !== 'undefined' && window.gtag) {
//       window.gtag('event', 'web_vitals', {
//         name,
//         value: Math.round(value),
//         event_category: category
//       });
//       logger.info('📊 Google Analytics web vitals tracked:', { name, value });
//     }
//   }
// }

// // Create and export singleton instance
// const googleAnalyticsService = new GoogleAnalyticsService();

// export default googleAnalyticsService;