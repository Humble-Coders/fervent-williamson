import { api } from './api';
import { logger } from '@/config/logger';

export interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  emoji: string;
  color: string;
  description?: string;
  isDashboardVisible?: boolean;
  dashboardSortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceCategoryWithServices extends ServiceCategory {
  services: {
    id: string;
    name: string;
    description: string;
    duration: number;
    price: number;
    salon: {
      id: string;
      name: string;
      rating: number;
      featured: boolean;
      isOpen: boolean;
    };
  }[];
}

export interface ServiceCategoryWithSalon extends ServiceCategory {
  isGlobal: boolean;
  salonDisplayId?: number;
  salon?: {
    id: string;
    name: string;
    displayId: number;
  };
  _count: {
    services: number;
  };
}

interface CategoriesResponse {
  success: boolean;
  data: ServiceCategory[];
  message: string;
}

interface CategoryResponse {
  success: boolean;
  data: ServiceCategoryWithServices;
  message: string;
}

interface CategoriesWithSalonResponse {
  success: boolean;
  data: ServiceCategoryWithSalon[];
  message: string;
}

export const categoryService = {
  // Get all service categories
  async getAllCategories(): Promise<ServiceCategory[]> {
    try {
      const response = await api.get<CategoriesResponse>('/categories');
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Get all service categories (global + salon-specific) for admin
  async getAllCategoriesForAdmin(search?: string, type?: 'global' | 'salon'): Promise<ServiceCategoryWithSalon[]> {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (type) params.append('type', type);

      const response = await api.get<CategoriesWithSalonResponse>(`/categories/all?${params.toString()}`);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch categories');
    }
  },

  // Get category by ID with services
  async getCategoryById(id: string): Promise<ServiceCategoryWithServices> {
    try {
      const response = await api.get<CategoryResponse>(`/categories/${id}`);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch category');
    }
  },

  // Create new category (Admin only)
  async createCategory(categoryData: Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceCategory> {
    try {
      const response = await api.post<CategoryResponse>('/categories', categoryData);
      return (response.data as any).data as ServiceCategory;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create category');
    }
  },

  // Update category (Admin only)
  async updateCategory(id: string, categoryData: Partial<Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ServiceCategory> {
    try {
      const response = await api.put<CategoryResponse>(`/categories/${id}`, categoryData);
      return (response.data as any).data as ServiceCategory;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update category');
    }
  },

  // Delete category (Admin only)
  async deleteCategory(id: string): Promise<void> {
    try {
      await api.delete(`/categories/${id}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete category');
    }
  },

  // Get visible categories for dashboard based on configuration
  async getVisibleCategories(): Promise<ServiceCategory[]> {
    try {
      // Use the new dashboardVisible query parameter to get only visible categories
      const response = await api.get<CategoriesResponse>('/categories?dashboardVisible=true');
      return (response.data as any).data;
    } catch (error: any) {
      logger.error('Error fetching visible categories, falling back to all categories:', error);
      // Final fallback to all global categories
      return this.getAllCategories();
    }
  },

  // Update category dashboard visibility (Admin only)
  async updateCategoryVisibility(id: string, isDashboardVisible: boolean, dashboardSortOrder?: number): Promise<ServiceCategory> {
    try {
      const response = await api.put<CategoryResponse>(`/categories/${id}/visibility`, {
        isDashboardVisible,
        ...(dashboardSortOrder !== undefined && { dashboardSortOrder })
      });
      return (response.data as any).data as ServiceCategory;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update category visibility');
    }
  },

  // Update multiple categories visibility (Admin only)
  async updateBulkVisibility(updates: Array<{id: string, isDashboardVisible: boolean, dashboardSortOrder?: number}>): Promise<ServiceCategory[]> {
    try {
      const response = await api.put('/categories/bulk-visibility', { updates });
      return (response.data as any).data as ServiceCategory[];
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update categories visibility');
    }
  },
};
