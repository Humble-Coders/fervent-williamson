import {
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  getDoc,
} from './firestore/firestoreService';
import { docToObject } from './firestore/firestoreService';
import { auth } from '@/config/firebase';
import { logger } from '@/config/logger';

export interface DashboardStats {
  todaysBookings: number;
  activeCustomers: number;
  todaysRevenue: number;
  avgServiceTime: number;
}

export interface UpcomingBooking {
  id: string;
  time: string;
  customerName: string;
  serviceName: string;
  duration: number;
}

export interface SalonDashboardData {
  stats: DashboardStats;
  upcomingBookings: UpcomingBooking[];
}

export interface TopService {
  serviceName: string;
  price: number;
  bookingCount: number;
}

export interface BookingsByStatus {
  status: string;
  count: number;
}

export interface SalonInsights {
  totalBookings: number;
  completedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  avgBookingValue: number;
  completionRate: number;
  topServices: TopService[];
  bookingsByStatus: BookingsByStatus[];
  dateRange: {
    startDate: string | null;
    endDate: string | null;
    isAllTime: boolean;
  };
}

/**
 * Get the current user's salonId
 */
async function getOwnerSalonId(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const salonId = userDoc.data()?.salonId;
  if (!salonId) throw new Error('User does not own a salon');
  return salonId;
}

class SalonDashboardService {
  /**
   * Get salon dashboard statistics
   */
  async getDashboardStats(): Promise<SalonDashboardData> {
    try {
      logger.info('Fetching salon dashboard stats...');
      const salonId = await getOwnerSalonId();

      // Get today's date range
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0];

      // Get today's bookings
      const todayBookingsQuery = query(
        collection(db, 'bookings'),
        where('salonId', '==', salonId),
        where('date', '==', startOfDay)
      );
      const todayBookingsSnap = await getDocs(todayBookingsQuery);
      const todayBookings = todayBookingsSnap.docs.map((d) => d.data());

      // Calculate stats
      const todaysRevenue = todayBookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

      const avgServiceTime = todayBookings.length > 0
        ? todayBookings.reduce((sum, b) => sum + (Number(b.duration) || 30), 0) / todayBookings.length
        : 0;

      // Unique customers today
      const uniqueCustomers = new Set(todayBookings.map((b) => b.userId));

      // Upcoming bookings (today, not completed/cancelled)
      const upcomingBookings: UpcomingBooking[] = todayBookings
        .filter((b) => b.status !== 'COMPLETED' && b.status !== 'CANCELLED')
        .map((b) => ({
          id: b.id || '',
          time: b.time || '',
          customerName: b.user?.name || 'Unknown',
          serviceName: b.service?.name || 'Unknown Service',
          duration: b.duration || 30,
        }))
        .sort((a, b) => a.time.localeCompare(b.time));

      const stats: DashboardStats = {
        todaysBookings: todayBookings.length,
        activeCustomers: uniqueCustomers.size,
        todaysRevenue,
        avgServiceTime: Math.round(avgServiceTime),
      };

      logger.info('Dashboard stats loaded:', stats);
      return { stats, upcomingBookings };
    } catch (error) {
      logger.error('Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get salon insights with optional date range filtering
   */
  async getInsights(startDate?: string, endDate?: string): Promise<SalonInsights> {
    try {
      logger.info('Fetching salon insights...', { startDate, endDate });
      const salonId = await getOwnerSalonId();

      // Query all salon bookings (optionally filtered by date)
      let bookingsQuery;
      if (startDate && endDate) {
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('salonId', '==', salonId),
          where('date', '>=', startDate),
          where('date', '<=', endDate)
        );
      } else {
        bookingsQuery = query(
          collection(db, 'bookings'),
          where('salonId', '==', salonId)
        );
      }

      const bookingsSnap = await getDocs(bookingsQuery);
      const bookings = bookingsSnap.docs.map((d) => d.data());

      const totalBookings = bookings.length;
      const completedBookings = bookings.filter((b) => b.status === 'COMPLETED').length;
      const pendingBookings = bookings.filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED').length;
      const cancelledBookings = bookings.filter((b) => b.status === 'CANCELLED').length;

      const totalRevenue = bookings
        .filter((b) => b.status === 'COMPLETED')
        .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);

      const avgBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;
      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

      // Calculate top services
      const serviceCountMap = new Map<string, { name: string; price: number; count: number }>();
      bookings.forEach((b) => {
        const serviceName = b.service?.name || 'Unknown';
        const existing = serviceCountMap.get(serviceName);
        if (existing) {
          existing.count += 1;
        } else {
          serviceCountMap.set(serviceName, {
            name: serviceName,
            price: b.service?.price || 0,
            count: 1,
          });
        }
      });

      const topServices: TopService[] = Array.from(serviceCountMap.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
        .map((s) => ({
          serviceName: s.name,
          price: s.price,
          bookingCount: s.count,
        }));

      // Bookings by status
      const statusMap = new Map<string, number>();
      bookings.forEach((b) => {
        const status = b.status || 'UNKNOWN';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      const bookingsByStatus: BookingsByStatus[] = Array.from(statusMap.entries()).map(([status, count]) => ({
        status,
        count,
      }));

      const insights: SalonInsights = {
        totalBookings,
        completedBookings,
        pendingBookings,
        cancelledBookings,
        totalRevenue,
        avgBookingValue: Math.round(avgBookingValue * 100) / 100,
        completionRate: Math.round(completionRate * 10) / 10,
        topServices,
        bookingsByStatus,
        dateRange: {
          startDate: startDate || null,
          endDate: endDate || null,
          isAllTime: !startDate && !endDate,
        },
      };

      logger.info('Insights loaded:', insights);
      return insights;
    } catch (error) {
      logger.error('Error fetching insights:', error);
      throw error;
    }
  }
}

export const salonDashboardService = new SalonDashboardService();
