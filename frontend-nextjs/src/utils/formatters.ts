import { format, parseISO, isValid } from 'date-fns';
import { logger } from '@/config/logger';

// Date formatting utilities
export const formatDate = (date: string | Date, formatString = 'MMM dd, yyyy'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }
    return format(dateObj, formatString);
  } catch (error) {
    logger.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

export const formatTime = (time: string, formatString = 'h:mm a'): string => {
  try {
    const timeObj = parseISO(`2000-01-01T${time}`);
    if (!isValid(timeObj)) {
      throw new Error('Invalid time');
    }
    return format(timeObj, formatString);
  } catch (error) {
    logger.error('Time formatting error:', error);
    return 'Invalid time';
  }
};

export const formatDateTime = (date: string | Date, formatString = 'MMM dd, yyyy h:mm a'): string => {
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    if (!isValid(dateObj)) {
      throw new Error('Invalid date');
    }
    return format(dateObj, formatString);
  } catch (error) {
    logger.error('DateTime formatting error:', error);
    return 'Invalid date';
  }
};

// Price formatting
export const formatPrice = (price: number, currency = 'INR'): string => {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  } catch (error) {
    logger.error('Price formatting error:', error);
    return `₹${price}`;
  }
};

// Phone number formatting
export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
};

// Text truncation
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
};

// Distance formatting
export const formatDistance = (distance: number, unit: 'mi' | 'km' = 'mi'): string => {
  const formatted = distance < 1 ? distance.toFixed(1) : Math.round(distance);
  return `${formatted} ${unit}`;
};