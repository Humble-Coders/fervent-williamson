import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/config/firebase';
import { authService } from '@/services/authService';
import { User, UserRole } from '../types';

// Helper functions for role checking
export const hasRole = (user: User | null, roles: UserRole[]): boolean => {
  return user ? roles.includes(user.role) : false;
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, [UserRole.ADMIN]);
};

export const isSalonOwner = (user: User | null): boolean => {
  return hasRole(user, [UserRole.SALON_OWNER]);
};

export const isCustomer = (user: User | null): boolean => {
  return hasRole(user, [UserRole.CUSTOMER]);
};

export const canAccessAdminPanel = (user: User | null): boolean => {
  return hasRole(user, [UserRole.ADMIN]);
};

export const canAccessSalonPanel = (user: User | null): boolean => {
  return hasRole(user, [UserRole.ADMIN, UserRole.SALON_OWNER]);
};

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  initializeAuth: () => () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,

      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user,
          error: null,
          isLoading: false,
        });
      },

      setLoading: (isLoading) => set({ isLoading }),

      setError: (error) => set({ error }),

      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
          isLoading: false,
        });
      },

      updateUser: (updates) => {
        set((state) => {
          if (!state.user) return state;
          return { user: { ...state.user, ...updates } };
        });
      },

      initializeAuth: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const userProfile = await authService.getCurrentUser(firebaseUser.uid);
              if (userProfile) {
                set({
                  user: userProfile,
                  isAuthenticated: true,
                  isLoading: false,
                  error: null,
                });
              } else {
                set({
                  user: null,
                  isAuthenticated: false,
                  isLoading: false,
                  error: null,
                });
              }
            } catch {
              set({
                user: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
              });
            }
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: null,
            });
          }
        });

        return unsubscribe;
      },
    }),
    { name: 'auth-store' }
  )
);
