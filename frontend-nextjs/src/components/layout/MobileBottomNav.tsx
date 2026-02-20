'use client';
import React, { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  Search,
  Calendar,
  User,
  Tag,
  LayoutDashboard,
  Users,
  Package,
  Settings,
  Building2,
  Scissors
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { UserRole } from '../../types';

const MobileBottomNav: React.FC = () => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  // Determine navigation items based on user role
  const navItems = useMemo(() => {
    // Admin navigation
    if (user?.role === UserRole.ADMIN) {
      return [
        {
          id: 'dashboard',
          path: '/admin',
          icon: LayoutDashboard,
          label: 'Dashboard',
          emoji: '📊'
        },
        {
          id: 'salons',
          path: '/admin/salons',
          icon: Building2,
          label: 'Salons',
          emoji: '🏢'
        },
        {
          id: 'users',
          path: '/admin/users',
          icon: Users,
          label: 'Users',
          emoji: '👥'
        },
        {
          id: 'services',
          path: '/admin/services',
          icon: Package,
          label: 'Services',
          emoji: '📦'
        },
        {
          id: 'settings',
          path: '/admin/settings',
          icon: Settings,
          label: 'Settings',
          emoji: '⚙️'
        }
      ];
    }

    // Salon Owner navigation
    if (user?.role === UserRole.SALON_OWNER) {
      return [
        {
          id: 'dashboard',
          path: '/salon',
          icon: LayoutDashboard,
          label: 'Dashboard',
          emoji: '📊'
        },
        {
          id: 'bookings',
          path: '/salon/bookings',
          icon: Calendar,
          label: 'Bookings',
          emoji: '📅'
        },
        {
          id: 'services',
          path: '/salon/services',
          icon: Scissors,
          label: 'Services',
          emoji: '✂️'
        },
        {
          id: 'customers',
          path: '/salon/customers',
          icon: Users,
          label: 'Customers',
          emoji: '👥'
        },
        {
          id: 'settings',
          path: '/salon/settings',
          icon: Settings,
          label: 'Settings',
          emoji: '⚙️'
        }
      ];
    }

    // Customer navigation (default)
    return [
      {
        id: 'home',
        path: '/',
        icon: Home,
        label: 'Home',
        emoji: '🏠'
      },
      {
        id: 'explore',
        path: '/salons',
        icon: Search,
        label: 'Explore',
        emoji: '🔍'
      },
      {
        id: 'coupons',
        path: '/coupons',
        icon: Tag,
        label: 'Coupons',
        emoji: '🎫'
      },
      {
        id: 'book',
        path: isAuthenticated ? '/appointments' : '/welcome',
        icon: Calendar,
        label: 'Book',
        emoji: '📅'
      },
      {
        id: 'profile',
        path: isAuthenticated ? '/profile' : '/welcome',
        icon: User,
        label: 'Profile',
        emoji: '👤'
      }
    ];
  }, [user?.role, isAuthenticated]);

  console.log('[MobileBottomNav] Rendering with', { pathname, navItems: navItems.length, userRole: user?.role });

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 shadow-lg border-t-4 border-red-500 block md:hidden"
      style={{
        zIndex: 99999,
        backgroundColor: '#ff0000',
        minHeight: '60px',
        paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none'
      }}
    >
      <div className="flex items-center justify-around px-1 py-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.path;

          return (
            <Link
              key={item.id}
              href={item.path}
              className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all duration-200 min-w-[60px] ${isActive
                ? 'bg-primary-500 text-white shadow-md'
                : 'text-gray-600 hover:text-primary-500 hover:bg-primary-50 active:bg-primary-100'
                }`}
            >
              <IconComponent className={`w-4 h-4 mb-1 ${isActive ? 'text-white' : ''}`} strokeWidth={2.5} />
              <span className={`text-[10px] font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;