import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, hasRole } from '../../store/authStore';
import { UserRole } from '../../types';
import LoadingSpinner from '../ui/LoadingSpinner';
import Alert from '../ui/Alert';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
  requireAuth?: boolean;
  fallbackPath?: string;
}

const RoleBasedRoute: React.FC<RoleBasedRouteProps> = ({
  children,
  allowedRoles,
  requireAuth = true,
  fallbackPath = '/welcome'
}) => {
  const { user, isAuthenticated, isLoading } = useAuthStore();
  // const pathname = usePathname(); // Removed unused variable
  const router = useRouter();

  // Get appropriate dashboard based on user role
  const getUserDashboard = (userRole: UserRole): string => {
    switch (userRole) {
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.SALON_OWNER:
        return '/salon';
      case UserRole.CUSTOMER:
        return '/';
      default:
        return '/welcome';
    }
  };

  // Handle navigation effects
  useEffect(() => {
    if (!isLoading && requireAuth && !isAuthenticated) {
      router.push(fallbackPath);
    }
  }, [isLoading, requireAuth, isAuthenticated, router, fallbackPath]);

  // Handle go back with smart navigation
  const handleGoBack = () => {
    if (user) {
      // Navigate to user's appropriate dashboard
      router.push(getUserDashboard(user.role));
    } else {
      // Fallback to welcome page if no user
      router.push('/welcome');
    }
  };

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

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  // Check role authorization
  if (isAuthenticated && user && !hasRole(user, allowedRoles)) {
    const getRoleDisplayName = (role: UserRole): string => {
      switch (role) {
        case UserRole.ADMIN:
          return 'Administrator';
        case UserRole.SALON_OWNER:
          return 'Salon Owner';
        case UserRole.CUSTOMER:
          return 'Customer';
        default:
          return 'User';
      }
    };

    const currentRoleDisplay = getRoleDisplayName(user.role);
    const requiredRolesDisplay = allowedRoles.map(getRoleDisplayName).join(' or ');

    return (
      <div className="min-h-screen bg-background-secondary flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert
            type="error"
            title="Access Denied"
            message={`This page requires ${requiredRolesDisplay} access. You are currently logged in as a ${currentRoleDisplay}. Please contact your administrator if you believe this is an error.`}
          />
          <div className="mt-6 text-center">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-2 px-4 py-2 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg font-medium transition-colors"
            >
              ← Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default RoleBasedRoute;
