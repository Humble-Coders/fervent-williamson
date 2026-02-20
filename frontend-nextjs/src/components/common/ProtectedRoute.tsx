import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true
}) => {
  const { isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  // const pathname = usePathname(); // Removed unused variable

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/welcome');
      } else if (!requireAuth && isAuthenticated) {
        router.push('/');
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, router]);

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

  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  if (!requireAuth && isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
};

export default ProtectedRoute;