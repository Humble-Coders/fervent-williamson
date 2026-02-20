/**
 * Utility functions for generating SEO-friendly URLs
 */

/**
 * Convert a string to a URL-friendly slug
 * @param text - The text to convert to a slug
 * @returns URL-friendly slug
 */
export const createSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, '-') // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

/**
 * Generate SEO-friendly salon URL
 * @param salonName - The salon name
 * @param displayId - The salon display ID
 * @returns SEO-friendly salon URL path
 */
export const generateSalonUrl = (salonName: string, displayId: number | string): string => {
  const slug = createSlug(salonName);
  return `/salons/${slug}/${displayId}`;
};

/**
 * Generate SEO-friendly service URL
 * @param category - The service category (e.g., 'hair', 'facial')
 * @param serviceId - The service display ID
 * @returns SEO-friendly service URL path
 */
export const generateServiceUrl = (category: string, serviceId: number | string): string => {
  return `/services/${category}/${serviceId}`;
};

/**
 * Parse salon URL parameters to extract salon info
 * @param salonName - The salon name slug from URL
 * @param id - The salon ID from URL
 * @returns Object with parsed salon info
 */
export const parseSalonUrl = (salonName: string | undefined, id: string): { salonName: string; id: string } => {
  return {
    salonName: salonName || '',
    id
  };
};

/**
 * Parse service URL parameters to extract service info
 * @param category - The service category from URL
 * @param serviceId - The service ID from URL
 * @returns Object with parsed service info
 */
export const parseServiceUrl = (category: string, serviceId: string | undefined): { category: string; serviceId?: string } => {
  return {
    category,
    serviceId
  };
};

/**
 * Generate backward-compatible salon URL (for old links)
 * @param id - The salon ID
 * @returns Backward-compatible salon URL path
 */
export const generateLegacySalonUrl = (id: number | string): string => {
  return `/salons/${id}`;
};

/**
 * Check if a salon URL is using the new SEO-friendly format
 * @param pathname - The current pathname
 * @returns True if using new format, false if legacy format
 */
export const isSeoFriendlySalonUrl = (pathname: string): boolean => {
  // New format: /salons/salon-name/123
  // Legacy format: /salons/123
  const parts = pathname.split('/').filter(Boolean);
  return parts.length === 3 && parts[0] === 'salons' && isNaN(Number(parts[1]));
};

/**
 * Check if a service URL is using the new SEO-friendly format
 * @param pathname - The current pathname
 * @returns True if using new format, false if legacy format
 */
export const isSeoFriendlyServiceUrl = (pathname: string): boolean => {
  // New format: /services/hair/123
  // Legacy format: /services/hair
  const parts = pathname.split('/').filter(Boolean);
  return parts.length === 3 && parts[0] === 'services';
};

/**
 * Get category slug from category name
 * @param categoryName - The full category name (e.g., "Hair Care")
 * @returns Category slug (e.g., "hair")
 */
export const getCategorySlug = (categoryName: string): string => {
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
  
  return categoryMap[categoryName] || createSlug(categoryName);
};

/**
 * Get full category name from slug
 * @param slug - The category slug (e.g., "hair")
 * @returns Full category name (e.g., "Hair Care")
 */
export const getCategoryNameFromSlug = (slug: string): string => {
  const slugMap: { [key: string]: string } = {
    'hair': 'Hair Care',
    'facial': 'Facial',
    'nails': 'Nail Care',
    'massage': 'Massage',
    'makeup': 'Makeup',
    'skincare': 'Skin Care',
    'waxing': 'Waxing',
    'threading': 'Threading',
    'spa': 'Spa',
    'bridal': 'Bridal'
  };
  
  return slugMap[slug] || slug;
};
