'use client';

import { useEffect } from 'react';
import { logger } from '@/config/logger';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import SalonLayout from '@/layouts/SalonLayout';

export default function SalonLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not loading and authentication check is complete
    if (!isLoading && (!isAuthenticated || (user?.role !== UserRole.SALON_OWNER && user?.role !== UserRole.ADMIN))) {
      logger.info('🚫 Salon access denied, redirecting to welcome page', { isAuthenticated, userRole: user?.role });
      // Use replace instead of push to avoid back button issues
      setTimeout(() => {
        router.replace('/welcome');
      }, 2000);
    }
  }, [isAuthenticated, user, router, isLoading]);

  // Show loading state while authentication is being validated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-600">Verifying your access...</p>
        </div>
      </div>
    );
  }

  // Show access denied only after loading is complete and user is not authorized
  if (!isAuthenticated || (user?.role !== UserRole.SALON_OWNER && user?.role !== UserRole.ADMIN)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">You need salon owner privileges to access this page.</p>
          </div>
          <button
            onClick={() => router.replace('/welcome')}
            className="w-full bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            Go to Login
          </button>
          <p className="text-sm text-gray-500 mt-4">
            If you're not redirected automatically, click the button above.
          </p>
        </div>
      </div>
    );
  }

  return <SalonLayout>{children}</SalonLayout>;
}
