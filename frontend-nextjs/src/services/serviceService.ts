import { api } from './api';

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
  salonId?: string; // Made optional - backend will get from authenticated user
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

export interface ServiceResponse {
  success: boolean;
  data: Service;
  message: string;
}

export interface ServicesResponse {
  success: boolean;
  data: Service[];
  message: string;
}

export interface ServiceFilters {
  salonId?: string;
  categoryId?: string;
  isActive?: boolean;
  popular?: boolean;
}

export const serviceService = {
  // Get all services with optional filters
  async getAllServices(filters?: ServiceFilters): Promise<Service[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.salonId) params.append('salonId', filters.salonId);
      if (filters?.categoryId) params.append('categoryId', filters.categoryId);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.popular !== undefined) params.append('popular', filters.popular.toString());

      const queryString = params.toString();
      const url = queryString ? `/services?${queryString}` : '/services';
      
      const response = await api.get<ServicesResponse>(url);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch services');
    }
  },

  // Get service by ID
  async getServiceById(serviceId: string): Promise<Service> {
    try {
      const response = await api.get<ServiceResponse>(`/services/${serviceId}`);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch service');
    }
  },

  // Create a new service
  async createService(serviceData: CreateServiceData): Promise<Service> {
    try {
      // Ensure numeric fields are properly typed (convert from string if needed)
      const sanitizedData: CreateServiceData = {
        ...serviceData,
        price: Number(serviceData.price),
        duration: Number(serviceData.duration),
      };

      const response = await api.post<ServiceResponse>('/services', sanitizedData);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create service');
    }
  },

  // Update a service
  async updateService(serviceId: string, serviceData: UpdateServiceData): Promise<Service> {
    try {
      // Ensure numeric fields are properly typed (convert from string if needed)
      const sanitizedData: UpdateServiceData = {
        ...serviceData,
        ...(serviceData.price !== undefined && { price: Number(serviceData.price) }),
        ...(serviceData.duration !== undefined && { duration: Number(serviceData.duration) }),
      };

      const response = await api.put<ServiceResponse>(`/services/${serviceId}`, sanitizedData);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update service');
    }
  },

  // Delete a service
  async deleteService(serviceId: string): Promise<void> {
    try {
      await api.delete(`/services/${serviceId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete service');
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
    try {
      // Ensure numeric fields are properly typed (convert from string if needed)
      const sanitizedData: Partial<SubService> = {
        ...subServiceData,
        ...(subServiceData.price !== undefined && { price: Number(subServiceData.price) }),
        ...(subServiceData.duration !== undefined && { duration: Number(subServiceData.duration) }),
      };

      const response = await api.put<{ success: boolean; data: SubService; message: string }>(`/subservices/${subServiceId}`, sanitizedData);
      return (response.data as any).data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update subservice');
    }
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
    if (!service.isActive) {
      return 'text-red-600 bg-red-100';
    }
    if (service.popular) {
      return 'text-purple-600 bg-purple-100';
    }
    return 'text-green-600 bg-green-100';
  },

  // Get service status text
  getServiceStatusText(service: Service): string {
    if (!service.isActive) {
      return 'Inactive';
    }
    if (service.popular) {
      return 'Popular';
    }
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
    const activeServices = services.filter(s => s.isActive).length;
    const popularServices = services.filter(s => s.popular).length;
    
    const totalPrice = services.reduce((sum, s) => sum + s.price, 0);
    const averagePrice = totalServices > 0 ? totalPrice / totalServices : 0;
    
    const totalDuration = services.reduce((sum, s) => sum + s.duration, 0);
    const averageDuration = totalServices > 0 ? totalDuration / totalServices : 0;

    return {
      totalServices,
      activeServices,
      popularServices,
      averagePrice,
      averageDuration,
    };
  }
};
