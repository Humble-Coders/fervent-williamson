import { apiClient } from './api';
import { logger } from '@/config/logger';
import { env } from '../config/env';
import { Service } from './serviceService';

export interface Stylist {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  images?: string[];
  specialties: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  salonId: string;
  displayId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStylistData {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  serviceIds: string[];
  canDoAllServices: boolean;
  avatar?: string;
  images?: string[];
  experience?: number;
  isActive?: boolean;
}

export interface UpdateStylistData {
  name?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  serviceIds?: string[];
  canDoAllServices?: boolean;
  avatar?: string;
  images?: string[];
  experience?: number;
  isActive?: boolean;
}

class StylistService {
  private baseUrl = `${env.API_URL}/salon/stylists`;

  async getStylists(): Promise<Stylist[]> {
    try {
      logger.info('🔄 Fetching stylists...');
      const response = await apiClient.get(this.baseUrl);
      logger.info('📋 Stylists loaded:', (response as any).data?.data || []);
      return (response as any).data?.data || [];
    } catch (error) {
      logger.error('❌ Error fetching stylists:', error);
      throw error;
    }
  }

  async getStylist(id: string): Promise<Stylist> {
    try {
      logger.info('🔄 Fetching stylist:', id);
      const response = await apiClient.get(`${this.baseUrl}/${id}`);
      logger.info('👤 Stylist loaded:', (response as any).data?.data);
      return (response as any).data?.data;
    } catch (error) {
      logger.error('❌ Error fetching stylist:', error);
      throw error;
    }
  }

  async createStylist(data: CreateStylistData): Promise<Stylist> {
    try {
      logger.info('🔄 Creating stylist:', data);
      const response = await apiClient.post(this.baseUrl, data);
      logger.info('✅ Stylist created:', (response as any).data?.data);
      return (response as any).data?.data;
    } catch (error) {
      logger.error('❌ Error creating stylist:', error);
      throw error;
    }
  }

  async updateStylist(id: string, data: UpdateStylistData): Promise<Stylist> {
    try {
      logger.info('🔄 Updating stylist:', { id, data });
      const response = await apiClient.put(`${this.baseUrl}/${id}`, data);
      logger.info('✅ Stylist updated:', (response as any).data?.data);
      return (response as any).data?.data;
    } catch (error) {
      logger.error('❌ Error updating stylist:', error);
      throw error;
    }
  }

  async deleteStylist(id: string): Promise<void> {
    try {
      logger.info('🔄 Deleting stylist:', id);
      await apiClient.delete(`${this.baseUrl}/${id}`);
      logger.info('✅ Stylist deleted');
    } catch (error) {
      logger.error('❌ Error deleting stylist:', error);
      throw error;
    }
  }

  async toggleStylistStatus(id: string, isActive: boolean): Promise<Stylist> {
    try {
      logger.info('🔄 Toggling stylist status:', { id, isActive });
      const response = await apiClient.patch(`${this.baseUrl}/${id}/status`, { isActive });
      logger.info('✅ Stylist status updated:', (response as any).data?.data);
      return (response as any).data?.data;
    } catch (error) {
      logger.error('❌ Error toggling stylist status:', error);
      throw error;
    }
  }
}

export const stylistService = new StylistService();

// Helper function to get services for stylist assignment
export const getSalonServices = async (): Promise<Service[]> => {
  try {
    logger.info('🔄 Fetching salon services for stylist assignment...');
    const response = await apiClient.get(`${env.API_URL}/salon/services`);
    logger.info('📋 Services loaded for stylist assignment:', (response as any).data?.data || []);
    return (response as any).data?.data || [];
  } catch (error) {
    logger.error('❌ Error fetching salon services:', error);
    throw error;
  }
};
