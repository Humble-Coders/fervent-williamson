import {
  FirestoreService,
  db,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  getCountFromServer,
  doc,
  getDoc,
} from './firestore/firestoreService';
import { docToObject } from './firestore/firestoreService';

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

const usersFs = new FirestoreService<AdminUser>('users');

export const adminService = {
  // Get all users with pagination and filters
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }): Promise<UsersResponse> {
    const pageSize = params?.limit || 20;

    const filters: { field: string; op: any; value: any }[] = [];
    if (params?.role) filters.push({ field: 'role', op: '==', value: params.role });
    if (params?.status === 'active') filters.push({ field: 'isActive', op: '==', value: true });
    if (params?.status === 'inactive') filters.push({ field: 'isActive', op: '==', value: false });

    let users = await usersFs.getAll({
      filters,
      sort: { field: 'createdAt', direction: 'desc' },
    });

    // Client-side search filter
    if (params?.search) {
      const searchLower = params.search.toLowerCase();
      users = users.filter(
        (u) =>
          u.name?.toLowerCase().includes(searchLower) ||
          u.email?.toLowerCase().includes(searchLower)
      );
    }

    const total = users.length;
    const page = params?.page || 1;
    const start = (page - 1) * pageSize;
    const paginatedUsers = users.slice(start, start + pageSize);

    return {
      users: paginatedUsers,
      pagination: {
        page,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize),
      },
    };
  },

  // Get user by ID
  async getUserById(id: string): Promise<AdminUserDetail> {
    const user = await usersFs.getById(id);

    // Fetch user's bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', id),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const bookingsSnap = await getDocs(bookingsQuery);
    const bookings = bookingsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        status: data.status,
        totalAmount: data.totalPrice || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
        salon: { id: data.salonId || '', name: data.salon?.name || '' },
        service: { id: data.serviceId || '', name: data.service?.name || '' },
      };
    });

    // Fetch user's reviews
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('userId', '==', id),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const reviewsSnap = await getDocs(reviewsQuery);
    const reviews = reviewsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
        salon: { id: data.salonId || '', name: '' },
      };
    });

    return { ...user, bookings, reviews };
  },

  // Update user
  async updateUser(id: string, data: UpdateUserData): Promise<AdminUser> {
    return usersFs.update(id, data as any);
  },

  // Delete/deactivate user
  async deleteUser(id: string): Promise<void> {
    await usersFs.update(id, { isActive: false } as any);
  },

  // Get admin dashboard stats
  async getStats(): Promise<AdminStats> {
    const [totalUsersSnap, activeSalonsSnap, totalBookingsSnap] = await Promise.all([
      getCountFromServer(collection(db, 'users')),
      getCountFromServer(query(collection(db, 'salons'), where('isOpen', '==', true))),
      getCountFromServer(collection(db, 'bookings')),
    ]);

    const totalUsers = totalUsersSnap.data().count;
    const activeSalons = activeSalonsSnap.data().count;
    const totalBookings = totalBookingsSnap.data().count;

    const [activeUsersSnap, totalSalonsSnap] = await Promise.all([
      getCountFromServer(query(collection(db, 'users'), where('isActive', '==', true))),
      getCountFromServer(collection(db, 'salons')),
    ]);

    // Get recent users
    const recentUsersQuery = query(
      collection(db, 'users'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const recentUsersSnap = await getDocs(recentUsersQuery);
    const recentUsers = recentUsersSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        name: data.name || '',
        email: data.email || '',
        role: data.role || 'CUSTOMER',
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
      };
    });

    // Get recent bookings
    const recentBookingsQuery = query(
      collection(db, 'bookings'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const recentBookingsSnap = await getDocs(recentBookingsQuery);
    const recentBookings = recentBookingsSnap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        status: data.status || '',
        totalAmount: data.totalPrice || 0,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() || data.createdAt || '',
        user: { name: data.user?.name || '', email: data.user?.email || '' },
        salon: { name: data.salon?.name || '' },
        service: { name: data.service?.name || '' },
      };
    });

    // Booking status distribution
    const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
    const statusCounts = await Promise.all(
      statuses.map(async (status) => {
        const snap = await getCountFromServer(
          query(collection(db, 'bookings'), where('status', '==', status))
        );
        return { status, count: snap.data().count };
      })
    );

    return {
      overview: {
        totalUsers,
        activeUsers: activeUsersSnap.data().count,
        totalSalons: totalSalonsSnap.data().count,
        activeSalons,
        totalBookings,
        totalRevenue: 0,
      },
      recent: {
        users: recentUsers,
        bookings: recentBookings,
      },
      topSalonsByRevenue: [],
      topSalonsByBookings: [],
      bookingStatusDistribution: statusCounts,
    };
  },

  // Verify setup password
  async verifySetupPassword(_setupPassword: string): Promise<{ admins: Array<{ id: string; name: string; email: string }> }> {
    const admins = await usersFs.getAll({
      filters: [{ field: 'role', op: '==', value: 'ADMIN' }],
    });
    return {
      admins: admins.map((a) => ({ id: a.id, name: a.name, email: a.email })),
    };
  },

  // Reset admin password
  async resetPassword(data: { email: string }): Promise<void> {
    const { authService } = await import('./authService');
    await authService.requestPasswordReset(data.email);
  },
};
