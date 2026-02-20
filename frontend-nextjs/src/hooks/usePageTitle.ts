import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Hook to manage dynamic page titles based on route and content
 */
export const usePageTitle = (title?: string, suffix: string = 'CutQ') => {
  const pathname = usePathname();

  useEffect(() => {
    if (title) {
      document.title = `${title} | ${suffix}`;
    } else {
      // Generate title based on route
      const routeTitle = generateTitleFromRoute(pathname);
      document.title = routeTitle ? `${routeTitle} | ${suffix}` : suffix;
    }
  }, [title, suffix, pathname]);
};

/**
 * Generate page title from route path
 */
const generateTitleFromRoute = (pathname: string): string => {
  const routeTitles: { [key: string]: string } = {
    '/': 'Premium Beauty & Salon Services | Book Online',
    '/salons': 'Find Beauty Salons Near You',
    '/services/hair': 'Hair Care Services',
    '/services/facial': 'Facial Treatments',
    '/services/nail': 'Nail Care Services',
    '/services/massage': 'Massage Therapy',
    '/services/makeup': 'Makeup Services',
    '/services/spa': 'Spa Treatments',
    '/booking': 'Book Your Appointment',
    '/profile': 'Your Profile',
    '/favorites': 'Your Favorite Salons',
    '/appointments': 'Your Appointments',
    '/about': 'About CutQ',
    '/contact': 'Contact Us',
    '/help': 'Help & Support',
    '/privacy': 'Privacy Policy',
    '/terms': 'Terms of Service',
    '/welcome': 'Welcome to CutQ'
  };

  // Check for exact match first
  if (routeTitles[pathname]) {
    return routeTitles[pathname];
  }

  // Check for dynamic routes
  if (pathname.startsWith('/salons/')) {
    return 'Salon Details';
  }
  
  if (pathname.startsWith('/services/')) {
    const parts = pathname.split('/');
    if (parts.length >= 3) {
      const category = parts[2];
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      return `${categoryName} Services`;
    }
  }

  if (pathname.startsWith('/admin')) {
    return 'Admin Dashboard';
  }

  if (pathname.startsWith('/salon')) {
    return 'Salon Dashboard';
  }

  // Fallback: capitalize and clean up the path
  return pathname
    .split('/')
    .filter(Boolean)
    .map(segment => segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' '))
    .join(' - ') || 'CutQ';
};

/**
 * Generate page-specific titles for dynamic content
 */
export const generateDynamicTitle = {
  salon: (salonName: string) => `${salonName} - Book Online`,
  service: (serviceName: string, salonName?: string) => 
    salonName ? `${serviceName} at ${salonName}` : serviceName,
  category: (categoryName: string) => `${categoryName} Services`,
  booking: (serviceName?: string, salonName?: string) => {
    if (serviceName && salonName) {
      return `Book ${serviceName} at ${salonName}`;
    }
    return 'Book Your Appointment';
  },
  search: (query: string) => `Search Results for "${query}"`,
  location: (location: string) => `Beauty Salons in ${location}`
};

export default usePageTitle;
