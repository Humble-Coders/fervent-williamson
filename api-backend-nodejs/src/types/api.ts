// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Request Types
export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchQuery extends PaginationQuery {
  q?: string;
}

// Authentication Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'CUSTOMER' | 'STAFF';
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// User Types
export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: 'ADMIN' | 'CUSTOMER';
  preferences?: any;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  avatar?: string;
  preferences?: any;
  isActive?: boolean;
}

// Salon Types
export interface CreateSalonRequest {
  name: string;
  description: string;
  address: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  email: string;
  images?: string[];
  specialties?: string[];
  amenities?: string[];
  teamSize?: number;
  yearsInBusiness?: number;
  certifications?: string[];
  workingHours: any;
}

export interface UpdateSalonRequest {
  name?: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  images?: string[];
  featured?: boolean;
  isOpen?: boolean;
  specialties?: string[];
  amenities?: string[];
  teamSize?: number;
  yearsInBusiness?: number;
  certifications?: string[];
  workingHours?: any;
}

// Stylist Types
export interface CreateStylistRequest {
  name: string;
  avatar?: string;
  specialties: string[];
  experience: string;
  emoji: string;
  salonId: string;
}

export interface UpdateStylistRequest {
  name?: string;
  avatar?: string;
  specialties?: string[];
  experience?: string;
  emoji?: string;
  isActive?: boolean;
}

// Service Types
export interface CreateServiceRequest {
  name: string;
  description: string;
  duration: number;
  price: number;
  popular?: boolean;
  emoji: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  salonId: string;
  categoryId: string;
}

export interface UpdateServiceRequest {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  popular?: boolean;
  emoji?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  isActive?: boolean;
}

// Service Category Types
export interface CreateServiceCategoryRequest {
  name: string;
  icon: string;
  color?: string;
  emoji: string;
  description?: string;
}

export interface UpdateServiceCategoryRequest {
  name?: string;
  icon?: string;
  color?: string;
  emoji?: string;
  description?: string;
}

// Booking Types
export interface CreateBookingRequest {
  salonId: string;
  serviceId: string;
  stylistId?: string;
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  notes?: string;
  promoCode?: string;
}

export interface UpdateBookingRequest {
  date?: string;
  time?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
}

// Payment Types
export interface CreatePaymentRequest {
  bookingId: string;
  amount: number;
  method: string;
  transactionId?: string;
}

export interface UpdatePaymentRequest {
  status?: 'PENDING' | 'PAID' | 'REFUNDED' | 'FAILED';
  transactionId?: string;
}

// Payment Method Types
export interface CreatePaymentMethodRequest {
  type: 'CARD' | 'WALLET' | 'BANK';
  name: string;
  last4?: string;
  expiryDate?: string;
  brand: string;
  icon: string;
  isDefault?: boolean;
}

export interface UpdatePaymentMethodRequest {
  name?: string;
  expiryDate?: string;
  isDefault?: boolean;
}

// Review Types
export interface CreateReviewRequest {
  salonId: string;
  stylistId?: string;
  bookingId?: string;
  rating: number;
  comment: string;
  service: string;
  emoji: string;
}

export interface UpdateReviewRequest {
  rating?: number;
  comment?: string;
  emoji?: string;
}

// Loyalty Types
export interface LoyaltyTransactionRequest {
  points: number;
  type: 'earned' | 'redeemed' | 'expired';
  description: string;
  bookingId?: string;
}

// Offer Types
export interface CreateOfferRequest {
  title: string;
  description: string;
  discount: string;
  badge: string;
  emoji: string;
  gradient: string;
  type: 'DISCOUNT' | 'SERVICE' | 'PREMIUM';
  salonId?: string;
  validUntil?: string;
}

export interface UpdateOfferRequest {
  title?: string;
  description?: string;
  discount?: string;
  badge?: string;
  emoji?: string;
  gradient?: string;
  validUntil?: string;
  isActive?: boolean;
}

// Favorite Types
export interface CreateFavoriteRequest {
  salonId: string;
}

// Search Types
export interface SalonSearchRequest extends PaginationQuery {
  search?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  featured?: boolean;
  specialties?: string[];
  amenities?: string[];
  ratingMin?: number;
}

export interface ServiceSearchRequest extends PaginationQuery {
  search?: string;
  categoryId?: string;
  salonId?: string;
  priceMin?: number;
  priceMax?: number;
  popular?: boolean;
}
