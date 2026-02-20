/**
 * Utility functions for handling image URLs
 */
import { env } from '../config/env';
import { logger } from '@/config/logger';

/**
 * Get the backend base URL for image serving
 */
export const getBackendBaseUrl = (): string => {
  logger.info('🔧 Backend base URL:', env.BACKEND_BASE_URL);
  return env.BACKEND_BASE_URL;
};

/**
 * Convert a relative image URL to an absolute URL with proper encoding
 * @param url - The image URL (can be relative or absolute)
 * @returns Absolute image URL with proper encoding
 */
export const getAbsoluteImageUrl = (url: string | undefined | null): string => {
  logger.info('getAbsoluteImageUrl :: url ::', url);
  if (!url) {
    // Return a default placeholder image
    return 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800';
  }

  // Handle comma-separated URLs (bulk import issue) - take the first valid URL
  if (url.includes(',')) {
    const urls = url.split(',').map(u => u.trim());
    // Find the first URL that starts with http and contains localhost:5001
    const validUrl = urls.find(u => u.startsWith('http') && u.includes('localhost:5001') && u.includes('/uploads/'));
    if (validUrl) {
      logger.info('Found valid URL from comma-separated list:', validUrl);
      return validUrl;
    }
    // Convert localhost:5000 URLs to localhost:5001 (our current backend port)
    const port5000Url = urls.find(u => u.startsWith('http') && u.includes('localhost:5000') && u.includes('/uploads/'));
    if (port5000Url) {
      const correctedUrl = port5000Url.replace('localhost:5000', 'localhost:5001');
      logger.info('Converted port 5000 to 5001:', correctedUrl);
      return correctedUrl;
    }
    // Fallback to first URL if no localhost URLs found
    const firstUrl = urls.find(u => u.startsWith('http') && u.includes('/uploads/'));
    if (firstUrl) {
      logger.info('Using first HTTP URL from comma-separated list:', firstUrl);
      return firstUrl;
    }
    // If no complete URL found, construct one from the path
    const pathUrl = urls.find(u => u.includes('/uploads/'));
    if (pathUrl) {
      const backendBaseUrl = getBackendBaseUrl();
      const cleanPath = pathUrl.startsWith('/') ? pathUrl : `/${pathUrl}`;
      const constructedUrl = `${backendBaseUrl}${cleanPath}`;
      logger.info('Constructed URL from path:', constructedUrl);
      return constructedUrl;
    }
  }

  // If already absolute URL, return as is (backend already handles encoding)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If relative URL, convert to absolute (backend already handles encoding)
  if (url.startsWith('/uploads/') || url.startsWith('uploads/')) {
    const backendBaseUrl = getBackendBaseUrl();
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    const absoluteUrl = `${backendBaseUrl}${cleanUrl}`;
    logger.info('Converted relative URL to absolute 1 ::', absoluteUrl);
    return absoluteUrl;
  }

  // If it's some other relative URL, assume it's from uploads
  if (!url.startsWith('/')) {
    const backendBaseUrl = getBackendBaseUrl();
    const absoluteUrl = `${backendBaseUrl}/uploads/${url}`;
    return absoluteUrl;
  }

  // Default case - prepend backend base URL
  const backendBaseUrl = getBackendBaseUrl();
  const absoluteUrl = `${backendBaseUrl}${url}`;
  logger.info('Converted relative URL to absolute 2 ::', absoluteUrl);
  return absoluteUrl;
};

/**
 * Get the first image from a salon's images array, converted to absolute URL
 * @param images - Array of image URLs
 * @returns Absolute URL of the first image or default placeholder
 */
export const getSalonMainImage = (images: string[] | undefined | null): string => {
  const firstImage = images?.[0];
  return getAbsoluteImageUrl(firstImage);
};

/**
 * Convert an array of image URLs to absolute URLs
 * @param images - Array of image URLs (can be relative or absolute)
 * @returns Array of absolute image URLs
 */
export const getAbsoluteImageUrls = (images: string[] | undefined | null): string[] => {
  if (!images || images.length === 0) {
    return [];
  }

  return images.map(url => getAbsoluteImageUrl(url));
};
