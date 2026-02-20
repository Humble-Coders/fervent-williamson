import { BaseService } from './BaseService';
import { logger } from '@/config/logger';
import { apiClient } from './api';
import { env } from '../config/env';
import {
  Salon,
  SalonWithRelations,
  CreateSalonData,
  WorkingHours,
  Service as SalonService,
  Stylist
} from '../types';
import { ApiResponse, SalonListParams } from '../types/api';

// Re-export types for backward compatibility
export type { WorkingHours, SalonService as Service, Stylist, CreateSalonData };

/**
 * Admin salon service with specialized admin salon operations
 * Uses the admin endpoints for salon management
 */
class AdminSalonServiceClass extends BaseService<Salon, CreateSalonData> {
  constructor() {
    // Use admin endpoint instead of public salon endpoint
    super('/admin/salons');
  }

  /**
   * Upload images with organized folder structure
   */
  async uploadImages(files: File[], context?: {
    type: 'salon' | 'service' | 'stylist' | 'temp';
    salonId: string;
    entityId?: string; // For service/stylist uploads
  }): Promise<string[]> {
    logger.info('🔄 [FRONTEND] uploadImages called with:', {
      fileCount: files.length,
      fileNames: files.map(f => f.name),
      context
    });

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });

    // Build query parameters for organized uploads
    let url = '/upload/images';
    if (context) {
      const params = new URLSearchParams({
        type: context.type,
        salonId: context.salonId,
      });
      if (context.entityId) {
        params.append('entityId', context.entityId);
      }
      url += `?${params.toString()}`;
    }

    logger.info('📡 [FRONTEND] Making upload request to:', url);

    const response = await apiClient.post<{ images: string[] }>(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    logger.info('📥 [FRONTEND] Upload response:', response.data);

    // Convert relative URLs to absolute URLs
    const backendBaseUrl = env.BACKEND_BASE_URL;
    const absoluteUrls = response.data!.images.map(url => {
      if (url.startsWith('http')) {
        return url; // Already absolute
      }
      return `${backendBaseUrl}${url}`; // Convert relative to absolute
    });

    logger.info('✅ [FRONTEND] Final absolute URLs:', absoluteUrls);
    return absoluteUrls;
  }

  /**
   * Upload images to temp folder (for new services/stylists before creation)
   */
  async uploadTempImages(files: File[]): Promise<string[]> {
    logger.info('🔄 [FRONTEND] uploadTempImages called with files:', { files: files.map(f => ({ name: f.name, size: f.size })) });
    const result = await this.uploadImages(files, { type: 'temp', salonId: '', entityId: '' });
    logger.info('✅ [FRONTEND] uploadTempImages result:', result);
    return result;
  }

  /**
   * Organize temp images into proper folder structure after entity creation
   */
  async organizeImages(tempUrls: string[], type: 'service' | 'stylist', salonId: string, entityId: string): Promise<string[]> {
    const response = await apiClient.post<{ organizedUrls: string[] }>('/upload/organize', {
      type,
      salonId,
      entityId,
      tempUrls,
    });

    return response.data!.organizedUrls;
  }

  /**
   * Get all salons for admin (uses admin endpoint)
   */
  async getAllSalons(params?: SalonListParams): Promise<SalonWithRelations[]> {
    const response = await apiClient.get<{ salons: SalonWithRelations[] }>('/admin/salons', { params });
    return response.data!.salons;
  }

  /**
   * Get salon by ID (uses public endpoint since admin can access any salon)
   */
  async getSalonById(id: string): Promise<SalonWithRelations> {
    const response = await apiClient.get<SalonWithRelations>(`/salons/${id}`);
    return response.data!;
  }

  /**
   * Get salon with complete data including all images (salon, services, stylists)
   */
  async getSalonComplete(id: string): Promise<SalonWithRelations> {
    const response = await apiClient.get<SalonWithRelations>(`/salons/${id}/complete`);
    return response.data!;
  }

  /**
   * Create salon (uses public endpoint)
   */
  async createSalon(salonData: CreateSalonData): Promise<Salon> {
    logger.info('🔄 [FRONTEND] createSalon called with data:', {
      ...salonData,
      services: salonData.services?.map(s => ({
        name: s.name,
        imageCount: s.images?.length || 0,
        images: s.images
      }))
    });
    const response = await apiClient.post<Salon>('/salons', salonData);
    logger.info('✅ [FRONTEND] createSalon response:', response.data);
    return response.data!;
  }

  /**
   * Update salon (uses admin endpoint)
   */
  async updateSalon(id: string, salonData: Partial<CreateSalonData>): Promise<Salon> {
    const response = await apiClient.patch<Salon>(`/admin/salons/${id}`, salonData);
    return response.data!;
  }

  /**
   * Delete salon (uses admin endpoint)
   */
  async deleteSalon(id: string): Promise<void> {
    await apiClient.delete<void>(`/admin/salons/${id}`);
  }

  /**
   * Toggle salon featured status (admin only)
   */
  async toggleFeatured(salonId: string | number): Promise<Salon> {
    const response = await apiClient.patch<Salon>(`/admin/salons/${salonId}`, { 
      featured: true // This would need to be determined by current state
    });
    return response.data!;
  }

  /**
   * Get salon statistics (admin only)
   */
  async getSalonStats(salonId: string): Promise<any> {
    const response = await apiClient.get<any>(`/admin/stats/salons/${salonId}`);
    return response.data!;
  }

  /**
   * Approve salon (admin only)
   */
  async approveSalon(salonId: string): Promise<Salon> {
    const response = await apiClient.patch<Salon>(`/admin/salons/${salonId}`, { 
      isApproved: true 
    });
    return response.data!;
  }

  /**
   * Suspend salon (admin only)
   */
  async suspendSalon(salonId: string, reason?: string): Promise<Salon> {
    const response = await apiClient.patch<Salon>(`/admin/salons/${salonId}`, {
      isOpen: false,
      suspensionReason: reason
    });
    return response.data!;
  }

  /**
   * Create service (admin only)
   */
  async createService(serviceData: any): Promise<any> {
    const response = await apiClient.post<any>('/services', serviceData);
    return response.data!;
  }

  /**
   * Update service (admin only)
   */
  async updateService(serviceId: string, serviceData: any): Promise<any> {
    const response = await apiClient.put<any>(`/services/${serviceId}`, serviceData);
    return response.data!;
  }


}

// Create and export the admin service instance
export const adminSalonService = new AdminSalonServiceClass();
export default adminSalonService;
