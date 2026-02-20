import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { SEOData } from '../utils/seoUtils';

/**
 * Custom hook for managing SEO data and page-specific optimizations
 */
export const useSEO = (seoData?: SEOData) => {
  const pathname = usePathname();

  useEffect(() => {
    // Update document title
    if (seoData?.title) {
      document.title = seoData.title;
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && seoData?.description) {
      metaDescription.setAttribute('content', seoData.description);
    }

    // Update canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    const canonicalUrl = seoData?.canonical || `https://cutq.store${pathname}`;
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update Open Graph tags
    updateMetaTag('property', 'og:title', seoData?.ogTitle || seoData?.title);
    updateMetaTag('property', 'og:description', seoData?.ogDescription || seoData?.description);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:image', seoData?.ogImage);
    updateMetaTag('property', 'og:type', seoData?.ogType);

    // Update Twitter Card tags
    updateMetaTag('name', 'twitter:title', seoData?.twitterTitle || seoData?.title);
    updateMetaTag('name', 'twitter:description', seoData?.twitterDescription || seoData?.description);
    updateMetaTag('name', 'twitter:image', seoData?.twitterImage || seoData?.ogImage);
    updateMetaTag('name', 'twitter:card', seoData?.twitterCard);

    // Update robots meta tag
    updateMetaTag('name', 'robots', seoData?.robots);

    // Update keywords meta tag
    if (seoData?.keywords && seoData.keywords.length > 0) {
      updateMetaTag('name', 'keywords', seoData.keywords.join(', '));
    }

    // Add structured data
    if (seoData?.structuredData) {
      addStructuredData(seoData.structuredData);
    }

    // Track page view for analytics (if needed)
    trackPageView(pathname, seoData?.title);

  }, [seoData, pathname]);

  return {
    updateTitle: (title: string) => {
      document.title = title;
    },
    updateDescription: (description: string) => {
      updateMetaTag('name', 'description', description);
    },
    updateCanonical: (url: string) => {
      const canonicalLink = document.querySelector('link[rel="canonical"]');
      if (canonicalLink) {
        canonicalLink.setAttribute('href', url);
      }
    }
  };
};

/**
 * Helper function to update or create meta tags
 */
const updateMetaTag = (attribute: string, value: string, content?: string) => {
  if (!content) return;

  let metaTag = document.querySelector(`meta[${attribute}="${value}"]`);
  if (!metaTag) {
    metaTag = document.createElement('meta');
    metaTag.setAttribute(attribute, value);
    document.head.appendChild(metaTag);
  }
  metaTag.setAttribute('content', content);
};

/**
 * Add structured data to the page
 */
const addStructuredData = (data: Record<string, unknown>) => {
  // Remove existing structured data script
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Add new structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

// import googleAnalyticsService from '../services/googleAnalytics';

/**
 * Track page view for analytics
 */
const trackPageView = (path: string, title?: string) => {
  // Google Analytics 4 tracking (respects analytics config)
  // googleAnalyticsService.trackPageView(path, title);

  // Facebook Pixel tracking
  if (typeof fbq !== 'undefined') {
    fbq('track', 'PageView');
  }

  // Custom analytics tracking
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.page(title, {
      path,
      url: `https://cutq.store${path}`,
      title
    });
  }
};

/**
 * Hook for managing breadcrumb SEO
 */
export const useBreadcrumbSEO = (breadcrumbs: Array<{ name: string; url: string }>) => {
  useEffect(() => {
    const breadcrumbData = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: `https://cutq.store${crumb.url}`
      }))
    };

    addStructuredData(breadcrumbData);
  }, [breadcrumbs]);
};

/**
 * Hook for managing local business SEO
 */
export const useLocalBusinessSEO = (businessData: Record<string, unknown>) => {
  useEffect(() => {
    if (!businessData) return;

    const localBusinessData = {
      '@context': 'https://schema.org',
      '@type': 'BeautySalon',
      name: businessData.name,
      description: businessData.description,
      image: businessData.images || [],
      address: {
        '@type': 'PostalAddress',
        streetAddress: businessData.address,
        addressLocality: businessData.city,
        addressRegion: businessData.state,
        postalCode: businessData.zipCode,
        addressCountry: 'IN'
      },
      geo: businessData.latitude && businessData.longitude ? {
        '@type': 'GeoCoordinates',
        latitude: businessData.latitude,
        longitude: businessData.longitude
      } : undefined,
      telephone: businessData.phone,
      email: businessData.email,
      url: businessData.website,
      aggregateRating: businessData.rating ? {
        '@type': 'AggregateRating',
        ratingValue: businessData.rating,
        reviewCount: businessData.reviewCount || 0,
        bestRating: 5,
        worstRating: 1
      } : undefined,
      openingHours: businessData.workingHours ? Object.entries(businessData.workingHours).map(([day, hours]: [string, Record<string, unknown>]) =>
        hours.isOpen ? `${day.substring(0, 2)} ${hours.open}-${hours.close}` : null
      ).filter(Boolean) : undefined,
      priceRange: businessData.priceRange || '$$',
      paymentAccepted: ['Cash', 'Credit Card', 'UPI', 'Digital Wallet'],
      currenciesAccepted: 'INR'
    };

    addStructuredData(localBusinessData);
  }, [businessData]);
};

// Global declaration for TypeScript
declare global {
  function gtag(...args: unknown[]): void;
  function fbq(...args: unknown[]): void;
}
