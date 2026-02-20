import { BaseService } from './BaseService';
import { apiClient } from './api';
import { env } from '../config/env';
import {
  Salon,
  SalonWithRelations,
  SalonBookingConfig,
  CreateSalonData,
  WorkingHours,
  Service as SalonService,
  Stylist
} from '../types';
import { ApiResponse, SalonListParams } from '../types/api';

// Re-export types for backward compatibility
export type { WorkingHours, SalonService as Service, Stylist, CreateSalonData };

/**
 * Salon service with specialized salon operations
 */
class SalonServiceClass extends BaseService<Salon, CreateSalonData, Partial<CreateSalonData>> {
  constructor() {
    super('/salons');
  }

  /**
   * Upload salon images
   */
  async uploadImages(files: File[]): Promise<string[]> {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    const response = await apiClient.post<{ images: string[] }>('/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Convert relative URLs to absolute URLs
    const backendBaseUrl = env.BACKEND_BASE_URL;
    const absoluteUrls = response.data!.images.map(url => {
      if (url.startsWith('http')) {
        return url; // Already absolute
      }
      return `${backendBaseUrl}${url}`; // Convert relative to absolute
    });

    return absoluteUrls;
  }

  /**
   * Get featured salons
   */
  async getFeatured(): Promise<Salon[]> {
    const response = await apiClient.get<Salon[]>('/salons/featured');
    return response.data!;
  }

  /**
   * Get salons with advanced filtering
   */
  async getWithFilters(params: SalonListParams): Promise<ApiResponse<Salon[]>> {
    return this.getAll(params as any);
  }

  /**
   * Get salon by display ID (user-friendly ID)
   */
  async getByDisplayId(displayId: number): Promise<Salon> {
    const response = await apiClient.get<Salon>(`/salons/display/${displayId}`);
    return response.data!;
  }

  /**
   * Get salon with all related data
   */
  async getWithRelations(id: string | number): Promise<SalonWithRelations> {
    const response = await apiClient.get<SalonWithRelations>(`/salons/${id}?include=services,stylists,reviews,owner`);
    return response.data!;
  }

  /**
   * Search salons by location
   */
  async searchByLocation(
    latitude: number,
    longitude: number,
    radius: number = 10,
    params?: Record<string, any>
  ): Promise<Salon[]> {
    const response = await apiClient.get<Salon[]>('/salons/nearby', {
      params: {
        lat: latitude,
        lng: longitude,
        radius,
        ...params,
      },
    });
    return response.data!;
  }

  /**
   * Get salon availability for a specific date
   */
  async getAvailability(
    salonId: string | number,
    date: string,
    serviceId?: string
  ): Promise<{
    date: string;
    availableSlots: Array<{
      time: string;
      available: boolean;
      stylistId?: string;
      stylistName?: string;
    }>;
  }> {
    const response = await apiClient.get<{
      date: string;
      availableSlots: Array<{
        time: string;
        available: boolean;
        stylistId?: string;
        stylistName?: string;
      }>;
    }>(`/salons/${salonId}/availability`, {
      params: { date, serviceId },
    });
    return response.data!;
  }

  /**
   * Get salon services
   */
  async getServices(salonId: string | number): Promise<any[]> {
    return this.getRelated(salonId, 'services') as any;
  }

  /**
   * Get salon stylists
   */
  async getStylists(salonId: string | number): Promise<any[]> {
    return this.getRelated(salonId, 'stylists') as any;
  }

  /**
   * Get salon reviews
   */
  async getReviews(salonId: string | number, params?: Record<string, any>): Promise<any[]> {
    return this.getRelated(salonId, 'reviews', params) as any;
  }

  /**
   * Get salon analytics
   */
  async getAnalytics(
    salonId: string | number,
    period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<{
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    popularServices: Array<{
      serviceId: string;
      serviceName: string;
      bookingCount: number;
    }>;
    revenueByDay: Array<{
      date: string;
      revenue: number;
    }>;
  }> {
    const response = await apiClient.get<{
      totalBookings: number;
      totalRevenue: number;
      averageRating: number;
      popularServices: Array<{
        serviceId: string;
        serviceName: string;
        bookingCount: number;
      }>;
      revenueByDay: Array<{
        date: string;
        revenue: number;
      }>;
    }>(`/salons/${salonId}/analytics`, {
      params: { period },
    });
    return response.data!;
  }

  /**
   * Toggle salon featured status
   */
  async toggleFeatured(salonId: string | number): Promise<Salon> {
    const response = await apiClient.patch<Salon>(`/salons/${salonId}/toggle-featured`);
    return response.data!;
  }

  /**
   * Get similar salons
   */
  async getSimilar(salonId: string | number, limit: number = 5): Promise<Salon[]> {
    const response = await apiClient.get<Salon[]>(`/salons/${salonId}/similar`, {
      params: { limit },
    });
    return response.data!;
  }

  // Backward compatibility methods
  async getAllSalons(): Promise<Salon[]> {
    const response = await this.getAll();
    return response.data!;
  }

  async getSalonById(id: string): Promise<Salon> {
    // Use the complete endpoint to get salon with all images (salon, services, stylists)
    const response = await apiClient.get<Salon>(`/salons/${id}/complete`);
    return response.data!;
  }

  async createSalon(salonData: CreateSalonData): Promise<Salon> {
    const response = await this.create(salonData);
    return response.data!;
  }

  async updateSalon(id: string, salonData: Partial<CreateSalonData>): Promise<Salon> {
    const response = await this.update(id, salonData);
    return response.data!;
  }

  async deleteSalon(id: string): Promise<void> {
    await this.delete(id);
  }
}

// Create and export the service instance
export const salonService = new SalonServiceClass();
export default salonService;
