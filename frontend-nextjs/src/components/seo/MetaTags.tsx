import React from 'react';
import Head from 'next/head';

interface MetaTagsProps {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  url?: string;
  type?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
}

/**
 * Comprehensive meta tags component for SEO optimization
 */
const MetaTags: React.FC<MetaTagsProps> = ({
  title,
  description,
  keywords = [],
  image = '/images/cutq-og-image.png',
  url,
  type = 'website',
  noIndex = false,
  structuredData
}) => {
  const fullTitle = title.includes('CutQ') ? title : `${title} | CutQ`;
  const canonicalUrl = url || `https://cutq.store${typeof window !== 'undefined' ? window.location.pathname : '/'}`;
  const fullImageUrl = image.startsWith('http') ? image : `https://cutq.store${image}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords.length > 0 && <meta name="keywords" content={keywords.join(', ')} />}
      <meta name="author" content="CutQ Team" />
      <meta name="robots" content={noIndex ? 'noindex, nofollow' : 'index, follow'} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:type" content="image/png" />
      <meta property="og:site_name" content="CutQ" />
      <meta property="og:locale" content="en_IN" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      <meta name="twitter:site" content="@cutqapp" />
      
      {/* Additional SEO Meta Tags */}
      <meta name="format-detection" content="telephone=yes" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="theme-color" content="#10B981" />
      
      {/* Geo Meta Tags for Local SEO */}
      <meta name="geo.region" content="IN" />
      <meta name="geo.placename" content="India" />
      <meta name="ICBM" content="20.5937, 78.9629" />
      
      {/* Business/App Specific Meta Tags */}
      <meta name="application-name" content="CutQ" />
      <meta name="msapplication-TileColor" content="#10B981" />
      <meta name="msapplication-config" content="/browserconfig.xml" />
      
      {/* Language and Locale */}
      <meta httpEquiv="content-language" content="en-IN" />
      <link rel="alternate" hrefLang="en-IN" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />
      
      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Head>
  );
};

export default MetaTags;
