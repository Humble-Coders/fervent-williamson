import { api } from './api';
import { logger } from '@/config/logger';
import { extractErrorMessage } from '../utils/errorHandler';

export interface BookingServiceItem {
  serviceId: string;
  subServiceId?: string;
  stylistId?: string;
}

export interface CreateBookingData {
  salonId: string;
  // Support both single service (backward compatibility) and multiple services
  serviceId?: string;
  subServiceId?: string;
  stylistId?: string;
  // New field for multiple services
  services?: BookingServiceItem[];
  date: string; // YYYY-MM-DD format
  time: string; // HH:MM format
  notes?: string;
  promoCode?: string;
}

export interface UpdateBookingData {
  date?: string;
  time?: string;
  status?: 'PENDING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  rescheduleCount?: number;
}

export interface PaymentConfig {
  paymentRequired: boolean;
  paymentGatewayEnabled: boolean;
  paymentTimeoutMinutes: number;
  supportedPaymentMethods: string[];
  skipPaymentDialog: boolean;
  directToRazorpay: boolean;
}

export interface Booking {
  id: string;
  userId: string;
  salonId: string;
  serviceId: string;
  stylistId?: string;
  date: string;
  time: string;
  duration: number;
  status: 'PENDING' | 'PAYMENT_PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  notes?: string;
  promoCode?: string;
  discount: number;
  verificationCode?: string;
  userCode?: string;
  rescheduleCount: number;
  createdAt: string;
  updatedAt: string;
  salon: {
    id: string;
    name: string;
    address: string;
    phone: string;
    images: string[];
  };
  service: {
    id: string;
    name: string;
    description: string;
    price: number;
    duration: number;
    category: string;
  };
  stylist?: {
    id: string;
    name: string;
    avatar?: string;
    specialties: string[];
  };
}

export interface BookingResponse {
  success: boolean;
  data: Booking;
  message: string;
}

export interface BookingsResponse {
  success: boolean;
  data: Booking[];
  message: string;
}

export const bookingService = {
  // Get current user's bookings
  async getUserBookings(): Promise<Booking[]> {
    try {
      const response = await api.get<BookingsResponse>(`/bookings`);
      return (response.data as any).data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Create a new booking
  async createBooking(bookingData: CreateBookingData): Promise<Booking> {
    try {
      const response = await api.post<BookingResponse>('/bookings', bookingData);
      return (response.data as any).data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Get salon's bookings (for salon owners)
  async getSalonBookings(): Promise<BookingsResponse> {
    try {
      const response = await api.get<BookingsResponse>('/bookings/salon/current');
      return response.data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<Booking> {
    try {
      const response = await api.get<BookingResponse>(`/bookings/${bookingId}`);
      return (response.data as any).data;
    } catch (error: unknown) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Update a booking
  async updateBooking(bookingId: string, bookingData: UpdateBookingData): Promise<Booking> {
    try {
      const response = await api.patch<BookingResponse>(`/bookings/${bookingId}`, bookingData);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Cancel a booking
  async cancelBooking(bookingId: string): Promise<Booking> {
    try {
      const response = await api.delete<BookingResponse>(`/bookings/${bookingId}`);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Salon confirms booking and generates user code
  async confirmBooking(bookingId: string): Promise<Booking> {
    try {
      const response = await api.post<BookingResponse>(`/bookings/${bookingId}/confirm`);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Salon completes booking using user code
  async completeBooking(bookingId: string, userCode: string): Promise<Booking> {
    try {
      const response = await api.post<BookingResponse>(`/bookings/${bookingId}/complete`, {
        bookingId,
        userCode
      });
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(extractErrorMessage(error));
    }
  },

  // Validate promo code (client-side validation for immediate feedback)
  validatePromoCode(promoCode: string): { isValid: boolean; discount: number } {
    const validPromoCodes: { [key: string]: number } = {
      'SAVE10': 10,
      'FIRST20': 20,
      'WELCOME15': 15,
    };
    
    const discount = validPromoCodes[promoCode.toUpperCase()] || 0;
    return {
      isValid: discount > 0,
      discount
    };
  },

  // Calculate total price with discount
  calculateTotalPrice(basePrice: number, discountPercent: number): { totalPrice: number; discount: number } {
    const discount = (basePrice * discountPercent) / 100;
    const totalPrice = basePrice - discount;
    
    return {
      totalPrice: Math.max(0, totalPrice), // Ensure price doesn't go negative
      discount
    };
  },

  // Format booking date and time for display
  formatBookingDateTime(date: string, time: string): string {
    try {
      const bookingDate = new Date(`${date}T${time}`);
      return bookingDate.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      return `${date} at ${time}`;
    }
  },

  // Get booking status color for UI
  getBookingStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'CONFIRMED':
        return 'text-green-600 bg-green-100';
      case 'COMPLETED':
        return 'text-blue-600 bg-blue-100';
      case 'CANCELLED':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  },

  // Check if booking can be cancelled
  canCancelBooking(booking: Booking): boolean {
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return false;
    }

    // Check if booking is in the future (allow cancellation up to 2 hours before)
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const twoHoursFromNow = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return bookingDateTime > twoHoursFromNow;
  },

  // Check if booking can be rescheduled
  canRescheduleBooking(booking: Booking, maxRescheduleLimit: number = 3): boolean {
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
      return false;
    }

    // Check if reschedule limit has been reached
    if (booking.rescheduleCount >= maxRescheduleLimit) {
      return false;
    }

    // Check if booking is in the future (allow rescheduling up to 4 hours before)
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const now = new Date();
    const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);

    return bookingDateTime > fourHoursFromNow;
  },

  // Generate available time slots for a given date
  generateTimeSlots(startHour: number = 9, endHour: number = 18, intervalMinutes: number = 30): string[] {
    const slots: string[] = [];
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        slots.push(timeString);
      }
    }
    
    return slots;
  },

  // Check if a date is available for booking (not in the past)
  isDateAvailable(date: string): boolean {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    return selectedDate >= today;
  },

  // Get salon customers from booking data
  async getSalonCustomers(): Promise<any[]> {
    try {
      const bookingsResponse = await this.getSalonBookings();
      const bookings = bookingsResponse.data || [];

      // If no bookings, return empty array
      if (!bookings || bookings.length === 0) {
        return [];
      }

      // Extract unique customers from bookings
      const customerMap = new Map();

      bookings.forEach((booking: any) => {
        // Ensure booking has user data
        if (!booking.user || !booking.user.id) {
          logger.warn('Booking missing user data:', booking);
          return;
        }

        const customerId = booking.user.id;

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: booking.user.name || 'Unknown Customer',
            email: booking.user.email || 'No email',
            phone: booking.user.phone || null,
            avatar: null, // Will be generated from name
            totalBookings: 0,
            totalSpent: 0.0,
            lastVisit: null,
            rating: 0.0,
            status: 'active',
            joinedDate: booking.createdAt,
            bookings: []
          });
        }

        const customer = customerMap.get(customerId);
        customer.totalBookings += 1;
        customer.totalSpent += Number(booking.totalPrice) || 0;
        customer.bookings.push(booking);

        // Update last visit if this booking is more recent
        if (!customer.lastVisit || new Date(booking.date) > new Date(customer.lastVisit)) {
          customer.lastVisit = booking.date;
        }

        // Update joined date if this booking is older
        if (new Date(booking.createdAt) < new Date(customer.joinedDate)) {
          customer.joinedDate = booking.createdAt;
        }
      });

      // Calculate average rating for each customer (placeholder logic)
      customerMap.forEach((customer) => {
        // For now, assign a rating based on booking count and recency
        const baseRating = 4.0;
        const bookingBonus = Math.min(customer.totalBookings * 0.1, 0.8); // Up to 0.8 bonus
        const randomVariation = Math.random() * 0.2; // 0-0.2 variation
        customer.rating = Math.min(baseRating + bookingBonus + randomVariation, 5.0);

        // Determine status based on recent activity
        const lastVisitDate = customer.lastVisit ? new Date(customer.lastVisit) : null;
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

        customer.status = lastVisitDate && lastVisitDate > threeMonthsAgo ? 'active' : 'inactive';
      });

      return Array.from(customerMap.values()).sort((a, b) => b.totalBookings - a.totalBookings);
    } catch (error: any) {
      logger.error('Error fetching salon customers:', error);
      throw new Error(extractErrorMessage(error));
    }
  },

  /**
   * Get payment configuration
   */
  async getPaymentConfig(): Promise<PaymentConfig> {
    try {
      const response = await api.get<{ data: PaymentConfig }>('/bookings/payment-config');
      return response.data.data;
    } catch (error: any) {
      logger.error('Error fetching payment config:', error);
      // Return default configuration if API fails
      return {
        paymentRequired: true,
        paymentGatewayEnabled: true,
        paymentTimeoutMinutes: 15,
        supportedPaymentMethods: ['razorpay', 'cash'],
        skipPaymentDialog: false,
        directToRazorpay: true,
      };
    }
  }
};
