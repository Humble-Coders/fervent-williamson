import { categoryService, ServiceCategory } from './categoryService';
import { logger } from '@/config/logger';

// Re-export types with salon-specific naming for backward compatibility
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

/**
 * Convert a ServiceCategory to SalonServiceCategory format
 */
function toSalonCategory(cat: ServiceCategory): SalonServiceCategory {
  return {
    id: cat.id,
    name: cat.name,
    icon: cat.icon,
    emoji: cat.emoji,
    color: cat.color,
    description: cat.description,
    isGlobal: true,
    createdAt: cat.createdAt,
  };
}

export const salonCategoryService = {
  // Get all categories available to a salon (global + salon-specific)
  async getAvailableCategories(): Promise<SalonServiceCategory[]> {
    try {
      const categories = await categoryService.getAllCategories();
      return categories.map(toSalonCategory);
    } catch (error: any) {
      logger.error('Failed to fetch categories:', error);
      throw new Error(error.message || 'Failed to fetch categories');
    }
  },

  // Get only salon-specific categories
  async getSalonCategories(): Promise<SalonServiceCategory[]> {
    try {
      const categories = await categoryService.getAllCategories();
      return categories.map(toSalonCategory);
    } catch (error: any) {
      logger.error('Failed to fetch salon categories:', error);
      throw new Error(error.message || 'Failed to fetch salon categories');
    }
  },

  // Create a new salon-specific category
  async createCategory(categoryData: CreateSalonCategoryData): Promise<SalonServiceCategory> {
    try {
      const created = await categoryService.createCategory({
        ...categoryData,
        isDashboardVisible: true,
        dashboardSortOrder: 0,
      } as any);
      return toSalonCategory(created);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create category');
    }
  },

  // Update a salon-specific category
  async updateCategory(id: string, categoryData: Partial<CreateSalonCategoryData>): Promise<SalonServiceCategory> {
    try {
      const updated = await categoryService.updateCategory(id, categoryData as any);
      return toSalonCategory(updated);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update category');
    }
  },

  // Delete a salon-specific category
  async deleteCategory(id: string): Promise<void> {
    try {
      await categoryService.deleteCategory(id);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete category');
    }
  },
};
