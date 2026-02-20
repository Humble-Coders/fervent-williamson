import {
  User,
  Salon,
  ServiceCategory,
  Service,
  Stylist,
  Booking,
  Payment,
  PaymentMethod,
  Review,
  RefreshToken,
  LoyaltyAccount,
  LoyaltyTransaction,
  Offer,
  Favorite,
  UserRole,
  BookingStatus,
  PaymentStatus,
  PaymentMethodType,
  OfferType,
  Gender
} from '@prisma/client';

// Re-export Prisma types
export {
  User,
  Salon,
  ServiceCategory,
  Service,
  Stylist,
  Booking,
  Payment,
  PaymentMethod,
  Review,
  RefreshToken,
  LoyaltyAccount,
  LoyaltyTransaction,
  Offer,
  Favorite,
  UserRole,
  BookingStatus,
  PaymentStatus,
  PaymentMethodType,
  OfferType,
  Gender,
};

// Extended types with relations
export interface UserWithRelations extends User {
  loyaltyAccount?: LoyaltyAccount | null;
  paymentMethods?: PaymentMethod[];
  bookings?: Booking[];
  reviews?: Review[];
  favorites?: Favorite[];
}

// User with profile information (for authentication)
export interface UserWithProfile extends User {
  loyaltyAccount?: LoyaltyAccount | null;
  paymentMethods?: PaymentMethod[];
  bookings?: Booking[];
  reviews?: Review[];
  favorites?: Favorite[];
  ownedSalons?: Salon[];
}

// Type for user with minimal auth info
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  preferences?: any;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  emailVerified: boolean;
}

export interface SalonWithDetails extends Salon {
  services: (Service & {
    category: ServiceCategory;
  })[];
  stylists: Stylist[];
  reviews: (Review & {
    user: User;
  })[];
  offers?: Offer[];
  _count?: {
    reviews: number;
    bookings: number;
  };
}

export interface ServiceWithDetails extends Service {
  salon: Salon;
  category: ServiceCategory;
}

export interface StylistWithDetails extends Stylist {
  salon: Salon;
  reviews?: (Review & {
    user: User;
  })[];
  _count?: {
    reviews: number;
    bookings: number;
  };
}

export interface BookingWithDetails extends Booking {
  user: User;
  salon: Salon;
  service: Service & {
    category: ServiceCategory;
  };
  stylist?: Stylist | null;
  payment?: Payment | null;
  review?: Review | null;
}

export interface ReviewWithDetails extends Review {
  user: User;
  salon: Salon;
  stylist?: Stylist | null;
  booking?: Booking | null;
}

export interface PaymentWithDetails extends Payment {
  booking: Booking & {
    user: User;
    salon: Salon;
    service: Service;
  };
}

export interface LoyaltyAccountWithTransactions extends LoyaltyAccount {
  user: User;
  transactions: LoyaltyTransaction[];
}

// Database query options
export interface FindManyOptions {
  skip?: number;
  take?: number;
  orderBy?: Record<string, 'asc' | 'desc'>;
  where?: Record<string, any>;
  include?: Record<string, any>;
  select?: Record<string, any>;
}

export interface FindUniqueOptions {
  where: Record<string, any>;
  include?: Record<string, any>;
  select?: Record<string, any>;
}

// Pagination helpers
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Search and filter types
export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface SalonFilters {
  search?: string;
  featured?: boolean;
  isOpen?: boolean;
  ratingMin?: number;
  specialties?: string[];
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  radius?: number; // in miles/km
}

export interface ServiceFilters {
  categoryId?: string;
  salonId?: string;
  isActive?: boolean;
  popular?: boolean;
  priceMin?: number;
  priceMax?: number;
  durationMin?: number;
  durationMax?: number;
}

export interface BookingFilters {
  userId?: string;
  salonId?: string;
  serviceId?: string;
  stylistId?: string;
  status?: BookingStatus;
  dateFrom?: string;
  dateTo?: string;
}

export interface PaymentFilters {
  status?: PaymentStatus;
  method?: string;
  amountMin?: number;
  amountMax?: number;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface ReviewFilters {
  userId?: string;
  salonId?: string;
  stylistId?: string;
  ratingMin?: number;
  ratingMax?: number;
  verified?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
}

export interface StylistFilters {
  salonId?: string;
  specialties?: string[];
  ratingMin?: number;
  isActive?: boolean;
}

export interface OfferFilters {
  type?: OfferType;
  salonId?: string;
  isActive?: boolean;
  validOnly?: boolean; // Only return offers that haven't expired
}
