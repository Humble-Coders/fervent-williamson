import React from 'react';
import Head from 'next/head';
import { SEOData, generateCanonicalUrl } from '../../utils/seoUtils';

interface SEOHeadProps {
  seoData: SEOData;
  path?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({ seoData, path = '' }) => {
  const canonicalUrl = seoData.canonical || generateCanonicalUrl(path);

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{seoData.title}</title>
      <meta name="description" content={seoData.description} />
      {seoData.keywords && (
        <meta name="keywords" content={seoData.keywords.join(', ')} />
      )}
      {seoData.author && <meta name="author" content={seoData.author} />}
      {seoData.robots && <meta name="robots" content={seoData.robots} />}

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph Meta Tags */}
      <meta property="og:title" content={seoData.ogTitle || seoData.title} />
      <meta property="og:description" content={seoData.ogDescription || seoData.description} />
      <meta property="og:type" content={seoData.ogType || 'website'} />
      <meta property="og:url" content={seoData.ogUrl || canonicalUrl} />
      {seoData.ogImage && <meta property="og:image" content={seoData.ogImage} />}
      {seoData.ogImage && <meta property="og:image:width" content="1200" />}
      {seoData.ogImage && <meta property="og:image:height" content="630" />}
      {seoData.ogImage && <meta property="og:image:type" content="image/jpeg" />}
      <meta property="og:site_name" content="CutQ" />
      <meta property="og:locale" content="en_IN" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={seoData.twitterCard || 'summary_large_image'} />
      <meta name="twitter:title" content={seoData.twitterTitle || seoData.title} />
      <meta name="twitter:description" content={seoData.twitterDescription || seoData.description} />
      {seoData.twitterImage && <meta name="twitter:image" content={seoData.twitterImage} />}
      {seoData.twitterSite && <meta name="twitter:site" content={seoData.twitterSite} />}
      {seoData.twitterCreator && <meta name="twitter:creator" content={seoData.twitterCreator} />}

      {/* Article Meta Tags (for blog posts, etc.) */}
      {seoData.publishedTime && (
        <meta property="article:published_time" content={seoData.publishedTime} />
      )}
      {seoData.modifiedTime && (
        <meta property="article:modified_time" content={seoData.modifiedTime} />
      )}
      {seoData.section && (
        <meta property="article:section" content={seoData.section} />
      )}
      {seoData.tags && seoData.tags.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}

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

      {/* Structured Data */}
      {seoData.structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(seoData.structuredData)}
        </script>
      )}

      {/* Preconnect to External Domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://images.pexels.com" />
      <link rel="preconnect" href="https://api.cutq.store" />

      {/* DNS Prefetch for Performance */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//fonts.gstatic.com" />
      <link rel="dns-prefetch" href="//images.pexels.com" />
      <link rel="dns-prefetch" href="//api.cutq.store" />

      {/* Favicon and App Icons */}
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/manifest.json" />

      {/* Language and Locale */}
      <meta httpEquiv="content-language" content="en-IN" />
      <link rel="alternate" hrefLang="en-IN" href={canonicalUrl} />
      <link rel="alternate" hrefLang="x-default" href={canonicalUrl} />

      {/* Structured Data */}
      {seoData.structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(seoData.structuredData)}
        </script>
      )}
    </Head>
  );
};

export default SEOHead;
