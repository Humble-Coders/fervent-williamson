import {
  FirestoreService,
  SubcollectionService,
  db,
  writeBatch,
  doc,
} from './firestore/firestoreService';
import { auth } from '@/config/firebase';
import { getDoc } from 'firebase/firestore';
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

const categoriesFs = new FirestoreService<ServiceCategory>('serviceCategories');

/**
 * Get the current user's salonId from their Firestore profile
 */
async function getOwnerSalonId(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const salonId = userDoc.data()?.salonId;
  if (!salonId) throw new Error('User does not own a salon');
  return salonId;
}

export const categoryService = {
  // Get all service categories
  async getAllCategories(): Promise<ServiceCategory[]> {
    try {
      return await categoriesFs.getAll({
        sort: { field: 'dashboardSortOrder', direction: 'asc' },
      });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  },

  // Get all service categories for admin
  async getAllCategoriesForAdmin(search?: string, type?: 'global' | 'salon'): Promise<ServiceCategoryWithSalon[]> {
    try {
      const categories = await categoriesFs.getAll({
        sort: { field: 'dashboardSortOrder', direction: 'asc' },
      });

      let filtered = categories as (ServiceCategory & { isGlobal?: boolean })[];

      // Client-side search filter
      if (search) {
        const searchLower = search.toLowerCase();
        filtered = filtered.filter(
          (c) => c.name.toLowerCase().includes(searchLower) || c.description?.toLowerCase().includes(searchLower)
        );
      }

      // Map to ServiceCategoryWithSalon format
      return filtered.map((c) => ({
        ...c,
        isGlobal: true, // All categories in top-level collection are global
        _count: { services: 0 },
      }));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch categories');
    }
  },

  // Get category by ID with services
  async getCategoryById(id: string): Promise<ServiceCategoryWithServices> {
    try {
      const category = await categoriesFs.getById(id);
      // Services would be fetched separately by the consumer
      return { ...category, services: [] };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch category');
    }
  },

  // Create new category (Admin only)
  async createCategory(categoryData: Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceCategory> {
    try {
      return await categoriesFs.create(categoryData as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create category');
    }
  },

  // Update category (Admin only)
  async updateCategory(id: string, categoryData: Partial<Omit<ServiceCategory, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ServiceCategory> {
    try {
      return await categoriesFs.update(id, categoryData as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update category');
    }
  },

  // Delete category (Admin only)
  async deleteCategory(id: string): Promise<void> {
    try {
      await categoriesFs.delete(id);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete category');
    }
  },

  // Get visible categories for dashboard based on configuration
  async getVisibleCategories(): Promise<ServiceCategory[]> {
    try {
      return await categoriesFs.getAll({
        filters: [{ field: 'isDashboardVisible', op: '==', value: true }],
        sort: { field: 'dashboardSortOrder', direction: 'asc' },
      });
    } catch (error: any) {
      logger.error('Error fetching visible categories, falling back to all categories:', error);
      return this.getAllCategories();
    }
  },

  // Update category dashboard visibility (Admin only)
  async updateCategoryVisibility(id: string, isDashboardVisible: boolean, dashboardSortOrder?: number): Promise<ServiceCategory> {
    try {
      const updateData: any = { isDashboardVisible };
      if (dashboardSortOrder !== undefined) {
        updateData.dashboardSortOrder = dashboardSortOrder;
      }
      return await categoriesFs.update(id, updateData);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update category visibility');
    }
  },

  // Update multiple categories visibility (Admin only)
  async updateBulkVisibility(updates: Array<{ id: string; isDashboardVisible: boolean; dashboardSortOrder?: number }>): Promise<ServiceCategory[]> {
    try {
      const batch = writeBatch(db);

      updates.forEach((update) => {
        const ref = doc(db, 'serviceCategories', update.id);
        const data: any = { isDashboardVisible: update.isDashboardVisible };
        if (update.dashboardSortOrder !== undefined) {
          data.dashboardSortOrder = update.dashboardSortOrder;
        }
        batch.update(ref, data);
      });

      await batch.commit();

      // Fetch updated categories
      const results = await Promise.all(updates.map((u) => categoriesFs.getById(u.id)));
      return results;
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update categories visibility');
    }
  },
};
