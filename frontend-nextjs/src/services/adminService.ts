import { apiCall } from './api';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ADMIN' | 'SALON_OWNER' | 'CUSTOMER';
  isActive: boolean;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    bookings: number;
    reviews: number;
  };
}

export interface AdminUserDetail extends AdminUser {
  bookings?: Array<{
    id: string;
    status: string;
    totalAmount: number;
    createdAt: string;
    salon: { id: string; name: string };
    service: { id: string; name: string };
  }>;
  reviews?: Array<{
    id: string;
    rating: number;
    comment: string;
    createdAt: string;
    salon: { id: string; name: string };
  }>;
  loyaltyAccount?: {
    points: number;
    totalSpent: number;
    level: string;
  };
}

export interface UsersResponse {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: 'ADMIN' | 'SALON_OWNER' | 'CUSTOMER';
  isActive?: boolean;
}

export interface AdminStats {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalSalons: number;
    activeSalons: number;
    totalBookings: number;
    totalRevenue: number;
  };
  recent: {
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
    }>;
    bookings: Array<{
      id: string;
      status: string;
      totalAmount: number;
      createdAt: string;
      user: { name: string; email: string };
      salon: { name: string };
      service: { name: string };
    }>;
  };
  monthly?: Array<any>;
  topSalonsByRevenue: Array<{
    id: string;
    name: string;
    revenue: number;
  }>;
  topSalonsByBookings: Array<{
    id: string;
    name: string;
    count: number;
  }>;
  bookingStatusDistribution: Array<{
    status: string;
    count: number;
  }>;
}

export const adminService = {
  // Get all users with pagination and filters
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<UsersResponse> {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);
    if (params?.status) searchParams.append('status', params.status);

    const response = await apiCall(`/admin/users?${searchParams.toString()}`);
    return response.data as any;
  },

  // Get user by ID
  async getUserById(id: string): Promise<AdminUserDetail> {
    const response = await apiCall(`/admin/users/${id}`);
    return response.data as any;
  },

  // Update user
  async updateUser(id: string, data: UpdateUserData): Promise<AdminUser> {
    const response = await apiCall(`/admin/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data as any;
  },

  // Delete/deactivate user
  async deleteUser(id: string): Promise<void> {
    await apiCall(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },

  // Get admin dashboard stats
  async getStats(): Promise<AdminStats> {
    const response = await apiCall('/admin/stats');
    return response.data as any;
  },
  // Verify setup password and get admins
  async verifySetupPassword(setupPassword: string): Promise<{ admins: Array<{ id: string; name: string; email: string }> }> {
    const response = await apiCall('/admin/signup/verify-setup-password', {
      method: 'POST',
      body: JSON.stringify({ setupPassword }),
    });
    return response.data as any;
  },

  // Reset admin password
  async resetPassword(data: { email: string; newPassword: string; confirmPassword: string; setupPassword: string }): Promise<void> {
    await apiCall('/admin/signup/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
