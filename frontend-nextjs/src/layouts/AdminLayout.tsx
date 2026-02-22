'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Users,
  Building2,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Shield,
  Home,
  Bell,
  Sparkles,
  Crown,
  Scissors,
  Gift,
  FileText,
  User,
  ChevronDown,
  Package
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import ScrollToTop from '../components/common/ScrollToTop';
import MobileBottomNav from '../components/layout/MobileBottomNav';

export interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Users', href: '/admin/users', icon: Users },
    { name: 'Admins', href: '/admin/admins', icon: Shield },
    { name: 'Salons', href: '/admin/salons', icon: Building2 },
    { name: 'Salon Requests', href: '/admin/salon-requests', icon: FileText },
    { name: 'Services', href: '/admin/services', icon: Scissors },
    { name: 'Service Categories', href: '/admin/service-categories', icon: Package },
    { name: 'Offers', href: '/admin/offers', icon: Gift },
    { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const handleLogout = () => {
    logout();
    router.push('/welcome');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-background-primary to-neutral-50">
      <ScrollToTop />
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white/95 backdrop-blur-xl shadow-2xl border-r border-neutral-200/50">
          <div className="flex h-20 items-center justify-between px-6 border-b border-neutral-200/50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 via-primary-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Admin Portal
                </span>
                <p className="text-xs text-text-secondary">System Control</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-xl hover:bg-neutral-100 transition-colors"
            >
              <X className="h-5 w-5 text-text-secondary" />
            </button>
          </div>
          <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25 transform scale-105'
                      : 'text-text-secondary hover:bg-white/60 hover:text-primary-600 hover:shadow-md hover:transform hover:scale-105'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className={`p-2 rounded-xl mr-3 transition-colors ${
                    isActive
                      ? 'bg-white/20'
                      : 'bg-neutral-100 group-hover:bg-primary-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-primary-600'}`} />
                  </div>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white/95 backdrop-blur-xl border-r border-neutral-200/50 shadow-xl">
          <div className="flex h-20 items-center px-6 border-b border-neutral-200/50">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-accent-500 via-primary-500 to-accent-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="h-2.5 w-2.5 text-white" />
                </div>
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                  Admin Portal
                </span>
                <p className="text-xs text-text-secondary">System Control</p>
              </div>
            </div>
          </div>
          <nav className="flex-1 px-6 py-6 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`group flex items-center px-4 py-3 rounded-2xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-lg shadow-primary-500/25 transform scale-105'
                      : 'text-text-secondary hover:bg-white/60 hover:text-primary-600 hover:shadow-md hover:transform hover:scale-105'
                  }`}
                >
                  <div className={`p-2 rounded-xl mr-3 transition-colors ${
                    isActive
                      ? 'bg-white/20'
                      : 'bg-neutral-100 group-hover:bg-primary-100'
                  }`}>
                    <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-text-secondary group-hover:text-primary-600'}`} />
                  </div>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm">
          <div className="flex h-20 items-center justify-between px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-3 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-300 text-text-secondary hover:text-primary-600"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center space-x-4">
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-3 rounded-2xl bg-white shadow-md hover:shadow-lg transition-all duration-300 relative"
                >
                  <Bell className="h-5 w-5 text-text-secondary" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-accent-500 to-primary-500 rounded-full animate-pulse" />
                </Button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center space-x-4 bg-white rounded-2xl px-4 py-2 shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div className="text-right">
                    <p className="text-sm font-semibold text-text-primary">{user?.name}</p>
                    <div className="flex items-center space-x-1">
                      <Crown className="h-3 w-3 text-accent-500" />
                      <p className="text-xs text-text-secondary">Administrator</p>
                    </div>
                  </div>
                  <div className="relative">
                    <img
                      className="h-10 w-10 rounded-2xl border-2 border-gradient-to-r from-primary-500 to-accent-500 shadow-lg"
                      src={user?.avatar || `https://ui-avatars.com/api/?name=${user?.name}&background=6366f1&color=fff`}
                      alt={user?.name}
                    />
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-2 border-white" />
                  </div>
                  <ChevronDown className="h-4 w-4 text-text-secondary" />
                </button>

                {/* User Dropdown */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/admin/profile"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User className="h-4 w-4 mr-3" />
                      My Profile
                    </Link>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        handleLogout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8 pb-24 lg:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation - only visible on mobile */}
      <div className="lg:hidden">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default AdminLayout;
