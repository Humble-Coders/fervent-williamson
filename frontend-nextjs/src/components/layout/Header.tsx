import React, { useState } from 'react';
import Link from 'next/link'; import { useRouter } from 'next/navigation';
import { Shield, Building2, ChevronDown, LogOut, User, Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useAuth } from '../../hooks/useAuth';
import Button from '../ui/Button';
import LoginModal from '../auth/LoginModal';
import { useAuthPrompt } from '../../hooks/useAuthPrompt';

const Header: React.FC = () => {
  const { isAuthenticated, user } = useAuthStore();
  const { logout, isAdmin, isSalonOwner, isCustomer } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const router = useRouter();

  // Use auth prompt hook for login modal
  const {
    isLoginModalOpen,
    promptOptions,
    promptLogin: _promptLogin,
    handleLoginSuccess,
    handleLoginCancel,
  } = useAuthPrompt();

  const handleSignIn = () => {
    router.push('/welcome');
  };

  // const handleBookNow = () => {
  //   promptLogin({
  //     title: "Book Your Appointment",
  //     message: "Sign in to book your appointment and manage your bookings",
  //     onSuccess: () => {
  //       // After successful login, redirect to booking page
  //       router.push('/booking');
  //     }
  //   });
  // };

  return (
    <header className="bg-white shadow-soft border-b border-neutral-200 sticky top-0 z-40 md:relative pt-safe" style={{ paddingTop: 'max(env(safe-area-inset-top), 0.5rem)' }}>
      <div className="container-custom">
        <div className="flex items-center justify-between h-12 sm:h-14 md:h-16 lg:h-20 px-1 sm:px-2 md:px-0">
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2">
            <img
              src="/logo.png"
              alt="CutQ Logo"
              className="w-7 h-7 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
            />
            <span className="text-base sm:text-lg md:text-xl font-bold text-text-primary font-heading">CutQ</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex space-x-8">
            {isAuthenticated && isCustomer() && (
              <>
                <Link
                  href="/"
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-250 font-medium"
                >
                  Home
                </Link>
                <Link
                  href="/salons"
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-250 font-medium"
                >
                  Salons
                </Link>
                <Link
                  href="/coupons"
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-250 font-medium"
                >
                  Coupons
                </Link>
                <Link
                  href="/profile"
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-250 font-medium"
                >
                  Profile
                </Link>
              </>
            )}

            {isAuthenticated && isSalonOwner() && (
              <>
                <Link
                  href="/salon"
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-250 font-medium flex items-center gap-1"
                >
                  <Building2 className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link
                  href="/salon/bookings"
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-250 font-medium"
                >
                  Bookings
                </Link>
              </>
            )}

            {isAuthenticated && isAdmin() && (
              <>
                <Link
                  href="/admin"
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-250 font-medium flex items-center gap-1"
                >
                  <Shield className="h-4 w-4" />
                  Admin
                </Link>
                <Link
                  href="/admin/users"
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-250 font-medium"
                >
                  Users
                </Link>
                <Link
                  href="/admin/salons"
                  className="text-text-secondary hover:text-primary-500 transition-colors duration-250 font-medium"
                >
                  Salons
                </Link>
              </>
            )}
          </nav>

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden lg:flex items-center space-x-3">
              {isAuthenticated ? (
                <>
                  {/* Notification Bell - Only for Salon Owners */}
                  {isSalonOwner() && (
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative">
                      <Bell className="h-5 w-5 text-gray-600" />
                      {/* Notification badge - uncomment when notifications are implemented */}
                      {/* <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span> */}
                    </button>
                  )}

                  {/* User Profile Dropdown */}
                  <div
                    className="relative"
                    onMouseEnter={() => setProfileDropdownOpen(true)}
                    onMouseLeave={() => setProfileDropdownOpen(false)}
                  >
                    <button
                      className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                      {user?.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-9 h-9 rounded-full object-cover cursor-pointer border-2 border-primary-200 hover:border-primary-400 transition-colors"
                        />
                      ) : (
                        <div className="w-9 h-9 bg-gradient-to-r from-primary-400 to-accent-400 rounded-full flex items-center justify-center cursor-pointer border-2 border-primary-200 hover:border-primary-400 transition-colors">
                          <span className="text-white text-sm font-semibold">
                            {user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                      )}
                      <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {profileDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 animate-slide-down">
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                          <p className="text-xs text-gray-500">
                            {isSalonOwner() ? 'Salon Owner' : isAdmin() ? 'Admin' : 'Customer'}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            router.push('/profile');
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                        >
                          <User className="w-4 h-4" />
                          My Profile
                        </button>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={() => {
                            logout();
                            setProfileDropdownOpen(false);
                          }}
                          className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Logout
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Button variant="outline" size="xs" onClick={handleSignIn}>
                    Sign In
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            {/* <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 sm:p-2 hover:bg-neutral-100 rounded-lg transition-colors focus-ring"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-text-primary" />
            </button> */}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-neutral-200 shadow-soft animate-slide-down">
            <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                <Link
                  href="/"
                  className="block text-text-secondary hover:text-primary-500 transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🏠 Home
                </Link>
                <Link
                  href="/salons"
                  className="block text-text-secondary hover:text-primary-500 transition-colors font-medium py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  🔍 Find Salons
                </Link>
              </div>

              {/* Mobile Auth Actions */}
              <div className="pt-4 border-t border-neutral-200">
                {isAuthenticated ? (
                  <button onClick={logout} className="w-full text-left text-text-secondary hover:text-primary-500 transition-colors font-medium py-2">
                    👋 Sign Out
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        router.push('/welcome');
                      }}
                      className="block w-full text-left text-primary-600 hover:text-primary-700 transition-colors font-medium py-2"
                    >
                      🚀 Get Started
                    </button>
                    <Link href="/salon/login" className="block text-accent-600 hover:text-accent-700 transition-colors font-medium py-2">
                      🏢 Salon Owner Login
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginCancel}
        onSuccess={handleLoginSuccess}
        title={promptOptions.title}
        message={promptOptions.message}
      />
    </header>
  );
};

export default Header;