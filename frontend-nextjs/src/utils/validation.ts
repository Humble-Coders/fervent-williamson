import { z } from 'zod';

// ============================================================================
// VALIDATION REGEX PATTERNS
// ============================================================================

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PHONE_REGEX = /^[\+]?[1-9][\d]{0,15}$/;
export const INDIAN_PHONE_REGEX = /^(\+91|91)?[6-9]\d{9}$/;
export const OTP_REGEX = /^\d{6}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
export const NAME_REGEX = /^[a-zA-Z\s]{2,50}$/;

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

export const isValidPhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  return INDIAN_PHONE_REGEX.test(cleanPhone);
};

export const isValidOTP = (otp: string): boolean => {
  return OTP_REGEX.test(otp.trim());
};

export const isValidPassword = (password: string): boolean => {
  return password.length >= 8 && PASSWORD_REGEX.test(password);
};

export const isValidName = (name: string): boolean => {
  return NAME_REGEX.test(name.trim()) && name.trim().length >= 2;
};

export const isPasswordStrong = (password: string): { isStrong: boolean; message: string } => {
  if (password.length < 8) {
    return { isStrong: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[a-z]/.test(password)) {
    return { isStrong: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isStrong: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/\d/.test(password)) {
    return { isStrong: false, message: 'Password must contain at least one number' };
  }
  return { isStrong: true, message: 'Password is strong' };
};

export const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  return phone;
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

export const isFutureDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
};

export const isValidTime = (timeString: string): boolean => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeString) ||
         /^(1[0-2]|0?[1-9]):[0-5][0-9]\s?(AM|PM)$/i.test(timeString);
};

export const isValidPromoCode = (code: string): boolean => {
  return /^[A-Z0-9]{3,20}$/i.test(code.trim());
};

export const isValidRating = (rating: number): boolean => {
  return Number.isInteger(rating) && rating >= 1 && rating <= 5;
};

// ============================================================================
// VALIDATION ERROR MESSAGES
// ============================================================================

export const VALIDATION_MESSAGES = {
  REQUIRED: 'This field is required',
  EMAIL_INVALID: 'Please enter a valid email address',
  EMAIL_REQUIRED: 'Email address is required',
  PHONE_INVALID: 'Please enter a valid phone number',
  PHONE_REQUIRED: 'Phone number is required',
  OTP_INVALID: 'Please enter a valid 6-digit code',
  OTP_REQUIRED: 'Verification code is required',
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN_LENGTH: 'Password must be at least 8 characters',
  PASSWORD_WEAK: 'Password must contain uppercase, lowercase, and number',
  PASSWORD_MISMATCH: 'Passwords do not match',
  NAME_REQUIRED: 'Name is required',
  NAME_INVALID: 'Please enter a valid name (2-50 characters, letters only)',
  NAME_MIN_LENGTH: 'Name must be at least 2 characters',

  // Booking validation messages
  SALON_REQUIRED: 'Please select a salon',
  SERVICE_REQUIRED: 'Please select a service',
  DATE_REQUIRED: 'Please select a date',
  DATE_INVALID: 'Please enter a valid date',
  DATE_PAST: 'Please select a future date',
  TIME_REQUIRED: 'Please select a time',
  TIME_INVALID: 'Please enter a valid time',
  PROMO_CODE_INVALID: 'Please enter a valid promo code',
  RATING_REQUIRED: 'Please provide a rating',
  RATING_INVALID: 'Rating must be between 1 and 5 stars',
  REVIEW_TOO_SHORT: 'Review must be at least 10 characters',
  REVIEW_TOO_LONG: 'Review cannot exceed 500 characters',
  CANCELLATION_REASON_REQUIRED: 'Please provide a reason for cancellation',
} as const;

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

// Basic field schemas
export const emailSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.EMAIL_REQUIRED)
  .refine(isValidEmail, VALIDATION_MESSAGES.EMAIL_INVALID);

export const phoneSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.PHONE_REQUIRED)
  .refine(isValidPhone, VALIDATION_MESSAGES.PHONE_INVALID);

export const otpSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.OTP_REQUIRED)
  .refine(isValidOTP, VALIDATION_MESSAGES.OTP_INVALID);

export const passwordSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED)
  .min(8, VALIDATION_MESSAGES.PASSWORD_MIN_LENGTH)
  .refine(isValidPassword, VALIDATION_MESSAGES.PASSWORD_WEAK);

export const nameSchema = z
  .string()
  .min(1, VALIDATION_MESSAGES.NAME_REQUIRED)
  .min(2, VALIDATION_MESSAGES.NAME_MIN_LENGTH)
  .refine(isValidName, VALIDATION_MESSAGES.NAME_INVALID);

// User validation schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, VALIDATION_MESSAGES.PASSWORD_REQUIRED),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
});

export const profileUpdateSchema = z.object({
  name: nameSchema.optional(),
  phone: phoneSchema.optional(),
});

// Onboarding validation schemas
export const contactInputSchema = z.object({
  contact: z.string().min(1, 'Please enter your contact information'),
  type: z.enum(['email', 'phone', 'whatsapp']),
});

export const otpVerificationSchema = z.object({
  otp: otpSchema,
  contact: z.string().min(1, 'Contact information is required'),
});

export const passwordSetupSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: VALIDATION_MESSAGES.PASSWORD_MISMATCH,
  path: ['confirmPassword'],
});

export const nameInputSchema = z.object({
  name: nameSchema,
  gender: z.enum(['MALE', 'FEMALE']).optional(),
});

// Booking validation schemas
export const bookingSchema = z.object({
  salonId: z.string().min(1, 'Please select a salon'),
  serviceId: z.string().min(1, 'Please select a service'),
  stylistId: z.string().optional(),
  date: z.string().min(1, 'Please select a date'),
  time: z.string().min(1, 'Please select a time'),
  notes: z.string().optional(),
  promoCode: z.string().optional(),
});

export const customerInfoSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
});

export const bookingRescheduleSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  date: z.string().min(1, 'Please select a new date'),
  time: z.string().min(1, 'Please select a new time'),
  reason: z.string().optional(),
});

export const bookingCancellationSchema = z.object({
  bookingId: z.string().min(1, 'Booking ID is required'),
  reason: z.string().min(1, 'Please provide a reason for cancellation'),
  refundRequested: z.boolean().optional(),
});

export const reviewSchema = z.object({
  rating: z.number().int().min(1, 'Please provide a rating').max(5, 'Rating cannot exceed 5 stars'),
  comment: z.string().min(10, 'Please provide at least 10 characters in your review').max(500, 'Review cannot exceed 500 characters'),
  serviceQuality: z.number().int().min(1).max(5).optional(),
  cleanliness: z.number().int().min(1).max(5).optional(),
  value: z.number().int().min(1).max(5).optional(),
});

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, 'Please enter a search term'),
  location: z.string().optional(),
  category: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;
export type BookingFormData = z.infer<typeof bookingSchema>;
export type SearchFormData = z.infer<typeof searchSchema>;