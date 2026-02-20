import { Metadata } from 'next';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  structuredData?: any;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  ogUrl?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  twitterSite?: string;
  twitterCreator?: string;
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  canonical?: string;
}

export const DEFAULT_SEO: SEOData = {
  title: 'CutQ - Book Beauty & Salon Appointments Online',
  description: 'Discover and book appointments at the best beauty salons and spas near you. Compare prices, read reviews, and get instant confirmations with CutQ.',
  keywords: [
    'beauty salon',
    'hair salon',
    'spa booking',
    'salon appointment',
    'beauty services',
    'hair cut',
    'hair styling',
    'nail salon',
    'massage',
    'facial',
    'salon near me',
    'beauty parlour',
    'online booking',
    'CutQ'
  ],
  image: '/images/cutq-og-image.png',
  type: 'website',
  twitterCard: 'summary_large_image',
  twitterSite: '@cutqapp',
};

/**
 * Generate Next.js Metadata from SEO data
 */
export const generateMetadata = (seoData: Partial<SEOData> = {}): Metadata => {
  const data = { ...DEFAULT_SEO, ...seoData };
  const fullTitle = data.title.includes('CutQ') ? data.title : `${data.title} | CutQ`;
  const canonicalUrl = data.canonical || data.url;
  const fullImageUrl = data.image?.startsWith('http') ? data.image : `https://cutq.store${data.image}`;

  const metadata: Metadata = {
    title: fullTitle,
    description: data.description,
    keywords: data.keywords?.join(', '),
    authors: data.authors?.map(name => ({ name })),
    robots: data.noIndex ? 'noindex, nofollow' : 'index, follow',
    
    openGraph: {
      title: data.ogTitle || fullTitle,
      description: data.ogDescription || data.description,
      type: (data.ogType as any) || data.type || 'website',
      url: data.ogUrl || canonicalUrl,
      images: data.ogImage || fullImageUrl ? [{
        url: data.ogImage || fullImageUrl!,
        width: 1200,
        height: 630,
        alt: fullTitle,
      }] : undefined,
      siteName: 'CutQ',
      locale: 'en_IN',
    },

    twitter: {
      card: (data.twitterCard as any) || 'summary_large_image',
      title: data.twitterTitle || fullTitle,
      description: data.twitterDescription || data.description,
      images: data.twitterImage || fullImageUrl,
      site: data.twitterSite,
      creator: data.twitterCreator,
    },

    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-IN': canonicalUrl || '/',
        'x-default': canonicalUrl || '/',
      },
    },

    other: {
      'format-detection': 'telephone=yes',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
      'theme-color': '#10B981',
      'geo.region': 'IN',
      'geo.placename': 'India',
      'ICBM': '20.5937, 78.9629',
      'application-name': 'CutQ',
      'msapplication-TileColor': '#10B981',
      'msapplication-config': '/browserconfig.xml',
    },
  };

  // Add structured data if provided
  if (data.structuredData) {
    metadata.other = {
      ...metadata.other,
      'structured-data': JSON.stringify(data.structuredData),
    };
  }

  return metadata;
};

/**
 * Generate canonical URL
 */
export const generateCanonicalUrl = (path: string): string => {
  const baseUrl = 'https://cutq.store';
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

/**
 * Generate SEO data for home page
 */
export const getHomeSEO = (): SEOData => {
  return {
    ...DEFAULT_SEO,
    title: 'CutQ - Book Beauty & Salon Appointments Online',
    description: 'Discover and book appointments at the best beauty salons and spas near you. Compare prices, read reviews, and get instant confirmations with CutQ.',
    url: 'https://cutq.store/',
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'CutQ',
      description: 'Beauty salon booking platform',
      url: 'https://cutq.store',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://cutq.store/salons?search={search_term_string}',
        'query-input': 'required name=search_term_string'
      }
    }
  };
};

/**
 * Generate SEO data for salon listing page
 */
export const getSalonListSEO = (location?: string): SEOData => {
  const title = location 
    ? `Beauty Salons in ${location} - Book Online | CutQ`
    : 'Find Beauty Salons Near You - Book Online | CutQ';
  
  const description = location
    ? `Discover the best beauty salons in ${location}. Compare prices, read reviews, and book appointments instantly with CutQ.`
    : 'Find and book appointments at top-rated beauty salons near you. Compare services, prices, and reviews to choose the perfect salon.';

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
    ogImage: salon.images?.[0] || DEFAULT_SEO.image,
    ogType: 'website',
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
      telephone: salon.phone,
      url: `https://cutq.store/salons/${salon.name}/${salon.displayId}`,
      aggregateRating: salon.rating ? {
        '@type': 'AggregateRating',
        ratingValue: salon.rating,
        reviewCount: salon.reviewCount || 0,
        bestRating: 5,
        worstRating: 1
      } : undefined,
      priceRange: salon.priceRange || '₹₹',
      openingHours: salon.openingHours || [],
      amenityFeature: salon.amenities?.map((amenity: string) => ({
        '@type': 'LocationFeatureSpecification',
        name: amenity
      })) || []
    }
  };
};

/**
 * Generate SEO data for service page
 */
export const getServiceSEO = (service: any, category: string): SEOData => {
  const title = `${service.name} - ${category} Service | CutQ`;
  const description = `Book ${service.name} service at ${service.salon?.name || 'top salons'}. ${service.description || `Professional ${category.toLowerCase()} service`} Starting from ₹${service.price}.`;

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
