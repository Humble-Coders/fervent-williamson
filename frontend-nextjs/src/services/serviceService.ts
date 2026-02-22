import {
  SubcollectionService,
  db,
  collection,
  collectionGroup,
  query,
  where,
  getDocs,
  doc,
  getDoc,
} from './firestore/firestoreService';
import { docToObject } from './firestore/firestoreService';
import { auth } from '@/config/firebase';

export interface ServiceCategory {
  id: string;
  name: string;
  icon?: string;
  emoji?: string;
  color?: string;
  description?: string;
}

export interface SubService {
  id: string;
  name: string;
  description?: string;
  duration: number;
  price: number;
  images?: string[];
  isActive: boolean;
  displayId: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  duration: number;
  price: number;
  popular: boolean;
  emoji?: string;
  gender: 'MALE' | 'FEMALE' | 'UNISEX';
  images?: string[];
  salonId: string;
  categoryId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  salon?: {
    id: string;
    name: string;
    rating: number;
    featured: boolean;
    isOpen: boolean;
  };
  category?: ServiceCategory;
  subServices?: SubService[];
  _count?: {
    bookings: number;
  };
}

export interface CreateServiceData {
  name: string;
  description: string;
  duration: number;
  price: number;
  popular?: boolean;
  emoji?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  images?: string[];
  salonId?: string;
  categoryId: string;
  isActive?: boolean;
}

export interface UpdateServiceData {
  name?: string;
  description?: string;
  duration?: number;
  price?: number;
  popular?: boolean;
  emoji?: string;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX';
  images?: string[];
  salonId?: string;
  categoryId?: string;
  isActive?: boolean;
}

export interface ServiceFilters {
  salonId?: string;
  categoryId?: string;
  isActive?: boolean;
  popular?: boolean;
}

const servicesSubFs = new SubcollectionService<Service>('salons', 'services');

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

export const serviceService = {
  // Get all services with optional filters
  async getAllServices(filters?: ServiceFilters): Promise<Service[]> {
    try {
      // If salonId is provided, use subcollection query
      if (filters?.salonId) {
        const queryFilters: { field: string; op: any; value: any }[] = [];
        if (filters.categoryId) queryFilters.push({ field: 'categoryId', op: '==', value: filters.categoryId });
        if (filters.isActive !== undefined) queryFilters.push({ field: 'isActive', op: '==', value: filters.isActive });
        if (filters.popular !== undefined) queryFilters.push({ field: 'popular', op: '==', value: filters.popular });

        return servicesSubFs.getAll(filters.salonId, { filters: queryFilters });
      }

      // Cross-salon query using collectionGroup
      const constraints: any[] = [];
      if (filters?.isActive !== undefined) constraints.push(where('isActive', '==', filters.isActive));
      if (filters?.popular !== undefined) constraints.push(where('popular', '==', filters.popular));
      if (filters?.categoryId) constraints.push(where('categoryId', '==', filters.categoryId));

      const q = query(collectionGroup(db, 'services'), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((d) => docToObject<Service>(d));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch services');
    }
  },

  // Get service by ID (requires salonId)
  async getServiceById(serviceId: string, salonId?: string): Promise<Service> {
    try {
      if (salonId) {
        return servicesSubFs.getById(salonId, serviceId);
      }
      // If no salonId, try to get from current user's salon
      const ownerSalonId = await getOwnerSalonId();
      return servicesSubFs.getById(ownerSalonId, serviceId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch service');
    }
  },

  // Create a new service
  async createService(serviceData: CreateServiceData): Promise<Service> {
    try {
      const salonId = serviceData.salonId || (await getOwnerSalonId());
      const sanitizedData = {
        ...serviceData,
        salonId,
        price: Number(serviceData.price),
        duration: Number(serviceData.duration),
        isActive: serviceData.isActive ?? true,
        popular: serviceData.popular ?? false,
        gender: serviceData.gender || 'UNISEX',
      };
      return servicesSubFs.create(salonId, sanitizedData as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create service');
    }
  },

  // Update a service
  async updateService(serviceId: string, serviceData: UpdateServiceData): Promise<Service> {
    try {
      const salonId = serviceData.salonId || (await getOwnerSalonId());
      const sanitizedData: UpdateServiceData = {
        ...serviceData,
        ...(serviceData.price !== undefined && { price: Number(serviceData.price) }),
        ...(serviceData.duration !== undefined && { duration: Number(serviceData.duration) }),
      };
      return servicesSubFs.update(salonId, serviceId, sanitizedData as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update service');
    }
  },

  // Delete a service
  async deleteService(serviceId: string, salonId?: string): Promise<void> {
    try {
      const sid = salonId || (await getOwnerSalonId());
      await servicesSubFs.delete(sid, serviceId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete service');
    }
  },

  // Get services by salon
  async getServicesBySalon(salonId: string): Promise<Service[]> {
    return this.getAllServices({ salonId });
  },

  // Get services by category
  async getServicesByCategory(categoryId: string): Promise<Service[]> {
    return this.getAllServices({ categoryId });
  },

  // Get popular services
  async getPopularServices(): Promise<Service[]> {
    return this.getAllServices({ popular: true, isActive: true });
  },

  // Get active services only
  async getActiveServices(): Promise<Service[]> {
    return this.getAllServices({ isActive: true });
  },

  // Update a subservice
  async updateSubService(subServiceId: string, subServiceData: Partial<SubService>): Promise<SubService> {
    // SubServices are stored as a nested field or sub-subcollection
    // For simplicity, this is a placeholder - implement based on actual data model
    throw new Error('SubService updates should be handled through the parent service');
  },

  // Format price for display
  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  },

  // Format duration for display
  formatDuration(duration: number): string {
    if (duration < 60) {
      return `${duration} min`;
    }
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (minutes === 0) {
      return `${hours} hr${hours > 1 ? 's' : ''}`;
    }
    return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min`;
  },

  // Get service status color for UI
  getServiceStatusColor(service: Service): string {
    if (!service.isActive) return 'text-red-600 bg-red-100';
    if (service.popular) return 'text-purple-600 bg-purple-100';
    return 'text-green-600 bg-green-100';
  },

  // Get service status text
  getServiceStatusText(service: Service): string {
    if (!service.isActive) return 'Inactive';
    if (service.popular) return 'Popular';
    return 'Active';
  },

  // Validate service data
  validateServiceData(data: CreateServiceData | UpdateServiceData): string[] {
    const errors: string[] = [];
    if ('name' in data && data.name && data.name.trim().length < 2) {
      errors.push('Service name must be at least 2 characters long');
    }
    if ('description' in data && data.description && data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }
    if ('duration' in data && data.duration !== undefined && data.duration < 1) {
      errors.push('Duration must be at least 1 minute');
    }
    if ('price' in data && data.price !== undefined && data.price < 0) {
      errors.push('Price must be non-negative');
    }
    return errors;
  },

  // Calculate service metrics
  calculateServiceMetrics(services: Service[]): {
    totalServices: number;
    activeServices: number;
    popularServices: number;
    averagePrice: number;
    averageDuration: number;
  } {
    const totalServices = services.length;
    const activeServices = services.filter((s) => s.isActive).length;
    const popularServices = services.filter((s) => s.popular).length;
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
    const averagePrice = totalServices > 0 ? totalPrice / totalServices : 0;
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const averageDuration = totalServices > 0 ? totalDuration / totalServices : 0;

    return { totalServices, activeServices, popularServices, averagePrice, averageDuration };
  },
};
