import { BaseService } from './BaseService';
import { apiClient } from './api';
import { User, Booking, Favorite } from '../types';

export interface UserStats {
  appointments: number;
  favorites: number;
  avgRating: number;
  totalSpent: number;
  totalBookings: number;
  totalReviews: number;
  level: string;
  points: number;
}

export interface UserWithStats extends User {
  stats: UserStats;
}

export interface FavoriteWithSalon extends Favorite {
  salon: {
    id: string;
    displayId: number;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    images: string[];
    rating: number;
    isOpen: boolean;
    createdAt: string;
  };
}

class UserService extends BaseService<any, any, any> {
  constructor() {
    super('/users');
  }
  /**
   * Get user profile with statistics
   */
  async getProfile(): Promise<UserWithStats> {
    const response = await apiClient.get('/auth/profile');
    return response.data as any;
  }

  /**
   * Get user's recent bookings
   */
  async getRecentBookings(limit: number = 5): Promise<Booking[]> {
    const response = await apiClient.get(`/bookings?limit=${limit}`);
    return response.data as any;
  }

  /**
   * Get user's favorite salons
   */
  async getFavorites(): Promise<FavoriteWithSalon[]> {
    const response = await apiClient.get('/favorites');
    return response.data as any;
  }

  /**
   * Add salon to favorites
   */
  async addFavorite(salonId: string): Promise<FavoriteWithSalon> {
    const response = await apiClient.post('/favorites', { salonId });
    return response.data as any;
  }

  /**
   * Remove salon from favorites
   */
  async removeFavorite(salonId: string): Promise<void> {
    await apiClient.delete(`/favorites/${salonId}`);
  }

  /**
   * Check if salon is favorited
   */
  async checkFavoriteStatus(salonId: string): Promise<boolean> {
    const response = await apiClient.get(`/favorites/check/${salonId}`);
    return (response.data as any).isFavorited;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const response = await apiClient.patch('/auth/profile', data);
    return response.data as any;
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword
    });
  }
}

export const userService = new UserService();
export default userService;
