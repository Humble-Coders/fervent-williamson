// API-specific type definitions
import type {
  User,
  Salon,
  Service,
  Booking,
  Review,
  ServiceCategory,
  Offer,
  PaymentMethod,
  LoyaltyAccount,
  ApiResponse,
  PaginationInfo,
} from './index';

// ============================================================================
// API REQUEST TYPES
// ============================================================================

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SalonListParams extends PaginationParams {
  featured?: boolean;
  location?: string;
  services?: string[];
  rating?: number;
  distance?: number;
  priceRange?: {
    min: number;
    max: number;
  };
}

export interface ServiceListParams extends PaginationParams {
  salonId?: string;
  categoryId?: string;
  priceRange?: {
    min: number;
    max: number;
  };
  duration?: {
    min: number;
    max: number;
  };
}

export interface BookingListParams extends PaginationParams {
  userId?: string;
  salonId?: string;
  status?: string[];
  dateFrom?: string;
  dateTo?: string;
}

export interface ReviewListParams extends PaginationParams {
  salonId?: string;
  serviceId?: string;
  stylistId?: string;
  rating?: number;
  verified?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export type AuthApiResponse = ApiResponse<{
  user: User;
  token: string;
  refreshToken: string;
  expiresIn: number;
}>;

export type UserApiResponse = ApiResponse<User>;
export type UsersApiResponse = ApiResponse<User[]>;

export type SalonApiResponse = ApiResponse<Salon>;
export type SalonsApiResponse = ApiResponse<Salon[]>;

export type ServiceApiResponse = ApiResponse<Service>;
export type ServicesApiResponse = ApiResponse<Service[]>;

export type ServiceCategoryApiResponse = ApiResponse<ServiceCategory>;
export type ServiceCategoriesApiResponse = ApiResponse<ServiceCategory[]>;

export type BookingApiResponse = ApiResponse<Booking>;
export type BookingsApiResponse = ApiResponse<Booking[]>;

export type ReviewApiResponse = ApiResponse<Review>;
export type ReviewsApiResponse = ApiResponse<Review[]>;

export type OfferApiResponse = ApiResponse<Offer>;
export type OffersApiResponse = ApiResponse<Offer[]>;

export type PaymentMethodApiResponse = ApiResponse<PaymentMethod>;
export type PaymentMethodsApiResponse = ApiResponse<PaymentMethod[]>;

export type LoyaltyAccountApiResponse = ApiResponse<LoyaltyAccount>;

export type UploadApiResponse = ApiResponse<{
  url: string;
  filename: string;
  size: number;
  mimetype: string;
}>;

export type AvailabilityApiResponse = ApiResponse<{
  date: string;
  availableSlots: Array<{
    time: string;
    available: boolean;
    stylistId?: string;
  }>;
}>;

export type StatsApiResponse = ApiResponse<{
  totalBookings: number;
  totalRevenue: number;
  totalCustomers: number;
  averageRating: number;
  growthRate: number;
  popularServices: Array<{
    service: Service;
    bookingCount: number;
  }>;
}>;

// ============================================================================
// API ERROR TYPES
// ============================================================================

export interface ApiError {
  message: string;
  code?: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
    code?: string;
  }>;
  status?: number;
  timestamp?: string;
  path?: string;
}

export interface ValidationErrorResponse extends ApiErrorResponse {
  errors: Array<{
    field: string;
    message: string;
    code: string;
    value?: unknown;
  }>;
}

// ============================================================================
// API CLIENT TYPES
// ============================================================================

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

export interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, unknown>;
  data?: unknown;
  timeout?: number;
  signal?: AbortSignal;
}

export interface ApiClient {
  get<T = unknown>(url: string, config?: RequestConfig): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, config?: RequestConfig): Promise<T>;
  delete<T = unknown>(url: string, config?: RequestConfig): Promise<T>;
  upload<T = unknown>(url: string, file: File, config?: RequestConfig): Promise<T>;
}

// ============================================================================
// SERVICE LAYER TYPES
// ============================================================================

export interface AuthService {
  login(credentials: { email: string; password: string }): Promise<AuthApiResponse>;
  register(data: { name: string; email: string; password: string; phone?: string }): Promise<AuthApiResponse>;
  logout(): Promise<ApiResponse>;
  refreshToken(): Promise<AuthApiResponse>;
  sendOTP(data: { identifier: string; type: 'email' | 'sms' }): Promise<ApiResponse>;
  verifyOTP(data: { identifier: string; otp: string; type: 'email' | 'sms' }): Promise<AuthApiResponse>;
  forgotPassword(email: string): Promise<ApiResponse>;
  resetPassword(data: { token: string; password: string }): Promise<ApiResponse>;
  updateProfile(data: Partial<User>): Promise<UserApiResponse>;
}

export interface SalonService {
  getAll(params?: SalonListParams): Promise<SalonsApiResponse>;
  getById(id: string): Promise<SalonApiResponse>;
  create(data: Partial<Salon>): Promise<SalonApiResponse>;
  update(id: string, data: Partial<Salon>): Promise<SalonApiResponse>;
  delete(id: string): Promise<ApiResponse>;
  getFeatured(): Promise<SalonsApiResponse>;
  search(query: string, filters?: any): Promise<SalonsApiResponse>;
  getAvailability(id: string, date: string): Promise<AvailabilityApiResponse>;
}

export interface ServiceService {
  getAll(params?: ServiceListParams): Promise<ServicesApiResponse>;
  getById(id: string): Promise<ServiceApiResponse>;
  getBySalon(salonId: string): Promise<ServicesApiResponse>;
  getByCategory(categoryId: string): Promise<ServicesApiResponse>;
  create(data: Partial<Service>): Promise<ServiceApiResponse>;
  update(id: string, data: Partial<Service>): Promise<ServiceApiResponse>;
  delete(id: string): Promise<ApiResponse>;
}

export interface BookingService {
  getAll(params?: BookingListParams): Promise<BookingsApiResponse>;
  getById(id: string): Promise<BookingApiResponse>;
  getUserBookings(userId: string): Promise<BookingsApiResponse>;
  create(data: Partial<Booking>): Promise<BookingApiResponse>;
  update(id: string, data: Partial<Booking>): Promise<BookingApiResponse>;
  cancel(id: string, reason?: string): Promise<ApiResponse>;
  confirm(id: string): Promise<BookingApiResponse>;
  complete(id: string): Promise<BookingApiResponse>;
  reschedule(id: string, data: { date: string; time: string }): Promise<BookingApiResponse>;
}

export interface ReviewService {
  getAll(params?: ReviewListParams): Promise<ReviewsApiResponse>;
  getById(id: string): Promise<ReviewApiResponse>;
  getBySalon(salonId: string): Promise<ReviewsApiResponse>;
  create(data: Partial<Review>): Promise<ReviewApiResponse>;
  update(id: string, data: Partial<Review>): Promise<ReviewApiResponse>;
  delete(id: string): Promise<ApiResponse>;
  markHelpful(id: string): Promise<ApiResponse>;
}

export interface UploadService {
  uploadImage(file: File, type?: string): Promise<UploadApiResponse>;
  uploadMultiple(files: File[], type?: string): Promise<ApiResponse<string[]>>;
  deleteImage(url: string): Promise<ApiResponse>;
}

// ============================================================================
// WEBHOOK TYPES
// ============================================================================

export interface WebhookPayload {
  event: string;
  data: any;
  timestamp: string;
  signature?: string;
}

export interface BookingWebhook extends WebhookPayload {
  event: 'booking.created' | 'booking.updated' | 'booking.cancelled' | 'booking.completed';
  data: Booking;
}

export interface PaymentWebhook extends WebhookPayload {
  event: 'payment.success' | 'payment.failed' | 'payment.refunded';
  data: {
    bookingId: string;
    amount: number;
    status: string;
    transactionId: string;
  };
}

// ============================================================================
// REAL-TIME TYPES
// ============================================================================

export interface SocketEvent {
  type: string;
  payload: any;
  timestamp: string;
}

export interface BookingUpdateEvent extends SocketEvent {
  type: 'booking:update';
  payload: {
    bookingId: string;
    status: string;
    updatedBy: string;
  };
}

export interface NotificationEvent extends SocketEvent {
  type: 'notification:new';
  payload: {
    userId: string;
    notification: {
      title: string;
      message: string;
      type: string;
    };
  };
}

// Re-export common types
export type { ApiResponse, PaginationInfo };
