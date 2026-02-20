// Form-specific type definitions
import type { UserRole, PaymentMethodType, OfferType } from './index';

// ============================================================================
// AUTHENTICATION FORMS
// ============================================================================

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone?: string;
  agreeToTerms: boolean;
  subscribeToNewsletter?: boolean;
}

export interface ForgotPasswordFormData {
  email: string;
}

export interface ResetPasswordFormData {
  token: string;
  password: string;
  confirmPassword: string;
}

export interface OTPFormData {
  identifier: string;
  otp: string;
  type: 'email' | 'sms';
}

export interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ============================================================================
// USER PROFILE FORMS
// ============================================================================

export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
  avatar?: File | string;
  bio?: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface PreferencesFormData {
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  language: string;
  currency: string;
  timezone: string;
  preferredServices: string[];
  preferredLocations: string[];
}

// ============================================================================
// SALON FORMS
// ============================================================================

export interface SalonFormData {
  name: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  images: (File | string)[];
  specialties: string[];
  amenities: string[];
  teamSize: number;
  yearsInBusiness: number;
  certifications: string[];
  mapsLink?: string;
  workingHours: {
    monday: DayScheduleFormData;
    tuesday: DayScheduleFormData;
    wednesday: DayScheduleFormData;
    thursday: DayScheduleFormData;
    friday: DayScheduleFormData;
    saturday: DayScheduleFormData;
    sunday: DayScheduleFormData;
  };
}

export interface DayScheduleFormData {
  open: string;
  close: string;
  closed: boolean;
  breaks: Array<{
    start: string;
    end: string;
  }>;
}

export interface SalonBookingConfigFormData {
  slotDuration: number;
  breakDuration: number;
  advanceBookingDays: number;
  minimumNoticeHours: number;
  bufferTime: number;
  maxBookingsPerDay: number;
  allowSameDayBooking: boolean;
  enabledPaymentMethods: PaymentMethodType[];
  autoConfirmBookings: boolean;
  requireDeposit: boolean;
  depositAmount?: number;
  cancellationPolicy: string;
  reschedulePolicy: string;
}

// ============================================================================
// SERVICE FORMS
// ============================================================================

export interface ServiceFormData {
  name: string;
  description: string;
  duration: number;
  price: number;
  categoryId: string;
  images: (File | string)[];
  requirements: string[];
  benefits: string[];
  isActive: boolean;
}

export interface ServiceCategoryFormData {
  name: string;
  description?: string;
  icon: string;
  emoji: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
}

// ============================================================================
// STYLIST FORMS
// ============================================================================

export interface StylistFormData {
  name: string;
  email: string;
  phone?: string;
  avatar?: File | string;
  bio?: string;
  specialties: string[];
  experience: number;
  isActive: boolean;
  availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isAvailable: boolean;
  }>;
}

// ============================================================================
// BOOKING FORMS
// ============================================================================

export interface BookingFormData {
  salonId: string;
  serviceId: string;
  stylistId?: string;
  date: string;
  time: string;
  notes?: string;
  promoCode?: string;
  customerInfo?: {
    name: string;
    email: string;
    phone: string;
  };
}

export interface BookingRescheduleFormData {
  bookingId: string;
  date: string;
  time: string;
  reason?: string;
}

export interface BookingCancellationFormData {
  bookingId: string;
  reason: string;
  refundRequested: boolean;
}

// ============================================================================
// REVIEW FORMS
// ============================================================================

export interface ReviewFormData {
  salonId: string;
  serviceId?: string;
  stylistId?: string;
  bookingId?: string;
  rating: number;
  comment: string;
  images: File[];
  wouldRecommend: boolean;
  categories: {
    service: number;
    cleanliness: number;
    staff: number;
    value: number;
    ambiance: number;
  };
}

// ============================================================================
// PAYMENT FORMS
// ============================================================================

export interface PaymentFormData {
  bookingId: string;
  amount: number;
  method: PaymentMethodType;
  paymentMethodId?: string;
  savePaymentMethod: boolean;
  billingAddress?: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export interface PaymentMethodFormData {
  type: PaymentMethodType;
  name: string;
  isDefault: boolean;
  details: {
    // Card details
    cardNumber?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;
    cardholderName?: string;
    
    // Bank details
    accountNumber?: string;
    routingNumber?: string;
    accountType?: 'checking' | 'savings';
    
    // Wallet details
    walletId?: string;
    walletProvider?: string;
  };
}

// ============================================================================
// OFFER FORMS
// ============================================================================

export interface OfferFormData {
  title: string;
  description: string;
  type: OfferType;
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  code?: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  applicableSalons: string[];
  applicableServices: string[];
  terms?: string;
  image?: File | string;
}

// ============================================================================
// SEARCH FORMS
// ============================================================================

export interface SearchFormData {
  query: string;
  location?: string;
  services: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  distance: number;
  availability: {
    date: string;
    time?: string;
  };
  amenities: string[];
  sortBy: 'rating' | 'distance' | 'price' | 'popularity';
  sortOrder: 'asc' | 'desc';
}

export interface FilterFormData {
  services: string[];
  priceRange: {
    min: number;
    max: number;
  };
  rating: number;
  distance: number;
  amenities: string[];
  availability: {
    date: string;
    time?: string;
  };
}

// ============================================================================
// CONTACT FORMS
// ============================================================================

export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  category: 'general' | 'support' | 'business' | 'feedback';
}

export interface FeedbackFormData {
  type: 'bug' | 'feature' | 'improvement' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  attachments: File[];
  userAgent?: string;
  url?: string;
}

export interface SupportTicketFormData {
  subject: string;
  description: string;
  category: 'technical' | 'billing' | 'booking' | 'account' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  attachments: File[];
}

// ============================================================================
// ADMIN FORMS
// ============================================================================

export interface UserManagementFormData {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  permissions: string[];
}

export interface SystemConfigFormData {
  key: string;
  value: any;
  description?: string;
  isPublic: boolean;
}

// ============================================================================
// FORM VALIDATION TYPES
// ============================================================================

export interface FormError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T> {
  data: T;
  errors: FormError[];
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  touched: Record<keyof T, boolean>;
}

export interface FormField<T> {
  name: keyof T;
  value: any;
  error?: string;
  touched: boolean;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  helpText?: string;
}

export interface FormValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
  custom?: (value: any) => string | null;
}

export type FormValidationSchema<T> = {
  [K in keyof T]?: FormValidationRule;
};

// ============================================================================
// FORM HOOKS TYPES
// ============================================================================

export interface UseFormOptions<T> {
  initialValues: T;
  validationSchema?: FormValidationSchema<T>;
  onSubmit: (values: T) => Promise<void> | void;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface UseFormReturn<T> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  isDirty: boolean;
  setFieldValue: (field: keyof T, value: any) => void;
  setFieldError: (field: keyof T, error: string) => void;
  setFieldTouched: (field: keyof T, touched: boolean) => void;
  handleChange: (field: keyof T) => (value: any) => void;
  handleBlur: (field: keyof T) => () => void;
  handleSubmit: () => Promise<void>;
  reset: () => void;
  validate: () => boolean;
}
