'use client';

import React, { useEffect, useState } from 'react';
import {
  Scissors,
  Sparkles,
  User,
  Hand,
  Palette,
  Eye,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
// SEO is handled by Next.js metadata export in app/page.tsx
// // import SEOHead from '../components/seo/SEOHead';
// // import MetaTags from '../components/seo/MetaTags';
// import { getHomeSEO } from '../utils/seoUtils';
// // import { usePageTitle } from '../hooks/usePageTitle';
import { apiClient } from '../services/api';
import { useHomeStore } from '../store/homeStore';
import { useAuthStore } from '../store/authStore';
import HeroSection from '../components/home/HeroSection';
import SearchSection from '../components/home/SearchSection';
import ServiceCategories from '../components/home/ServiceCategories';
import FeaturedSalons from '../components/home/FeaturedSalons';
import SpecialOffers from '../components/home/SpecialOffers';
import UpcomingAppointments from '../components/home/UpcomingAppointments';
// import SearchDebug from '../components/debug/SearchDebug';

// Icon mapping for service categories
const iconMap = {
  scissors: Scissors,
  sparkles: Sparkles,
  user: User,
  hand: Hand,
  palette: Palette,
  eye: Eye,
  tag: Sparkles, // For spa services that use 'tag' icon
  // Also support capitalized versions for backward compatibility
  Scissors,
  Sparkles,
  User,
  Hand,
  Palette,
  Eye,
};

const HomePage: React.FC = () => {
  // Page title is handled by Next.js metadata export in app/page.tsx
  // // usePageTitle('Premium Beauty & Salon Services | Book Online');

  const {
    heroSlides,
    serviceCategories,
    featuredSalons,
    upcomingAppointments,
    specialOffers,
    searchQuery,
    loading,
    error,
    setSearchQuery,
    loadHomeData,
    loadUserAppointments,
    searchSalons,
    bookSalon,
    claimOffer,
    rescheduleAppointment,
    viewAppointmentDetails,
    selectServiceCategory,
  } = useHomeStore();

  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    loadHomeData();
  }, []); // Remove loadHomeData dependency to prevent re-renders

  // Load user appointments when authentication state changes
  useEffect(() => {
    if (isAuthenticated) {
      loadUserAppointments();
    }
  }, [isAuthenticated, loadUserAppointments]);

  // Map service categories with actual icons
  const categoriesWithIcons = serviceCategories.map(category => ({
    ...category,
    icon: iconMap[category.icon as keyof typeof iconMap] || Scissors,
  }));

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary-500" />
          <p className="text-text-secondary flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400 animate-bounce-soft" />
            Loading your beauty experience...
            <Palette className="w-5 h-5 text-accent-400 animate-bounce-soft" style={{ animationDelay: '1s' }} />
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-error-500 animate-bounce-soft" />
          <p className="text-error-600 mb-4 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {error}
          </p>
          <button
            onClick={loadHomeData}
            className="btn btn-primary flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
            <Sparkles className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* SEO is handled by Next.js metadata export in app/page.tsx */}
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50">
      <HeroSection
        slides={heroSlides}
        isAuthenticated={isAuthenticated}
      />

      <SearchSection
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearch={searchSalons}
      />

      <ServiceCategories
        categories={categoriesWithIcons}
        onCategoryClick={selectServiceCategory}
      />

      <FeaturedSalons
        salons={featuredSalons}
        onBookNow={bookSalon}
        isAuthenticated={isAuthenticated}
      />

      <SpecialOffers
        offers={specialOffers}
        onClaimOffer={claimOffer}
        isAuthenticated={isAuthenticated}
      />

      <UpcomingAppointments
        appointments={upcomingAppointments}
        onReschedule={rescheduleAppointment}
        onViewDetails={viewAppointmentDetails}
        isAuthenticated={isAuthenticated}
      />

      {/* Debug Component - Removed for production */}
      </div>
    </>
  );
};

export default HomePage;