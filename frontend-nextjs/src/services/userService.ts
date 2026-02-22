import {
  FirestoreService,
  db,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  serverTimestamp,
  orderBy,
  limit,
} from './firestore/firestoreService';
import { docToObject } from './firestore/firestoreService';
import { auth } from '@/config/firebase';
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

const usersFs = new FirestoreService<User>('users');
const bookingsFs = new FirestoreService<Booking>('bookings');

class UserService {
  /**
   * Get user profile with statistics
   */
  async getProfile(): Promise<UserWithStats> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const profile = await usersFs.getById(user.uid);

    // Calculate stats from bookings and favorites
    const [bookings, favorites, reviews] = await Promise.all([
      this.getRecentBookings(100), // Get more for stats
      this.getFavorites(),
      getDocs(
        query(collection(db, 'reviews'), where('userId', '==', user.uid))
      ),
    ]);

    const totalSpent = bookings.reduce((sum: number, b: any) => sum + (Number(b.totalPrice) || 0), 0);

    const stats: UserStats = {
      appointments: bookings.length,
      favorites: favorites.length,
      avgRating: 0,
      totalSpent,
      totalBookings: bookings.length,
      totalReviews: reviews.size,
      level: 'Bronze',
      points: 0,
    };

    return { ...profile, stats };
  }

  /**
   * Get user's recent bookings
   */
  async getRecentBookings(limitCount: number = 5): Promise<Booking[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((d) => docToObject<Booking>(d));
  }

  /**
   * Get user's favorite salons
   */
  async getFavorites(): Promise<FavoriteWithSalon[]> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', user.uid)
    );
    const snapshot = await getDocs(q);
    const favorites = snapshot.docs.map((d) => docToObject<Favorite>(d));

    // Fetch salon data for each favorite
    const favoritesWithSalons: FavoriteWithSalon[] = [];
    for (const fav of favorites) {
      try {
        const salonDoc = await getDoc(doc(db, 'salons', fav.salonId));
        if (salonDoc.exists()) {
          const salonData = salonDoc.data();
          favoritesWithSalons.push({
            ...fav,
            salon: {
              id: fav.salonId,
              displayId: salonData?.displayId || 0,
              name: salonData?.name || '',
              address: salonData?.address || '',
              phone: salonData?.phone || '',
              email: salonData?.email || '',
              images: salonData?.images || [],
              rating: salonData?.rating || 0,
              isOpen: salonData?.isOpen || false,
              createdAt: salonData?.createdAt || '',
            },
          });
        }
      } catch {
        // Skip salons that don't exist
      }
    }

    return favoritesWithSalons;
  }

  /**
   * Add salon to favorites
   */
  async addFavorite(salonId: string): Promise<FavoriteWithSalon> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    // Check if already favorited
    const existing = await this.checkFavoriteStatus(salonId);
    if (existing) throw new Error('Salon already in favorites');

    const favRef = await addDoc(collection(db, 'favorites'), {
      userId: user.uid,
      salonId,
      createdAt: serverTimestamp(),
    });

    const favDoc = await getDoc(favRef);
    const fav = docToObject<Favorite>(favDoc);

    // Fetch salon data
    const salonDoc = await getDoc(doc(db, 'salons', salonId));
    const salonData = salonDoc.data();

    return {
      ...fav,
      salon: {
        id: salonId,
        displayId: salonData?.displayId || 0,
        name: salonData?.name || '',
        address: salonData?.address || '',
        phone: salonData?.phone || '',
        email: salonData?.email || '',
        images: salonData?.images || [],
        rating: salonData?.rating || 0,
        isOpen: salonData?.isOpen || false,
        createdAt: salonData?.createdAt || '',
      },
    };
  }

  /**
   * Remove salon from favorites
   */
  async removeFavorite(salonId: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');

    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', user.uid),
      where('salonId', '==', salonId)
    );
    const snapshot = await getDocs(q);

    for (const favDoc of snapshot.docs) {
      await deleteDoc(favDoc.ref);
    }
  }

  /**
   * Check if salon is favorited
   */
  async checkFavoriteStatus(salonId: string): Promise<boolean> {
    const user = auth.currentUser;
    if (!user) return false;

    const q = query(
      collection(db, 'favorites'),
      where('userId', '==', user.uid),
      where('salonId', '==', salonId)
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: Partial<User>): Promise<User> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return usersFs.update(user.uid, data as any);
  }

  /**
   * Change user password
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    // Delegate to authService
    const { authService } = await import('./authService');
    await authService.changePassword(currentPassword, newPassword);
  }
}

export const userService = new UserService();
export default userService;
