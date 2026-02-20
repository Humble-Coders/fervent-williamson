import { create } from 'zustand';
import { logger } from '@/config/logger';
import { devtools, persist } from 'zustand/middleware';
import { User, UserRole } from '../types';
import { buildApiUrl } from '../config/env';

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
  validateToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        user: null,
        isAuthenticated: false,
        isLoading: false, // Start with loading false
        error: null,

        setUser: (user) => {
          console.log('[authStore] setUser called with user:', user);
          console.log('[authStore] Setting isAuthenticated to:', !!user);
          set({
            user,
            isAuthenticated: !!user,
            error: null,
            isLoading: false
          });
        },
        
        setLoading: (isLoading) => set({ isLoading }),
        
        setError: (error) => set({ error }),
        
        logout: () => {
          // Clear persisted auth data
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user_data');

          set({
            user: null,
            isAuthenticated: false,
            error: null,
            isLoading: false
          });
        },
        
        updateUser: (updates) => {
          const { user } = get();
          if (user) {
            set({
              user: { ...user, ...updates }
            });
          }
        },

        validateToken: async () => {
          const token = localStorage.getItem('auth_token');

          if (!token) {
            // No token, clear auth state
            set({
              user: null,
              isAuthenticated: false,
              error: null,
              isLoading: false
            });
            return;
          }

          try {
            // Try to validate token by making a simple API call
            const response = await fetch(buildApiUrl('auth/profile'), {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });

            if (!response.ok) {
              // Token is invalid/expired, clear auth state
              logger.info('🔄 Token validation failed, clearing auth state');
              localStorage.removeItem('auth_token');
              set({
                user: null,
                isAuthenticated: false,
                error: null,
                isLoading: false
              });
            } else {
              // Token is valid, update user data
              const data = await response.json();
              logger.info('✅ Token validation successful');
              set({
                user: data.data,
                isAuthenticated: true,
                error: null,
                isLoading: false
              });
            }
          } catch (error) {
            // Network error or other issue, clear auth state to be safe
            logger.info('❌ Token validation error, clearing auth state:', error);
            localStorage.removeItem('auth_token');
            set({
              user: null,
              isAuthenticated: false,
              error: null,
              isLoading: false
            });
          }
        },
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({ 
          user: state.user,
          isAuthenticated: state.isAuthenticated 
        }),
        onRehydrateStorage: () => (state) => {
          // Keep loading true if there's a token to validate
          if (state) {
            const token = localStorage.getItem('auth_token');
            state.isLoading = !!token; // Set loading to true if token exists, false otherwise
          }
        },
      }
    ),
    {
      name: 'auth-store',
    }
  )
);