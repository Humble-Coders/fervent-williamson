/**
 * Utility functions for handling image URLs
 * With Firebase Storage, all URLs are already absolute.
 */

const DEFAULT_PLACEHOLDER = 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800';

/**
 * Ensure an image URL is valid; return placeholder if not.
 * Firebase Storage URLs are already absolute, so this is mostly a null-guard.
 */
export const getAbsoluteImageUrl = (url: string | undefined | null): string => {
  if (!url) return DEFAULT_PLACEHOLDER;

  // Handle comma-separated URLs — take the first valid one
  if (url.includes(',')) {
    const urls = url.split(',').map(u => u.trim());
    const validUrl = urls.find(u => u.startsWith('http'));
    return validUrl || DEFAULT_PLACEHOLDER;
  }

  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // Relative path — shouldn't happen with Firebase Storage, return placeholder
  return DEFAULT_PLACEHOLDER;
};

/**
 * Get the first image from a salon's images array
 */
export const getSalonMainImage = (images: string[] | undefined | null): string => {
  return getAbsoluteImageUrl(images?.[0]);
};

/**
 * Convert an array of image URLs to absolute URLs
 */
export const getAbsoluteImageUrls = (images: string[] | undefined | null): string[] => {
  if (!images || images.length === 0) return [];
  return images.map(url => getAbsoluteImageUrl(url));
};
