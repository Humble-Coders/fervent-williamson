import { apiClient } from './api';
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

class SalonDashboardService {
  private baseUrl = '/salon/dashboard';

  /**
   * Get salon dashboard statistics
   */
  async getDashboardStats(): Promise<SalonDashboardData> {
    try {
      logger.info('🔄 Fetching salon dashboard stats...');
      const response = await apiClient.get<SalonDashboardData>(`${this.baseUrl}/stats`);
      logger.info('📊 Dashboard stats loaded:', response.data);
      return response.data!;
    } catch (error) {
      logger.error('❌ Error fetching dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get salon insights with optional date range filtering
   */
  async getInsights(startDate?: string, endDate?: string): Promise<SalonInsights> {
    try {
      logger.info('🔄 Fetching salon insights...', { startDate, endDate });
      const params: { startDate?: string; endDate?: string } = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await apiClient.get<SalonInsights>(`${this.baseUrl}/insights`, { params });
      logger.info('📊 Insights loaded:', response.data);
      return response.data!;
    } catch (error) {
      logger.error('❌ Error fetching insights:', error);
      throw error;
    }
  }
}

export const salonDashboardService = new SalonDashboardService();

