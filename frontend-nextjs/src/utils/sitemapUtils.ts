import { logger } from '@/config/logger';

/**
 * Sitemap generation utilities for SEO
 */

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
  images?: Array<{
    loc: string;
    caption?: string;
    title?: string;
  }>;
}

/**
 * Generate sitemap XML from URLs
 */
export const generateSitemapXML = (urls: SitemapUrl[]): string => {
  const urlsXML = urls.map(url => {
    const imagesXML = url.images?.map(image => `
    <image:image>
      <image:loc>${escapeXML(image.loc)}</image:loc>
      ${image.caption ? `<image:caption>${escapeXML(image.caption)}</image:caption>` : ''}
      ${image.title ? `<image:title>${escapeXML(image.title)}</image:title>` : ''}
    </image:image>`).join('') || '';

    return `
  <url>
    <loc>${escapeXML(url.loc)}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
    ${imagesXML}
  </url>`;
  }).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  ${urlsXML}
</urlset>`;
};

/**
 * Escape XML special characters
 */
const escapeXML = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Generate static pages sitemap URLs
 */
export const getStaticPageUrls = (): SitemapUrl[] => {
  const baseUrl = 'https://cutq.store';
  const now = new Date().toISOString();

  return [
    {
      loc: `${baseUrl}/`,
      lastmod: now,
      changefreq: 'daily',
      priority: 1.0
    },
    {
      loc: `${baseUrl}/salons`,
      lastmod: now,
      changefreq: 'daily',
      priority: 0.9
    },
    {
      loc: `${baseUrl}/services/hair`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/services/facial`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/services/nails`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/services/massage`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/services/makeup`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/services/spa`,
      lastmod: now,
      changefreq: 'weekly',
      priority: 0.8
    },
    {
      loc: `${baseUrl}/about`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      loc: `${baseUrl}/help`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.5
    },
    {
      loc: `${baseUrl}/privacy`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.3
    },
    {
      loc: `${baseUrl}/terms`,
      lastmod: now,
      changefreq: 'monthly',
      priority: 0.3
    }
  ];
};

/**
 * Generate salon URLs for sitemap
 */
export const getSalonUrls = (salons: any[]): SitemapUrl[] => {
  const baseUrl = 'https://cutq.store';
  
  return salons.map(salon => {
    const salonSlug = salon.name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
    const images = salon.images?.map((image: string) => ({
      loc: image.startsWith('http') ? image : `${baseUrl}${image}`,
      caption: `${salon.name} - Beauty Salon`,
      title: salon.name
    })) || [];

    return {
      loc: `${baseUrl}/salons/${salonSlug}/${salon.displayId}`,
      lastmod: salon.updatedAt || new Date().toISOString(),
      changefreq: 'weekly' as const,
      priority: salon.featured ? 0.9 : 0.7,
      images
    };
  });
};

/**
 * Generate service URLs for sitemap
 */
export const getServiceUrls = (services: any[]): SitemapUrl[] => {
  const baseUrl = 'https://cutq.store';
  
  return services.map(service => {
    const categorySlug = getCategorySlug(service.category?.name || 'general');
    const images = service.images?.map((image: string) => ({
      loc: image.startsWith('http') ? image : `${baseUrl}${image}`,
      caption: `${service.name} - ${service.category?.name || 'Beauty Service'}`,
      title: service.name
    })) || [];

    return {
      loc: `${baseUrl}/services/${categorySlug}/${service.displayId}`,
      lastmod: service.updatedAt || new Date().toISOString(),
      changefreq: 'weekly' as const,
      priority: service.popular ? 0.8 : 0.6,
      images
    };
  });
};

/**
 * Get category slug from category name
 */
const getCategorySlug = (categoryName: string): string => {
  const categoryMap: { [key: string]: string } = {
    'Hair Care': 'hair',
    'Facial': 'facial',
    'Nail Care': 'nails',
    'Massage': 'massage',
    'Makeup': 'makeup',
    'Skin Care': 'skincare',
    'Waxing': 'waxing',
    'Threading': 'threading',
    'Spa': 'spa',
    'Bridal': 'bridal'
  };
  
  return categoryMap[categoryName] || categoryName.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-');
};

/**
 * Generate robots.txt content
 */
export const generateRobotsTxt = (): string => {
  const baseUrl = 'https://cutq.store';
  
  return `User-agent: *
Allow: /

# Disallow admin and private pages
Disallow: /admin/
Disallow: /salon/
Disallow: /booking/
Disallow: /profile/
Disallow: /api/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl delay (optional)
Crawl-delay: 1`;
};

/**
 * Generate complete sitemap with all URLs
 */
export const generateCompleteSitemap = async (): Promise<string> => {
  try {
    // In a real implementation, you would fetch this data from your API
    // For now, we'll use placeholder data structure
    const staticUrls = getStaticPageUrls();
    
    // Future: fetch salons/services from Firestore for dynamic sitemap URLs
    
    const salonUrls: SitemapUrl[] = []; // getSalonUrls(salons.data || []);
    const serviceUrls: SitemapUrl[] = []; // getServiceUrls(services.data || []);
    
    const allUrls = [...staticUrls, ...salonUrls, ...serviceUrls];
    
    return generateSitemapXML(allUrls);
  } catch (error) {
    logger.error('Error generating sitemap:', error);
    return generateSitemapXML(getStaticPageUrls());
  }
};
