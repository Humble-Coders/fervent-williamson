/**
 * Comprehensive SEO utilities for CutQ application
 */

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image' | 'app' | 'player';
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  structuredData?: any;
  robots?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
}

/**
 * Default SEO configuration for CutQ
 */
export const DEFAULT_SEO: SEOData = {
  title: 'CutQ - Premium Beauty & Salon Services | Book Online',
  description: 'Discover and book premium beauty services at top-rated salons. Hair care, facials, nail services, massage therapy, and more. Book your appointment online today.',
  keywords: [
    'beauty salon',
    'hair salon',
    'nail salon',
    'spa services',
    'beauty appointments',
    'salon booking',
    'hair care',
    'facial treatments',
    'massage therapy',
    'beauty services',
    'salon near me',
    'book salon appointment',
    'beauty parlour',
    'salon services',
    'professional beauty',
    'grooming services',
    'wellness center',
    'beauty treatments',
    'cosmetic services',
    'personal care'
  ],
  ogType: 'website',
  ogImage: '/images/cutq-og-image.png',
  twitterCard: 'summary_large_image',
  twitterSite: '@cutqapp',
  robots: 'index, follow',
  author: 'CutQ Team'
};

/**
 * Generate SEO data for homepage
 */
export const getHomeSEO = (): SEOData => ({
  ...DEFAULT_SEO,
  title: 'CutQ - Book Premium Beauty & Salon Services Online',
  description: 'Discover top-rated beauty salons and book appointments online. Hair styling, facials, nail care, spa treatments, and more. Find your perfect salon experience with CutQ.',
  keywords: [
    ...DEFAULT_SEO.keywords!,
    'beauty booking platform',
    'salon discovery',
    'beauty marketplace',
    'premium salon services'
  ],
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'CutQ',
    alternateName: 'CutQ Store',
    description: 'Premium beauty and salon services booking platform',
    url: 'https://cutq.store',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://cutq.store/salons?search={search_term_string}',
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'CutQ',
      logo: {
        '@type': 'ImageObject',
        url: 'https://cutq.store/logo.png',
        width: 512,
        height: 512
      }
    },
    sameAs: [
      'https://facebook.com/cutqapp',
      'https://instagram.com/cutqapp',
      'https://twitter.com/cutqapp'
    ]
  }
});

/**
 * Generate SEO data for salon listing page
 */
export const getSalonListSEO = (location?: string, filters?: any): SEOData => {
  const locationText = location ? ` in ${location}` : '';
  const title = `Best Beauty Salons${locationText} | CutQ`;
  const description = `Find and book appointments at top-rated beauty salons${locationText}. Compare prices, read reviews, and discover the perfect salon for your beauty needs.`;

  return {
    ...DEFAULT_SEO,
    title,
    description,
    keywords: [
      ...DEFAULT_SEO.keywords!,
      'salon directory',
      'salon reviews',
      'salon comparison',
      location ? `salons in ${location}` : 'local salons'
    ].filter(Boolean),
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: 'https://cutq.store/salons'
    }
  };
};

/**
 * Generate SEO data for individual salon page
 */
export const getSalonSEO = (salon: any): SEOData => {
  const title = `${salon.name} - Book Online | CutQ`;
  const description = `Book appointments at ${salon.name}. ${salon.description || 'Professional beauty services'} Located at ${salon.address}. Rating: ${salon.rating}/5 stars.`;

  return {
    ...DEFAULT_SEO,
    title,
    description,
    keywords: [
      salon.name,
      ...DEFAULT_SEO.keywords!,
      ...(salon.specialties || []),
      ...(salon.amenities || [])
    ],
    ogTitle: title,
    ogDescription: description,
    ogImage: salon.images?.[0] || DEFAULT_SEO.ogImage,
    ogType: 'business.business',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'BeautySalon',
      name: salon.name,
      description: salon.description,
      image: salon.images || [],
      address: {
        '@type': 'PostalAddress',
        streetAddress: salon.address,
        addressLocality: salon.city,
        addressRegion: salon.state,
        postalCode: salon.zipCode,
        addressCountry: 'IN'
      },
      geo: salon.latitude && salon.longitude ? {
        '@type': 'GeoCoordinates',
        latitude: salon.latitude,
        longitude: salon.longitude
      } : undefined,
      telephone: salon.phone,
      email: salon.email,
      url: `https://cutq.store/salons/${salon.name.toLowerCase().replace(/\s+/g, '-')}/${salon.displayId}`,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: salon.rating,
        reviewCount: salon.reviewCount || 0,
        bestRating: 5,
        worstRating: 1
      },
      openingHours: salon.workingHours ? Object.entries(salon.workingHours).map(([day, hours]: [string, any]) => 
        hours.isOpen ? `${day.substring(0, 2)} ${hours.open}-${hours.close}` : null
      ).filter(Boolean) : undefined,
      priceRange: salon.priceRange || '$$',
      paymentAccepted: ['Cash', 'Credit Card', 'UPI', 'Digital Wallet'],
      currenciesAccepted: 'INR'
    }
  };
};

/**
 * Generate SEO data for service category pages
 */
export const getServiceCategorySEO = (category: string, services?: any[]): SEOData => {
  const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
  const title = `${categoryName} Services - Book Online | CutQ`;
  const description = `Book professional ${category} services at top-rated salons. Compare prices, read reviews, and find the perfect ${category} service for you.`;

  return {
    ...DEFAULT_SEO,
    title,
    description,
    keywords: [
      `${category} services`,
      `${category} salon`,
      `book ${category} appointment`,
      ...DEFAULT_SEO.keywords!
    ],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: title,
      description,
      url: `https://cutq.store/services/${category}`,
      mainEntity: services?.map(service => ({
        '@type': 'Service',
        name: service.name,
        description: service.description,
        provider: {
          '@type': 'BeautySalon',
          name: service.salon?.name
        },
        offers: {
          '@type': 'Offer',
          price: service.price,
          priceCurrency: 'INR'
        }
      }))
    }
  };
};

/**
 * Generate SEO data for individual service pages
 */
export const getServiceSEO = (service: any, category: string): SEOData => {
  const title = `${service.name} at ${service.salon?.name} - Book Online | CutQ`;
  const description = `Book ${service.name} at ${service.salon?.name}. ${service.description} Duration: ${service.duration} minutes. Price: ₹${service.price}.`;

  return {
    ...DEFAULT_SEO,
    title,
    description,
    keywords: [
      service.name,
      `${category} service`,
      service.salon?.name,
      ...DEFAULT_SEO.keywords!
    ],
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: service.name,
      description: service.description,
      provider: {
        '@type': 'BeautySalon',
        name: service.salon?.name,
        address: service.salon?.address,
        telephone: service.salon?.phone
      },
      offers: {
        '@type': 'Offer',
        price: service.price,
        priceCurrency: 'INR',
        availability: 'https://schema.org/InStock'
      },
      category: category,
      duration: `PT${service.duration}M`
    }
  };
};

/**
 * Generate SEO data for booking pages
 */
export const getBookingSEO = (salon?: any, service?: any): SEOData => {
  const salonName = salon?.name || 'Selected Salon';
  const serviceName = service?.name || 'Service';
  const title = `Book ${serviceName} at ${salonName} | CutQ`;
  const description = `Complete your booking for ${serviceName} at ${salonName}. Secure online booking with instant confirmation.`;

  return {
    ...DEFAULT_SEO,
    title,
    description,
    robots: 'noindex, nofollow', // Booking pages shouldn't be indexed
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'ReservationAction',
      object: {
        '@type': 'Service',
        name: serviceName,
        provider: {
          '@type': 'BeautySalon',
          name: salonName
        }
      }
    }
  };
};

/**
 * Generate canonical URL
 */
export const generateCanonicalUrl = (path: string): string => {
  const baseUrl = 'https://cutq.store';
  return `${baseUrl}${path}`;
};

/**
 * Generate breadcrumb structured data
 */
export const generateBreadcrumbData = (breadcrumbs: Array<{ name: string; url: string }>) => {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `https://cutq.store${crumb.url}`
    }))
  };
};
