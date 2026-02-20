import { z } from 'zod';

/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Phone number validation regex (international format)
 */
export const PHONE_REGEX = /^\+?[\d\s\-\(\)]+$/;

/**
 * Password validation regex (at least 8 chars, 1 uppercase, 1 lowercase, 1 number)
 */
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

/**
 * UUID validation regex
 */
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate email address
 */
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

/**
 * Validate phone number
 */
export const isValidPhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone);
};

/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  return PASSWORD_REGEX.test(password);
};

/**
 * Validate UUID
 */
export const isValidUUID = (uuid: string): boolean => {
  return UUID_REGEX.test(uuid);
};

/**
 * Validate date string
 */
export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

/**
 * Validate if date is in the future
 */
export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
};

/**
 * Validate if date is in the past
 */
export const isPastDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
};

/**
 * Validate age (must be at least minimum age)
 */
export const isValidAge = (dateOfBirth: string, minimumAge: number = 13): boolean => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= minimumAge;
  }
  
  return age >= minimumAge;
};

/**
 * Validate URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validate credit card number (basic Luhn algorithm)
 */
export const isValidCreditCard = (cardNumber: string): boolean => {
  const num = cardNumber.replace(/\D/g, '');
  
  if (num.length < 13 || num.length > 19) {
    return false;
  }
  
  let sum = 0;
  let isEven = false;
  
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i]!, 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }
  
  return sum % 10 === 0;
};

/**
 * Validate file size
 */
export const isValidFileSize = (size: number, maxSizeInMB: number): boolean => {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return size <= maxSizeInBytes;
};

/**
 * Validate file type
 */
export const isValidFileType = (mimetype: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(mimetype);
};

/**
 * Validate image file
 */
export const isValidImageFile = (mimetype: string): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  return isValidFileType(mimetype, allowedTypes);
};

/**
 * Validate document file
 */
export const isValidDocumentFile = (mimetype: string): boolean => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/rtf',
  ];
  return isValidFileType(mimetype, allowedTypes);
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

/**
 * Validate and sanitize HTML
 */
export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

/**
 * Validate business hours format
 */
export const isValidBusinessHours = (hours: any): boolean => {
  if (typeof hours !== 'object' || hours === null) {
    return false;
  }
  
  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  for (const day of days) {
    if (hours[day]) {
      const dayHours = hours[day];
      
      if (dayHours.off === true) {
        continue;
      }
      
      if (!dayHours.start || !dayHours.end) {
        return false;
      }
      
      // Validate time format (HH:MM)
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(dayHours.start) || !timeRegex.test(dayHours.end)) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Validate appointment time slot
 */
export const isValidTimeSlot = (startTime: string, endTime: string, duration: number): boolean => {
  const start = new Date(startTime);
  const end = new Date(endTime);
  
  if (start >= end) {
    return false;
  }
  
  const actualDuration = (end.getTime() - start.getTime()) / (1000 * 60); // in minutes
  return actualDuration >= duration;
};

/**
 * Validate price format
 */
export const isValidPrice = (price: number): boolean => {
  return price >= 0 && Number.isFinite(price) && price <= 999999.99;
};

/**
 * Validate percentage
 */
export const isValidPercentage = (percentage: number): boolean => {
  return percentage >= 0 && percentage <= 100 && Number.isFinite(percentage);
};

/**
 * Validate rating (1-5 stars)
 */
export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

/**
 * Validate duration in minutes
 */
export const isValidDuration = (duration: number): boolean => {
  return Number.isInteger(duration) && duration > 0 && duration <= 480; // Max 8 hours
};

/**
 * Common Zod schemas for reuse
 */
export const commonValidationSchemas = {
  email: z.string().email('Invalid email format'),
  
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(PASSWORD_REGEX, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  
  phone: z
    .string()
    .regex(PHONE_REGEX, 'Invalid phone number format')
    .optional(),
  
  uuid: z
    .string()
    .uuid('Invalid UUID format'),
  
  positiveNumber: z
    .number()
    .positive('Must be a positive number'),
  
  nonNegativeNumber: z
    .number()
    .min(0, 'Must be a non-negative number'),
  
  rating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  
  price: z
    .number()
    .min(0, 'Price must be non-negative')
    .max(999999.99, 'Price is too high'),
  
  percentage: z
    .number()
    .min(0, 'Percentage must be at least 0')
    .max(100, 'Percentage must be at most 100'),
  
  duration: z
    .number()
    .int('Duration must be an integer')
    .min(1, 'Duration must be at least 1 minute')
    .max(480, 'Duration must be at most 8 hours'),
  
  dateString: z
    .string()
    .refine(isValidDate, 'Invalid date format'),
  
  futureDateString: z
    .string()
    .refine(isValidDate, 'Invalid date format')
    .refine(isFutureDate, 'Date must be in the future'),
  
  pastDateString: z
    .string()
    .refine(isValidDate, 'Invalid date format')
    .refine(isPastDate, 'Date must be in the past'),
};
