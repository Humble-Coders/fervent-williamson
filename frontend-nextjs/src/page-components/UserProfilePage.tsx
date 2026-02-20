'use client';
import React, { useState, useEffect } from 'react';
import { logger } from '@/config/logger';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Heart,
  Settings,
  ChevronRight,
  LogOut,
  Bell,
  Shield,
  CreditCard,
  HelpCircle,
  Gift,
  Crown,
  Camera
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import { useAuth } from '../hooks/useAuth';
import useAuthPrompt from '../hooks/useAuthPrompt';
import LoginModal from '../components/auth/LoginModal';
import userService, { UserWithStats } from '../services/userService';

const UserProfilePage: React.FC = () => {
  const { user, isAuthenticated } = useAuthStore();
  const { logout } = useAuth();
  const router = useRouter();
  const {
    isLoginModalOpen,
    promptOptions,
    promptLogin,
    handleLoginSuccess,
    handleLoginCancel
  } = useAuthPrompt();

  // State for dynamic data
  const [userProfile, setUserProfile] = useState<UserWithStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user profile data
  const fetchUserData = async () => {
    try {
      setLoading(true);
      const profileData = await userService.getProfile();
      setUserProfile(profileData);
    } catch (error) {
      logger.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prompt for login when page loads if user is not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      promptLogin({
        title: "Sign in to view your profile",
        message: "Please sign in to access your profile, bookings, and account settings",
        onSuccess: () => {
          // User logged in successfully, page will re-render with user data
        },
        onCancel: () => {
          // User cancelled login, redirect to home
          router.push('/');
        }
      });
    } else {
      // Fetch user data when authenticated
      fetchUserData();
    }
  }, [isAuthenticated, promptLogin, router]);

  // Get profile stats from userProfile or use defaults
  const profileStats = userProfile?.stats || {
    appointments: 0,
    favorites: 0,
    avgRating: 0,
    totalSpent: 0,
    totalBookings: 0,
    totalReviews: 0,
    level: 'Bronze',
    points: 0
  };

  // Menu items with their respective actions
  const menuItems = [
    {
      icon: User,
      label: 'Profile Details',
      description: 'View and edit your personal information',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      action: () => router.push('/profile-details')
    },
    {
      icon: Calendar,
      label: 'My Appointments',
      count: profileStats.totalBookings,
      description: 'View your booking history',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      action: () => router.push('/appointments')
    },
    {
      icon: Heart,
      label: 'Favorites',
      count: profileStats.favorites,
      description: 'Your favorite salons and services',
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      action: () => router.push('/favorites')
    },
    {
      icon: Gift,
      label: 'Rewards & Offers',
      count: profileStats.points,
      description: 'View your points and offers',
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      action: () => router.push('/rewards')
    },
    {
      icon: CreditCard,
      label: 'Payment Methods',
      description: 'Manage your payment options',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      action: () => router.push('/payment-methods')
    },
    {
      icon: Bell,
      label: 'Notifications',
      description: 'Manage notification preferences',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      action: () => router.push('/notifications')
    },
    {
      icon: Shield,
      label: 'Privacy & Security',
      description: 'Control your privacy settings',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      action: () => router.push('/privacy-security')
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      description: 'Get help and contact support',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      action: () => router.push('/help-support')
    },
    {
      icon: Settings,
      label: 'Account Settings',
      description: 'Manage your account preferences',
      color: 'text-gray-700',
      bgColor: 'bg-gray-50',
      action: () => router.push('/account-settings')
    }
  ];

  // Show loading state while login modal is open or user is being loaded
  if ((!user && isAuthenticated) || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading your profile...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, the login modal will be shown via useEffect
  if (!isAuthenticated) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
          <div className="text-center">
            <User className="w-16 h-16 text-neutral-400 mx-auto mb-4" />
            <p className="text-text-secondary">Please sign in to view your profile</p>
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={handleLoginCancel}
          onSuccess={handleLoginSuccess}
          title={promptOptions.title}
          message={promptOptions.message}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      {/* Desktop Container */}
      <div className="max-w-5xl mx-auto">
        {/* Compact Profile Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 md:rounded-2xl md:mt-6">
        {/* Decorative Elements */}
        <div className="absolute top-4 left-4 text-2xl opacity-20 animate-float">✨</div>
        <div className="absolute top-6 right-6 text-xl opacity-15 animate-bounce-soft">💎</div>
        <div className="absolute bottom-4 left-1/4 text-xl opacity-25 animate-pulse-soft">🌟</div>
        
        <div className="relative z-10 px-4 py-6">
          {/* VIP Badge */}
          <div className="flex justify-end mb-3">
            <div className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              <Crown className="w-3 h-3" />
              {profileStats.level}
            </div>
          </div>

          {/* Profile Info */}
          <div className="text-center text-white mb-4">
            {/* Avatar */}
            <div className="relative inline-block mb-3">
              <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-white/30 shadow-lg">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-primary-400 to-accent-400 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                <Camera className="w-3 h-3 text-gray-600" />
              </button>
            </div>

            {/* User Details */}
            <h1 className="text-xl font-bold mb-2">{user.name}</h1>
            
            <div className="space-y-1 text-white/90 text-sm">
              <div className="flex items-center justify-center gap-2">
                <Mail className="w-3 h-3" />
                <span>{user.email}</span>
              </div>
              {user.phone && (
                <div className="flex items-center justify-center gap-2">
                  <Phone className="w-3 h-3" />
                  <span>{user.phone}</span>
                </div>
              )}
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-3 h-3" />
                <span>
                  {user?.preferences?.preferredLocations?.[0] || 'Location not set'}
                </span>
              </div>
            </div>
          </div>

          {/* Compact Stats Grid */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="text-center">
              <div className="text-xl font-bold text-white">{profileStats.appointments}</div>
              <div className="text-xs text-white/80">Appointments</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{profileStats.favorites}</div>
              <div className="text-xs text-white/80">Favorites</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-white">{profileStats.avgRating.toFixed(1)}</div>
              <div className="text-xs text-white/80">Avg Rating</div>
            </div>
          </div>

          {/* Compact Progress Section */}
          <div className="bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="font-semibold text-sm">Loyalty Level: {profileStats.level}</h3>
                <p className="text-xs text-white/80">{profileStats.points} points earned</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold">{profileStats.totalSpent.toFixed(0)}</div>
                <div className="text-xs text-white/80">Total Spent</div>
              </div>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-yellow-400 to-orange-500 h-2 rounded-full"
                style={{ width: `${Math.min((profileStats.points / 1000) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

        {/* Menu Items - Grid on Desktop, List on Mobile */}
        <div className="px-4 py-6 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {menuItems.map((item, index) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full bg-white rounded-2xl p-4 md:p-5 shadow-sm border border-gray-100 hover:shadow-md hover:border-primary-200 transition-all duration-200 animate-slide-up group"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 md:gap-4 flex-1">
                    <div className={`w-11 h-11 md:w-12 md:h-12 rounded-xl ${item.bgColor} flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
                      <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                    </div>
                    <div className="text-left flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm md:text-base">{item.label}</h3>
                      {item.description && (
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden md:block">{item.description}</p>
                      )}
                      {item.count !== undefined && (
                        <p className="text-xs text-gray-500 mt-0.5 md:hidden">{item.count} items</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.count !== undefined && (
                      <div className="bg-primary-100 text-primary-700 px-2.5 py-1 rounded-full text-xs font-medium hidden md:block">
                        {item.count}
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Logout Button */}
      <div className="px-4 pb-6">
        <button
          onClick={logout}
          className="w-full bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 font-medium transition-colors text-sm"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>


    </div>
  );
};

export default UserProfilePage;