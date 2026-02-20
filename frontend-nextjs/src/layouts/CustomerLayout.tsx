'use client';
import React from 'react';
// import { Outlet } from 'next/navigation';
import { usePathname } from 'next/navigation';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import ScrollToTop from '../components/common/ScrollToTop';

export interface CustomerLayoutProps {
  children: React.ReactNode;
}

const CustomerLayout: React.FC<CustomerLayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isWelcomePage = pathname === '/welcome';

  return (
    <div className="min-h-screen bg-background-secondary">
      <ScrollToTop />
      {/* Desktop Header - hidden on mobile */}
      <div className="hidden md:block">
        <Header />
      </div>

      {/* Mobile Header - only show if not welcome page */}
      {!isWelcomePage && (
        <div className="md:hidden">
          <Header />
        </div>
      )}

      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>

      {/* Desktop Footer */}
      <div className="hidden md:block">
        <Footer />
      </div>

      {/* Mobile Bottom Navigation - only show if not welcome page */}
      {!isWelcomePage && (
        <div className="md:hidden">
          <MobileBottomNav />
        </div>
      )}
    </div>
  );
};

export default CustomerLayout;
