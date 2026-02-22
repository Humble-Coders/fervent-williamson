import {
  FirestoreService,
  db,
  writeBatch,
  doc,
  runTransaction,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  getDoc,
} from './firestore/firestoreService';
import { docToObject } from './firestore/firestoreService';
import { auth } from '@/config/firebase';
import { logger } from '@/config/logger';

export interface BookingServiceItem {
  serviceId: string;
  subServiceId?: string;
  stylistId?: string;
}

export interface CreateBookingData {
  salonId: string;
  serviceId?: string;
  subServiceId?: string;
  stylistId?: string;
  services?: BookingServiceItem[];
  date: string;
  time: string;
  notes?: string;
  promoCode?: string;
}

export interface UpdateBookingData {
  date?: string;
  time?: string;
  status?: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes?: string;
  rescheduleCount?: number;
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
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  totalPrice: number;
  notes?: string;
  promoCode?: string;
  discount: number;
  verificationCode?: string;
  userCode?: string;
  rescheduleCount: number;
  createdAt: string;
  updatedAt: string;
  // Denormalized data
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
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
}

const bookingsFs = new FirestoreService<Booking>('bookings');

export const bookingService = {
  // Get current user's bookings
  async getUserBookings(): Promise<Booking[]> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const q = query(
        collection(db, 'bookings'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToObject<Booking>(d));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch bookings');
    }
  },

  // Create a new booking
  async createBooking(bookingData: CreateBookingData): Promise<Booking> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Fetch denormalized data
      const [salonDoc, userDoc] = await Promise.all([
        getDoc(doc(db, 'salons', bookingData.salonId)),
        getDoc(doc(db, 'users', user.uid)),
      ]);

      const salonData = salonDoc.data();
      const userData = userDoc.data();

      // Fetch service data from subcollection
      let serviceData: any = {};
      if (bookingData.serviceId) {
        const serviceDoc = await getDoc(
          doc(db, 'salons', bookingData.salonId, 'services', bookingData.serviceId)
        );
        serviceData = serviceDoc.data() || {};
      }

      // Generate a simple verification code
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const userCode = Math.random().toString(36).substring(2, 6).toUpperCase();

      const booking: any = {
        userId: user.uid,
        salonId: bookingData.salonId,
        serviceId: bookingData.serviceId || '',
        stylistId: bookingData.stylistId || null,
        date: bookingData.date,
        time: bookingData.time,
        duration: serviceData.duration || 30,
        status: 'PENDING',
        totalPrice: serviceData.price || 0,
        notes: bookingData.notes || '',
        promoCode: bookingData.promoCode || null,
        discount: 0,
        verificationCode,
        userCode,
        rescheduleCount: 0,
        // Denormalized salon data
        salon: {
          id: bookingData.salonId,
          name: salonData?.name || '',
          address: salonData?.address || '',
          phone: salonData?.phone || '',
          images: salonData?.images || [],
        },
        // Denormalized service data
        service: {
          id: bookingData.serviceId || '',
          name: serviceData.name || '',
          description: serviceData.description || '',
          price: serviceData.price || 0,
          duration: serviceData.duration || 30,
          category: serviceData.categoryId || '',
        },
        // Denormalized user data
        user: {
          id: user.uid,
          name: userData?.name || '',
          email: userData?.email || user.email || '',
          phone: userData?.phone || '',
        },
      };

      // Handle stylist denormalization
      if (bookingData.stylistId) {
        const stylistDoc = await getDoc(
          doc(db, 'salons', bookingData.salonId, 'stylists', bookingData.stylistId)
        );
        const stylistData = stylistDoc.data();
        if (stylistData) {
          booking.stylist = {
            id: bookingData.stylistId,
            name: stylistData.name || '',
            avatar: stylistData.avatar || null,
            specialties: stylistData.specialties || [],
          };
        }
      }

      return await bookingsFs.create(booking);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create booking');
    }
  },

  // Get salon's bookings (for salon owners)
  async getSalonBookings(): Promise<{ data: Booking[] }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Get the owner's salonId
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const salonId = userDoc.data()?.salonId;
      if (!salonId) throw new Error('User does not own a salon');

      const q = query(
        collection(db, 'bookings'),
        where('salonId', '==', salonId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((d) => docToObject<Booking>(d));
      return { data };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch salon bookings');
    }
  },

  // Get booking by ID
  async getBookingById(bookingId: string): Promise<Booking> {
    try {
      return await bookingsFs.getById(bookingId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch booking');
    }
  },

  // Update a booking
  async updateBooking(bookingId: string, bookingData: UpdateBookingData): Promise<Booking> {
    try {
      return await bookingsFs.update(bookingId, bookingData as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update booking');
    }
  },

  // Cancel a booking
  async cancelBooking(bookingId: string): Promise<Booking> {
    try {
      return await bookingsFs.update(bookingId, { status: 'CANCELLED' } as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to cancel booking');
    }
  },

  // Salon confirms booking and generates user code
  async confirmBooking(bookingId: string): Promise<Booking> {
    try {
      const userCode = Math.random().toString(36).substring(2, 6).toUpperCase();
      return await bookingsFs.update(bookingId, { status: 'CONFIRMED', userCode } as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to confirm booking');
    }
  },

  // Salon completes booking using user code
  async completeBooking(bookingId: string, userCode: string): Promise<Booking> {
    try {
      const booking = await bookingsFs.getById(bookingId);
      if (booking.userCode !== userCode) {
        throw new Error('Invalid user code');
      }
      return await bookingsFs.update(bookingId, { status: 'COMPLETED' } as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to complete booking');
    }
  },

  // Validate promo code
  validatePromoCode(promoCode: string): { isValid: boolean; discount: number } {
    const validPromoCodes: { [key: string]: number } = {
      'SAVE10': 10,
      'FIRST20': 20,
      'WELCOME15': 15,
    };
    const discount = validPromoCodes[promoCode.toUpperCase()] || 0;
    return { isValid: discount > 0, discount };
  },

  // Calculate total price with discount
  calculateTotalPrice(basePrice: number, discountPercent: number): { totalPrice: number; discount: number } {
    const discount = (basePrice * discountPercent) / 100;
    const totalPrice = basePrice - discount;
    return { totalPrice: Math.max(0, totalPrice), discount };
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
        hour12: true,
      });
    } catch {
      return `${date} at ${time}`;
    }
  },

  // Get booking status color for UI
  getBookingStatusColor(status: string): string {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'CONFIRMED': return 'text-green-600 bg-green-100';
      case 'COMPLETED': return 'text-blue-600 bg-blue-100';
      case 'CANCELLED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  },

  // Check if booking can be cancelled
  canCancelBooking(booking: Booking): boolean {
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') return false;
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    return bookingDateTime > twoHoursFromNow;
  },

  // Check if booking can be rescheduled
  canRescheduleBooking(booking: Booking, maxRescheduleLimit: number = 3): boolean {
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') return false;
    if (booking.rescheduleCount >= maxRescheduleLimit) return false;
    const bookingDateTime = new Date(`${booking.date}T${booking.time}`);
    const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000);
    return bookingDateTime > fourHoursFromNow;
  },

  // Generate available time slots
  generateTimeSlots(startHour: number = 9, endHour: number = 18, intervalMinutes: number = 30): string[] {
    const slots: string[] = [];
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += intervalMinutes) {
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  },

  // Check if a date is available
  isDateAvailable(date: string): boolean {
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return selectedDate >= today;
  },

  // Get salon customers from booking data
  async getSalonCustomers(): Promise<any[]> {
    try {
      const bookingsResponse = await this.getSalonBookings();
      const bookings = bookingsResponse.data || [];

      if (!bookings || bookings.length === 0) return [];

      const customerMap = new Map();

      bookings.forEach((booking: any) => {
        if (!booking.user || !booking.user.id) return;
        const customerId = booking.user.id;

        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: booking.user.name || 'Unknown Customer',
            email: booking.user.email || 'No email',
            phone: booking.user.phone || null,
            avatar: null,
            totalBookings: 0,
            totalSpent: 0.0,
            lastVisit: null,
            rating: 0.0,
            status: 'active',
            joinedDate: booking.createdAt,
            bookings: [],
          });
        }

        const customer = customerMap.get(customerId);
        customer.totalBookings += 1;
        customer.totalSpent += Number(booking.totalPrice) || 0;
        customer.bookings.push(booking);

        if (!customer.lastVisit || new Date(booking.date) > new Date(customer.lastVisit)) {
          customer.lastVisit = booking.date;
        }
        if (new Date(booking.createdAt) < new Date(customer.joinedDate)) {
          customer.joinedDate = booking.createdAt;
        }
      });

      customerMap.forEach((customer) => {
        const baseRating = 4.0;
        const bookingBonus = Math.min(customer.totalBookings * 0.1, 0.8);
        customer.rating = Math.min(baseRating + bookingBonus, 5.0);

        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        const lastVisitDate = customer.lastVisit ? new Date(customer.lastVisit) : null;
        customer.status = lastVisitDate && lastVisitDate > threeMonthsAgo ? 'active' : 'inactive';
      });

      return Array.from(customerMap.values()).sort((a, b) => b.totalBookings - a.totalBookings);
    } catch (error: any) {
      logger.error('Error fetching salon customers:', error);
      throw new Error(error.message || 'Failed to fetch customers');
    }
  },
};
