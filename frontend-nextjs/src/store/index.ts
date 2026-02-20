// Store barrel exports - centralized state management
export { useAuthStore } from './authStore';
export { useBookingStore } from './bookingStore';
export { useHomeStore } from './homeStore';
export { useSalonStore } from './salonStore';

// Legacy app store (keeping for backward compatibility)
import { create } from 'zustand';
import { User, Salon, Booking, ServiceCategory } from '../types';

interface AppState {
  // User state
  user: User | null;
  isAuthenticated: boolean;

  // Salon state
  salons: Salon[];
  featuredSalons: Salon[];
  selectedSalon: Salon | null;

  // Booking state
  currentBooking: Partial<Booking> | null;
  userBookings: Booking[];

  // UI state
  loading: boolean;
  error: string | null;

  // Categories
  serviceCategories: ServiceCategory[];

  // Actions
  setUser: (user: User | null) => void;
  setSalons: (salons: Salon[]) => void;
  setSelectedSalon: (salon: Salon | null) => void;
  setCurrentBooking: (booking: Partial<Booking> | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  salons: [],
  featuredSalons: [],
  selectedSalon: null,
  currentBooking: null,
  userBookings: [],
  loading: false,
  error: null,
  serviceCategories: [],

  // Actions
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setSalons: (salons) => set({ salons }),
  setSelectedSalon: (selectedSalon) => set({ selectedSalon }),
  setCurrentBooking: (currentBooking) => set({ currentBooking }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));