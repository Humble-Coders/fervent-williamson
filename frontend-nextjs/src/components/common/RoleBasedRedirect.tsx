import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';

const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated || !user) {
        router.push('/welcome');
        return;
      }

      // Redirect based on user role
      switch (user.role) {
        case UserRole.ADMIN:
          router.push('/admin');
          break;
        case UserRole.SALON_OWNER:
          router.push('/salon');
          break;
        case UserRole.CUSTOMER:
          router.push('/');
          break;
        default:
          router.push('/welcome');
          break;
      }
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-secondary">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // Show loading while redirecting
  return (
    <div className="min-h-screen bg-background-secondary flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-text-secondary">Redirecting...</p>
      </div>
    </div>
  );
};

export default RoleBasedRedirect;
