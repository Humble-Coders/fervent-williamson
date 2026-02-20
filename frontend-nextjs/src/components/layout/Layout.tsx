'use client';
import React from 'react';
import { usePathname } from 'next/navigation';
import Header from './Header';
import Footer from './Footer';
import MobileBottomNav from './MobileBottomNav';
import { useAuthInitialization } from '../../hooks/useAuthInitialization';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isWelcomePage = pathname === '/welcome';
  // Check if current route is admin or salon (they have their own layouts)
  const isAdminRoute = pathname?.startsWith('/admin');
  const isSalonRoute = pathname?.startsWith('/salon');
  const hasCustomLayout = isAdminRoute || isSalonRoute;

  // Debug logging
  console.log('[Layout Debug]', {
    pathname,
    isWelcomePage,
    isAdminRoute,
    isSalonRoute,
    hasCustomLayout,
    shouldShowBottomNav: !isWelcomePage && !hasCustomLayout
  });

  // Initialize authentication on app startup
  useAuthInitialization();

  return (
    <div className="flex flex-col h-screen w-screen bg-background-secondary overflow-hidden">
      {/* Desktop Header - hidden on mobile, not shown for admin/salon routes */}
      {!hasCustomLayout && (
        <div className="hidden md:block flex-shrink-0">
          <Header />
        </div>
      )}

      {/* Mobile Header - only show if not welcome page and not admin/salon routes */}
      {!isWelcomePage && !hasCustomLayout && (
        <div className="md:hidden flex-shrink-0">
          <Header />
        </div>
      )}

      <main
        className="flex-1 overflow-y-auto md:pb-0"
        style={{ paddingBottom: !isWelcomePage && !hasCustomLayout ? 'calc(5rem + max(env(safe-area-inset-bottom), 0.5rem))' : '0' }}
      >
        {children}

        {/* Desktop Footer - inside scrollable area, not shown for admin/salon routes */}
        {!hasCustomLayout && (
          <div className="hidden md:block">
            <Footer />
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation - only show for customer routes (not welcome, admin, or salon) */}
      {!isWelcomePage && !hasCustomLayout && (
        <div className="flex-shrink-0">
          <MobileBottomNav />
        </div>
      )}
    </div>
  );
};

export default Layout;