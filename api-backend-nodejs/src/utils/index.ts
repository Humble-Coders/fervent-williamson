// Re-export all utilities
export * from './helpers';
export * from './validation';
export * from './auth';

// Common utility functions
export const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export const generateId = (): string =>
  Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const formatCurrency = (amount: number, currency = 'INR'): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};

export const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .replace(/[^\w ]+/g, '')
    .replace(/ +/g, '-');
};

export const capitalize = (text: string): string => {
  return text.charAt(0).toUpperCase() + text.slice(1);
};

export const truncate = (text: string, length: number): string => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

/**
 * Smart truncation for service names in SMS
 * - If total length < 40 chars: Show all services
 * - If total length > 40 chars: Show first 2 services + "... +X more"
 */
export const truncateServiceNames = (serviceNames: string[]): string => {
  const MAX_LENGTH = 40;

  // Join all service names
  const fullText = serviceNames.join(', ');

  // If short enough, return as is
  if (fullText.length <= MAX_LENGTH) {
    return fullText;
  }

  // Show first 2 services + count
  const firstTwo = serviceNames.slice(0, 2).join(', ');
  const remaining = serviceNames.length - 2;

  if (remaining > 0) {
    return `${firstTwo}... +${remaining} more`;
  }

  return firstTwo;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d\s\-\(\)]{7,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-z0-9.-]/gi, '_').toLowerCase();
};

export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const isImageFile = (filename: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];
  return imageExtensions.includes(getFileExtension(filename));
};

export const generateOTP = (length = 6): string => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length < 4) return phone;
  return cleaned.substring(0, 2) + '*'.repeat(cleaned.length - 4) + cleaned.substring(cleaned.length - 2);
};

export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
};

export const formatDistance = (distance: number): string => {
  if (distance < 1) {
    return `${Math.round(distance * 1000)}m`;
  }
  return `${distance.toFixed(1)}km`;
};

export const generateSlug = (title: string, id?: string): string => {
  const slug = slugify(title);
  return id ? `${slug}-${id}` : slug;
};

export const parseSlug = (slug: string): { title: string; id?: string } => {
  const parts = slug.split('-');
  const id = parts[parts.length - 1];
  const title = parts.slice(0, -1).join('-');
  return { title, id };
};

export const createPagination = (
  page: number,
  limit: number,
  total: number
) => {
  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext,
    hasPrev,
  };
};

export const validatePaginationParams = (
  page?: string | number,
  limit?: string | number
) => {
  const parsedPage = Math.max(1, parseInt(String(page || 1), 10));
  const parsedLimit = Math.min(100, Math.max(1, parseInt(String(limit || 10), 10)));

  return {
    page: parsedPage,
    limit: parsedLimit,
    skip: (parsedPage - 1) * parsedLimit,
  };
};
