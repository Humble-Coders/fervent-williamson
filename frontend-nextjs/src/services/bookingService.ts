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
  getCountFromServer,
} from './firestore/firestoreService';
import { docToObject, type QueryDocumentSnapshot, type PaginatedResult } from './firestore/firestoreService';
import { auth } from '@/config/firebase';
import { logger } from '@/config/logger';

export interface BookingServiceItem {
  serviceId: string;
  subServiceId?: string;
  stylistId?: string;
  quantity?: number;
}

/** Denormalized service line for display (one per service/subservice + quantity). Stored on booking. */
export interface BookingServiceItemDisplay {
  serviceId: string;
  subServiceId?: string;
  serviceName: string;
  subServiceName?: string;
  price: number;
  duration: number;
  quantity: number;
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
  services?: BookingServiceItem[];
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
  /** Denormalized list of all services in this booking (always set for new bookings; optional for legacy). */
  serviceItems?: BookingServiceItemDisplay[];
}

const bookingsFs = new FirestoreService<Booking>('bookings');

export const bookingService = {
  // Get current user's bookings (cursor-based pagination)
  async getUserBookings(options?: {
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot | null;
  }): Promise<{ data: Booking[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const result = await bookingsFs.getPaginated({
        filters: [{ field: 'userId', op: '==', value: user.uid }],
        sort: { field: 'createdAt', direction: 'desc' },
        pageSize: options?.pageSize || 20,
        lastDoc: options?.lastDoc,
      });

      return {
        data: result.data,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch bookings');
    }
  },

  // Create a new booking
  async createBooking(bookingData: CreateBookingData): Promise<Booking> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const hasMultipleServices = Array.isArray(bookingData.services) && bookingData.services.length > 0;

      // Fetch denormalized data
      const [salonDoc, userDoc] = await Promise.all([
        getDoc(doc(db, 'salons', bookingData.salonId)),
        getDoc(doc(db, 'users', user.uid)),
      ]);

      const salonData = salonDoc.data();
      const userData = userDoc.data();

      // Build denormalized serviceItems for display (used by both user and salon)
      let serviceItems: BookingServiceItemDisplay[] = [];

      // Fetch service data from subcollection
      let primaryServiceData: any = {};
      let primaryServiceId: string = bookingData.serviceId || '';
      let totalDuration = 0;
      let totalPrice = 0;
      let normalizedServices: BookingServiceItem[] | null = null;

      if (hasMultipleServices && bookingData.services) {
        // Multi-service booking: fetch all services and build serviceItems
        const serviceDocs = await Promise.all(
          bookingData.services.map((item) =>
            getDoc(doc(db, 'salons', bookingData.salonId, 'services', item.serviceId))
          )
        );

        const servicesData = serviceDocs.map((s) => s.data() || {});

        // Normalize services payload to avoid undefined fields (Firestore does not allow them)
        normalizedServices = bookingData.services.map((item) => ({
          serviceId: item.serviceId,
          ...(item.subServiceId ? { subServiceId: item.subServiceId } : {}),
          ...(item.stylistId ? { stylistId: item.stylistId } : {}),
          quantity: item.quantity && item.quantity > 0 ? item.quantity : 1,
        }));

        bookingData.services.forEach((item, index) => {
          const serviceData = servicesData[index] || {};
          let price = Number(serviceData.price) || 0;
          let duration = Number(serviceData.duration) || 30;
          const serviceName = serviceData.name || '';
          let subServiceName: string | undefined;

          if (item.subServiceId && Array.isArray(serviceData.subServices)) {
            const subService = serviceData.subServices.find(
              (ss: any) => ss.id === item.subServiceId
            );
            if (subService) {
              price = Number(subService.price) || price;
              duration = Number(subService.duration) || duration;
              subServiceName = subService.name;
            }
          }

          const quantity = item.quantity && item.quantity > 0 ? item.quantity : 1;
          totalPrice += price * quantity;
          totalDuration += duration * quantity;

          const displayItem: BookingServiceItemDisplay = {
            serviceId: item.serviceId,
            serviceName,
            price,
            duration,
            quantity,
          };
          if (item.subServiceId) displayItem.subServiceId = item.subServiceId;
          if (subServiceName) displayItem.subServiceName = subServiceName;
          serviceItems.push(displayItem);
        });

        const firstItem = bookingData.services[0];
        primaryServiceId = firstItem.serviceId;
        primaryServiceData = servicesData[0] || {};
      } else if (bookingData.serviceId) {
        // Single-service booking
        const serviceDoc = await getDoc(
          doc(db, 'salons', bookingData.salonId, 'services', bookingData.serviceId)
        );
        primaryServiceData = serviceDoc.data() || {};
        totalDuration = Number(primaryServiceData.duration) || 30;
        totalPrice = Number(primaryServiceData.price) || 0;
        primaryServiceId = bookingData.serviceId;

        let subServiceName: string | undefined;
        let price = Number(primaryServiceData.price) || 0;
        let duration = Number(primaryServiceData.duration) || 30;
        if (bookingData.subServiceId && Array.isArray(primaryServiceData.subServices)) {
          const sub = primaryServiceData.subServices.find(
            (ss: any) => ss.id === bookingData.subServiceId
          );
          if (sub) {
            price = Number(sub.price) || price;
            duration = Number(sub.duration) || duration;
            subServiceName = sub.name;
          }
        }
        const displayItem: BookingServiceItemDisplay = {
          serviceId: bookingData.serviceId,
          serviceName: primaryServiceData.name || '',
          price,
          duration,
          quantity: 1,
        };
        if (bookingData.subServiceId) displayItem.subServiceId = bookingData.subServiceId;
        if (subServiceName) displayItem.subServiceName = subServiceName;
        serviceItems = [displayItem];
      }

      // Generate a simple verification code
      const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      const userCode = Math.random().toString(36).substring(2, 6).toUpperCase();

      const booking: any = {
        userId: user.uid,
        salonId: bookingData.salonId,
        serviceId: primaryServiceId,
        services: normalizedServices,
        stylistId: bookingData.stylistId || null,
        date: bookingData.date,
        time: bookingData.time,
        duration: totalDuration || 30,
        status: 'PENDING',
        totalPrice: totalPrice || 0,
        notes: bookingData.notes || '',
        promoCode: bookingData.promoCode || null,
        discount: 0,
        verificationCode,
        userCode,
        rescheduleCount: 0,
        // Denormalized list for display (no undefined values for Firestore)
        serviceItems: serviceItems.map((item) => {
          const o: Record<string, unknown> = {
            serviceId: item.serviceId,
            serviceName: item.serviceName,
            price: item.price,
            duration: item.duration,
            quantity: item.quantity,
          };
          if (item.subServiceId != null) o.subServiceId = item.subServiceId;
          if (item.subServiceName != null && item.subServiceName !== '') o.subServiceName = item.subServiceName;
          return o;
        }),
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
          id: primaryServiceId || '',
          name: primaryServiceData.name || '',
          description: primaryServiceData.description || '',
          price: primaryServiceData.price || 0,
          duration: primaryServiceData.duration || 30,
          category: primaryServiceData.categoryId || '',
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

  // Get salon's bookings (for salon owners, cursor-based pagination)
  async getSalonBookings(options?: {
    pageSize?: number;
    lastDoc?: QueryDocumentSnapshot | null;
  }): Promise<{ data: Booking[]; lastDoc: QueryDocumentSnapshot | null; hasMore: boolean }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      // Get the owner's salonId
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const salonId = userDoc.data()?.salonId;
      if (!salonId) throw new Error('User does not own a salon');

      const result = await bookingsFs.getPaginated({
        filters: [{ field: 'salonId', op: '==', value: salonId }],
        sort: { field: 'createdAt', direction: 'desc' },
        pageSize: options?.pageSize || 50,
        lastDoc: options?.lastDoc,
      });

      return {
        data: result.data,
        lastDoc: result.lastDoc,
        hasMore: result.hasMore,
      };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch salon bookings');
    }
  },

  /**
   * Get total booking counts per status for the current salon owner (for tab badges).
   * Uses aggregation so counts are correct regardless of pagination.
   */
  async getSalonBookingCounts(): Promise<{ pending: number; confirmed: number; completed: number; cancelled: number }> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const salonId = userDoc.data()?.salonId;
      if (!salonId) throw new Error('User does not own a salon');

      const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;
      const counts = await Promise.all(
        statuses.map(async (status) => {
          const q = query(
            collection(db, 'bookings'),
            where('salonId', '==', salonId),
            where('status', '==', status)
          );
          const snap = await getCountFromServer(q);
          return { status, count: snap.data().count };
        })
      );

      return {
        pending: counts.find(c => c.status === 'PENDING')?.count ?? 0,
        confirmed: counts.find(c => c.status === 'CONFIRMED')?.count ?? 0,
        completed: counts.find(c => c.status === 'COMPLETED')?.count ?? 0,
        cancelled: counts.find(c => c.status === 'CANCELLED')?.count ?? 0,
      };
    } catch (error: any) {
      logger.error('Error fetching salon booking counts:', error);
      return { pending: 0, confirmed: 0, completed: 0, cancelled: 0 };
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

  /**
   * Reschedule a booking:
   * - Always updates date/time
   * - Increments rescheduleCount
   * - If current status is CONFIRMED, change back to PENDING so salon must confirm again
   * - If current status is PENDING, keep it PENDING
   */
  async rescheduleBooking(bookingId: string, date: string, time: string): Promise<Booking> {
    try {
      return await runTransaction(db, async (transaction) => {
        const bookingRef = doc(db, 'bookings', bookingId);
        const snap = await transaction.get(bookingRef);
        if (!snap.exists()) {
          throw new Error('Booking not found');
        }

        const current = snap.data() as any;
        const currentStatus = current.status as Booking['status'];

        if (currentStatus === 'COMPLETED' || currentStatus === 'CANCELLED') {
          throw new Error('This booking cannot be rescheduled');
        }

        const currentCount = Number(current.rescheduleCount || 0);
        const newStatus: Booking['status'] =
          currentStatus === 'CONFIRMED' ? 'PENDING' : currentStatus;

        const updated: Partial<Booking> = {
          date,
          time,
          status: newStatus,
          rescheduleCount: currentCount + 1,
        };

        // If we moved back to PENDING, clear any existing user code so salon can generate a new one
        if (currentStatus === 'CONFIRMED') {
          (updated as any).userCode = null;
        }

        transaction.update(bookingRef, updated as any);
        return { ...(current as any), ...updated } as Booking;
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reschedule booking');
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
    // Allow cancel for any non-completed/non-cancelled booking
    return booking.status !== 'COMPLETED' && booking.status !== 'CANCELLED';
  },

  // Check if booking can be rescheduled
  canRescheduleBooking(booking: Booking, maxRescheduleLimit: number = 3): boolean {
    if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') return false;
    // Respect max reschedule limit but don't block based on time-of-day
    if ((booking.rescheduleCount ?? 0) >= maxRescheduleLimit) return false;
    return true;
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

  // Get salon customers from booking data (fetches all bookings via pagination)
  async getSalonCustomers(): Promise<any[]> {
    try {
      // Fetch all bookings by paginating through
      let allBookings: Booking[] = [];
      let lastDoc: QueryDocumentSnapshot | null = null;
      let hasMore = true;

      while (hasMore) {
        const result = await this.getSalonBookings({ pageSize: 100, lastDoc });
        allBookings = [...allBookings, ...result.data];
        lastDoc = result.lastDoc;
        hasMore = result.hasMore;
      }

      const bookings = allBookings;

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
