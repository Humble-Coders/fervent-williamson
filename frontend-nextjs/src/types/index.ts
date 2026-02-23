// Core types for the salon booking platform

// Re-export specialized type modules
export * from './forms';

// ============================================================================
// ENUMS
// ============================================================================

export enum UserRole {
  ADMIN = 'ADMIN',
  SALON_OWNER = 'SALON_OWNER',
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  CUSTOMER = 'CUSTOMER'
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED'
}

export enum OfferType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
  FREE_SERVICE = 'FREE_SERVICE',
  BOGO = 'BOGO'
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: PaginationInfo;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: ValidationError[];
  status?: number;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============================================================================
// USER TYPES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  role: UserRole;
  isActive: boolean;
  emailVerified: boolean;
  preferences?: UserPreferences;
  ownedSalons?: Salon[];
  createdAt: string;
  updatedAt: string;
}

export interface UserWithRelations extends User {
  bookings?: Booking[];
  reviews?: Review[];
  favorites?: Favorite[];
  ownedSalons?: Salon[];
}

export interface UserPreferences {
  preferredServices: string[];
  preferredLocations: string[];
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
    marketing: boolean;
  };
  language: string;
  currency: string;
  timezone: string;
}

// ============================================================================
// AUTHENTICATION TYPES
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: UserRole;
}

export interface AuthResponse {
  user: User;
}

export interface PasswordResetRequest {
  email: string;
}

// ============================================================================
// SALON TYPES
// ============================================================================

export interface Salon {
  id: string;
  displayId: number; // Auto-increment ID for user-friendly URLs
  name: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  rating: number;
  reviewCount: number;
  images: string[];
  featured: boolean;
  isOpen: boolean;
  distance?: string;
  specialties: string[];
  amenities: string[];
  teamSize: number;
  yearsInBusiness: number;
  certifications: string[];
  workingHours: WorkingHours;
  mapsLink?: string;
  ownerId?: string;
  // Booking config fields (stored on salon doc in Firestore)
  slotDuration?: number;
  breakDuration?: number;
  advanceBookingDays?: number;
  minimumNoticeHours?: number;
  bufferTime?: number;
  maxBookingsPerDay?: number;
  allowSameDayBooking?: boolean;
  autoConfirmBookings?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalonWithRelations extends Salon {
  services?: Service[];
  stylists?: Stylist[];
  reviews?: Review[];
  bookings?: Booking[];
  offers?: Offer[];
  owner?: User;
  _count?: {
    services: number;
    stylists: number;
    reviews: number;
    bookings: number;
  };
}

export interface SalonBookingConfig {
  id: string;
  salonId: string;
  slotDuration: number; // in minutes
  breakDuration: number; // in minutes
  advanceBookingDays: number;
  minimumNoticeHours: number;
  bufferTime: number; // in minutes
  maxBookingsPerDay: number;
  allowSameDayBooking: boolean;
  autoConfirmBookings: boolean;
  cancellationPolicy: string;
  reschedulePolicy: string;
}

// Type for creating salons (omits auto-generated fields and uses backend format)
export type CreateSalonData = Omit<Salon, 'id' | 'displayId' | 'rating' | 'reviewCount' | 'createdAt' | 'updatedAt' | 'ownerId' | 'workingHours'> & {
  services?: CreateServiceData[];
  stylists?: CreateStylistData[];
  workingHours?: BackendWorkingHours;
};

export interface WorkingHours {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface DaySchedule {
  open: string; // HH:MM format
  close: string; // HH:MM format
  closed: boolean;
  breaks?: TimeSlot[];
}

// Backend API expects isOpen instead of closed
export interface BackendDaySchedule {
  open: string; // HH:MM format
  close: string; // HH:MM format
  isOpen: boolean;
}

export interface BackendWorkingHours {
  monday?: BackendDaySchedule;
  tuesday?: BackendDaySchedule;
  wednesday?: BackendDaySchedule;
  thursday?: BackendDaySchedule;
  friday?: BackendDaySchedule;
  saturday?: BackendDaySchedule;
  sunday?: BackendDaySchedule;
}

// Service data for salon creation (matches backend serviceSchema)
export interface CreateServiceData {
  id?: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  category: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  isActive?: boolean;
  images?: string[];
}

// Stylist data for salon creation (matches backend stylistSchema)
export interface CreateStylistData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  specialties?: string[];
  services?: string[];
  experience?: number;
  isActive?: boolean;
  images?: string[];
}

export interface TimeSlot {
  start: string; // HH:MM format
  end: string; // HH:MM format
}

// ============================================================================
// SERVICE TYPES
// ============================================================================

export interface SubService {
  id: string;
  displayId: number;
  name: string;
  description?: string;
  duration: number;
  price: number;
  images: string[];
  isActive: boolean;
  serviceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  displayId: number; // Auto-increment ID for user-friendly URLs
  name: string;
  description: string;
  duration: number; // in minutes
  price: number;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  categoryId: string;
  salonId: string;
  isActive: boolean;
  images: string[];
  requirements?: string[];
  benefits?: string[];
  subServices?: SubService[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceWithRelations extends Service {
  category?: ServiceCategory;
  salon?: Salon;
  stylists?: Stylist[];
  bookings?: Booking[];
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon: string;
  emoji: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategoryWithRelations extends ServiceCategory {
  services?: Service[];
  _count?: {
    services: number;
  };
}

// ============================================================================
// STYLIST/STAFF TYPES
// ============================================================================

export interface Stylist {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  images?: string[]; // Stylist images
  bio?: string;
  specialties: string[];
  experience: number; // years
  rating: number;
  reviewCount: number;
  isActive: boolean;
  salonId: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StylistWithRelations extends Stylist {
  salon?: Salon;
  user?: User;
  services?: Service[];
  bookings?: Booking[];
  reviews?: Review[];
  availability?: StylistAvailability[];
}

export interface StylistAvailability {
  id: string;
  stylistId: string;
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:MM format
  endTime: string; // HH:MM format
  isAvailable: boolean;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface Booking {
  id: string;
  userId: string;
  salonId: string;
  serviceId: string;
  stylistId?: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  duration: number; // in minutes
  status: BookingStatus;
  totalPrice: number;
  notes?: string;
  promoCode?: string;
  discount: number;
  verificationCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingWithRelations extends Booking {
  user?: User;
  salon?: Salon;
  service?: Service;
  stylist?: Stylist;
  review?: Review;
}

export interface BookingRequest {
  salonId: string;
  serviceId: string;
  stylistId?: string;
  date: string;
  time: string;
  notes?: string;
  promoCode?: string;
}

export interface BookingAvailability {
  date: string;
  availableSlots: TimeSlot[];
  unavailableSlots: TimeSlot[];
}

// ============================================================================
// REVIEW TYPES
// ============================================================================

export interface Review {
  id: string;
  userId: string;
  salonId: string;
  serviceId?: string;
  stylistId?: string;
  bookingId?: string;
  rating: number;
  comment: string;
  images?: string[];
  isVerified: boolean;
  helpfulCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewWithRelations extends Review {
  user?: User;
  salon?: Salon;
  service?: Service;
  stylist?: Stylist;
  booking?: Booking;
}

export interface ReviewRequest {
  salonId: string;
  serviceId?: string;
  stylistId?: string;
  bookingId?: string;
  rating: number;
  comment: string;
  images?: File[];
}

export interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// ============================================================================
// OFFER TYPES
// ============================================================================

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: OfferType;
  value: number; // percentage or fixed amount
  minAmount?: number;
  maxDiscount?: number;
  code?: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  usageLimit?: number;
  usageCount: number;
  applicableSalons: string[];
  applicableServices: string[];
  terms?: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OfferWithRelations extends Offer {
  salons?: Salon[];
  services?: Service[];
  usedBy?: User[];
}

// ============================================================================
// FAVORITE TYPES
// ============================================================================

export interface Favorite {
  id: string;
  userId: string;
  salonId: string;
  createdAt: string;
}

export interface FavoriteWithRelations extends Favorite {
  salon?: Salon;
}

// ============================================================================
// SYSTEM CONFIG TYPES
// ============================================================================

export interface SystemConfig {
  id: string;
  key: string;
  value: any;
  description?: string;
  isPublic: boolean;
  updatedAt: string;
}

export interface AppConfig {
  emailVerificationRequired: boolean;
  smsVerificationRequired: boolean;
  allowGuestBooking: boolean;
  defaultBookingDuration: number;
  maxAdvanceBookingDays: number;
  minNoticeHours: number;
  reviewsEnabled: boolean;
  maintenanceMode: boolean;
  appVersion: string;
}

// ============================================================================
// SEARCH AND FILTER TYPES
// ============================================================================

export interface SearchFilters {
  query?: string;
  location?: string;
  services?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  distance?: number;
  availability?: {
    date: string;
    time?: string;
  };
  amenities?: string[];
  sortBy?: 'rating' | 'distance' | 'price' | 'popularity';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResults<T> {
  items: T[];
  total: number;
  filters: SearchFilters;
  suggestions?: string[];
}

// ============================================================================
// FORM TYPES
// ============================================================================

export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export interface FeedbackForm {
  type: 'bug' | 'feature' | 'general';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: File[];
}

// ============================================================================
// NOTIFICATION TYPES
// ============================================================================

export interface Notification {
  id: string;
  userId: string;
  type: 'booking' | 'payment' | 'review' | 'offer' | 'system';
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  bookingReminders: boolean;
  promotionalOffers: boolean;
  reviewRequests: boolean;
  systemUpdates: boolean;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export interface AnalyticsData {
  period: 'day' | 'week' | 'month' | 'year';
  startDate: string;
  endDate: string;
  metrics: {
    [key: string]: number | string;
  };
}

export interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalCustomers: number;
  growthRate: number;
  popularServices: Array<{
    service: Service;
    bookingCount: number;
  }>;
  recentBookings: Booking[];
  recentReviews: Review[];
}

// ============================================================================
// COMPONENT PROP TYPES
// ============================================================================

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export interface EmptyStateProps extends BaseComponentProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: React.ReactNode;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export interface InputProps extends BaseComponentProps {
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface CardProps extends BaseComponentProps {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export interface BadgeProps extends BaseComponentProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface AuthHookReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface AuthPromptHookReturn {
  showAuthPrompt: (message?: string) => void;
  hideAuthPrompt: () => void;
  isVisible: boolean;
}

export interface ToastHookReturn {
  showToast: (message: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  hideToast: (id: string) => void;
  toasts: Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  }>;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type ID = string | number;
export type Timestamp = string;
export type Currency = number;
export type Rating = number; // 1-5
export type Percentage = number; // 0-100

// ============================================================================
// ROUTE TYPES
// ============================================================================

export interface RouteParams {
  id?: string;
  salonId?: string;
  serviceId?: string;
  bookingId?: string;
  userId?: string;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  search?: string;
  filter?: string;
  sort?: string;
  [key: string]: any;
}