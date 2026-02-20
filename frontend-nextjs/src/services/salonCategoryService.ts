import { apiClient } from './api';
import { logger } from '@/config/logger';

export interface SalonServiceCategory {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  color: string;
  description?: string;
  isGlobal: boolean;
  salonId?: string;
  createdAt: string;
}

export interface CreateSalonCategoryData {
  name: string;
  icon: string;
  emoji: string;
  color: string;
  description?: string;
}

interface CategoriesResponse {
  success: boolean;
  data: SalonServiceCategory[];
  message: string;
}

interface CategoryResponse {
  success: boolean;
  data: SalonServiceCategory;
  message: string;
}

export const salonCategoryService = {
  // Get all categories available to a salon (global + salon-specific)
  async getAvailableCategories(): Promise<SalonServiceCategory[]> {
    try {
      // Add cache-busting parameter to force fresh data (using new parameter name to avoid cached CORS failures)
      const cacheBuster = Date.now();
      logger.info('🔄 Fetching categories with NEW cache buster:', cacheBuster);

      const response = await apiClient.get(`/salon/categories?v=${cacheBuster}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
          // Removed all custom headers to avoid CORS preflight cache issues
        }
      });

      logger.info('🏷️ Raw response:', response);
      logger.info('🏷️ Response status:', (response as any).status);
      logger.info('🏷️ Response data:', response.data);

      // Extract categories from response
      let categories: SalonServiceCategory[] = [];

      if (response.data && typeof response.data === 'object') {
        if ((response.data as any).success && Array.isArray((response.data as any).data)) {
          categories = (response.data as any).data;
          logger.info('✅ Found categories in response.data.data:', categories.length);
        } else if (Array.isArray(response.data)) {
          categories = response.data;
          logger.info('✅ Found categories in response.data:', categories.length);
        } else {
          logger.warn('⚠️ Unexpected response structure:', response.data);
          categories = [];
        }
      } else {
        logger.warn('⚠️ Invalid response data:', response.data);
        categories = [];
      }

      logger.info('🏷️ Final categories:', categories);
      return categories;
    } catch (error: any) {
      logger.error('❌ Failed to fetch categories:', error);
      logger.error('❌ Error details:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Get only salon-specific categories
  async getSalonCategories(): Promise<SalonServiceCategory[]> {
    try {
      const response = await apiClient.get<CategoriesResponse>('/salon/categories/custom');

      // Handle different response structures
      let categories: SalonServiceCategory[] = [];

      if (response.data && typeof response.data === 'object') {
        if ((response.data as any).success && Array.isArray((response.data as any).data)) {
          // Standard API response: {success: true, data: [...]}
          categories = (response.data as any).data;
        } else if (Array.isArray(response.data)) {
          // Direct array response: [...]
          categories = response.data;
        } else {
          logger.warn('⚠️ Unexpected response structure:', response.data);
          categories = [];
        }
      } else {
        logger.warn('⚠️ Invalid response data:', response.data);
        categories = [];
      }

      return categories;
    } catch (error: any) {
      logger.error('❌ Failed to fetch salon categories:', error);
      logger.error('❌ Error details:', error.response?.data);
      throw new Error(error.response?.data?.message || 'Failed to fetch salon categories');
    }
  },

  // Create a new salon-specific category
  async createCategory(categoryData: CreateSalonCategoryData): Promise<SalonServiceCategory> {
    try {
      const response = await apiClient.post<CategoryResponse>('/salon/categories', categoryData);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
  },

  // Update a salon-specific category
  async updateCategory(id: string, categoryData: Partial<CreateSalonCategoryData>): Promise<SalonServiceCategory> {
    try {
      const response = await apiClient.put<CategoryResponse>(`/salon/categories/${id}`, categoryData);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update category');
    }
  },

  // Delete a salon-specific category
  async deleteCategory(id: string): Promise<void> {
    try {
      await apiClient.delete(`/salon/categories/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
  },
};
