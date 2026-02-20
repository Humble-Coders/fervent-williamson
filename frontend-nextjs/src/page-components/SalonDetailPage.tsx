'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { generateSalonUrl, isSeoFriendlySalonUrl, createSlug } from '../utils/urlUtils';
// import SEOHead from '../components/seo/SEOHead';
import Breadcrumb from '../components/seo/Breadcrumb';
import { getSalonSEO } from '../utils/seoUtils';
import { buildBookingUrl } from '../utils/bookingUrlUtils';
import { Sparkles, Building, AlertCircle, RefreshCw, Search, User, Scissors } from 'lucide-react';
import { useSalonStore } from '../store/salonStore';
import { useAuthStore } from '../store/authStore';
import { useBookingStore } from '../store/bookingStore';
import SalonHeader from '../components/salon/SalonHeader';
import ServiceMenu from '../components/salon/ServiceMenu';
import StylistMenu from '../components/salon/StylistMenu';
import SalonInfo from '../components/salon/SalonInfo';
import ReviewsSection from '../components/salon/ReviewsSection';
import ReviewModal from '../components/salon/ReviewModal';
import BookingCartBar from '../components/booking/BookingCartBar';
import ConfirmDialog from '../components/common/ConfirmDialog';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

const SalonDetailPage: React.FC = () => {
  const params = useParams();
  const router = useRouter();

  // Extract salon ID from the slug array
  const slug = params.slug as string[];
  const id = slug?.length === 1 ? slug[0] : slug?.[1];
  const salonName = slug?.length > 1 ? slug[0] : undefined;
  const { isAuthenticated } = useAuthStore();
  const [viewMode, setViewMode] = useState<'services' | 'stylists'>('services');

  const {
    currentSalon,
    services,
    reviews,
    loading,
    error,
    showReviewModal,
    loadSalonData,

    writeReview,
    submitReview,
    setShowReviewModal,
  } = useSalonStore();

  const {
    selectedServices,
    selectedSalon: cartSalon,
    salonCarts,
    addService,
    removeService,
    updateServiceQuantity,
    switchSalon,
    clearServices,
  } = useBookingStore();

  const [showSwitchDialog, setShowSwitchDialog] = useState(false);
  const [pendingSalon, setPendingSalon] = useState<any>(null);

  useEffect(() => {
    if (id) {
      loadSalonData(id);
    }
  }, [id, loadSalonData]);

  // Redirect to SEO-friendly URL format
  useEffect(() => {
    if (currentSalon && currentSalon.name) {
      const currentPath = window.location.pathname;
      const isLegacyUrl = !isSeoFriendlySalonUrl(currentPath);

      if (isLegacyUrl) {
        // Redirect from legacy format (/salons/123) to SEO format (/salons/salon-name/123)
        const seoUrl = generateSalonUrl(currentSalon.name, id || '');
        router.replace(seoUrl);
      } else if (salonName && currentSalon.name) {
        // Verify the salon name in URL matches the actual salon name
        const expectedUrl = generateSalonUrl(currentSalon.name, id || '');
        if (currentPath !== expectedUrl) {
          router.replace(expectedUrl);
        }
      }
    }
  }, [currentSalon, id, salonName, router]);

  // Handle cross-salon prevention
  useEffect(() => {
    if (currentSalon && cartSalon) {
      // If user switches to a different salon
      if (currentSalon.id !== cartSalon.id) {
        const currentSalonCart = salonCarts[cartSalon.id] || [];

        // If current cart salon has items, show confirmation dialog
        if (currentSalonCart.length > 0) {
          setPendingSalon(currentSalon);
          setShowSwitchDialog(true);
        } else {
          // No items in current cart, switch directly
          switchSalon(currentSalon);
        }
      }
    } else if (currentSalon) {
      // First time setting salon
      switchSalon(currentSalon);
    }
  }, [currentSalon?.id]); // Only trigger when salon ID changes

  const handleConfirmSwitch = () => {
    if (pendingSalon) {
      switchSalon(pendingSalon);
      setShowSwitchDialog(false);
      setPendingSalon(null);
    }
  };

  const handleCancelSwitch = () => {
    // Navigate back to previous salon
    if (cartSalon) {
      const previousSalonUrl = generateSalonUrl(cartSalon.name, cartSalon.displayId || cartSalon.id);
      router.push(previousSalonUrl);
    }
    setShowSwitchDialog(false);
    setPendingSalon(null);
  };

  const handleBookNow = () => {
    // Navigate to booking page with all selected services encoded in URL
    const displayId = currentSalon?.displayId || id;

    // Convert selectedServices to URL format
    const serviceItems = selectedServices.map(item => ({
      serviceId: item.service.displayId?.toString() || item.service.id,
      subServiceId: item.subService?.displayId?.toString() || item.subService?.id,
      quantity: item.quantity || 1
    }));

    const bookingUrl = buildBookingUrl(displayId.toString(), serviceItems);
    router.push(bookingUrl);
  };

  const handleBookService = (serviceId: string, subServiceId?: string, stylistId?: string) => {
    // Add service to cart instead of navigating immediately
    const service = services.find(s => s.id === serviceId);
    if (!service) return;

    const subService = subServiceId
      ? service.subServices?.find(ss => ss.id === subServiceId)
      : null;

    const stylist = stylistId
      ? currentSalon?.stylists?.find(s => s.id === stylistId)
      : null;

    // Add service to cart
    addService(service, subService, stylist);
  };

  const handleWriteReview = () => {
    if (!isAuthenticated) {
      router.push('/welcome');
    } else {
      writeReview();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-secondary flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400 animate-bounce-soft" />
            Loading salon details...
            <Building className="w-5 h-5 text-accent-400 animate-bounce-soft" style={{ animationDelay: '1s' }} />
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
          <Button
            variant="primary"
            onClick={() => id && loadSalonData(id)}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Only show "not found" if we're not loading and there's no salon and no error
  if (!loading && !currentSalon && !error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <Search className="w-16 h-16 mx-auto mb-4 text-text-muted animate-bounce-soft" />
          <p className="text-text-secondary mb-4 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Salon not found
          </p>
          <Button
            variant="primary"
            onClick={() => router.push('/salons')}
            className="flex items-center gap-2"
          >
            <Building className="w-4 h-4" />
            Browse Salons
            <Sparkles className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Show loading state if we're loading or if we don't have salon data yet
  if (loading || !currentSalon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-secondary flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-primary-400 animate-bounce-soft" />
            Loading salon details...
            <Building className="w-5 h-5 text-accent-400 animate-bounce-soft" style={{ animationDelay: '1s' }} />
          </p>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  // Transform backend stylists data for the StylistMenu component
  const transformedStylists = currentSalon?.stylists?.map(stylist => ({
    id: stylist.id,
    name: stylist.name,
    specialties: stylist.specialties || [],
    experience: stylist.experience || 5,
    rating: stylist.rating || 4.5,
    reviewCount: Math.floor(Math.random() * 200) + 50, // TODO: Add review count to stylist API
    avatar: stylist.avatar, // Keep original avatar
    images: stylist.images || [], // Include stylist images array
    services: services.filter(service =>
      stylist.services?.some(stylistService =>
        stylistService.toLowerCase().includes(service.name.toLowerCase()) ||
        service.name.toLowerCase().includes(stylistService.toLowerCase())
      )
    ),
    isAvailable: Math.random() > 0.3, // TODO: Add availability to stylist API
    nextAvailable: Math.random() > 0.5 ? undefined : 'Tomorrow 10:00 AM',
  })) || [];

  // Prepare breadcrumb items
  const breadcrumbItems = [
    { name: 'Salons', url: '/salons' },
    { name: currentSalon.name, url: '', isActive: true }
  ];

  return (
    <>
      {/* <SEOHead
        seoData={getSalonSEO(currentSalon)}
        path={`/salons/${createSlug(currentSalon.name)}/${currentSalon.displayId || id}`}
      /> */}
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50">
        <div className="container-custom py-2 md:py-4 lg:py-8 px-2 md:px-4 lg:px-6 pb-32">
        {/* Salon Header */}
        <SalonHeader
          salon={currentSalon}
          onBookNow={handleBookNow}
          isAuthenticated={isAuthenticated}
        />

        {/* View Mode Toggle - Compact for mobile */}
        <div className="my-4 md:mb-6 flex justify-center">
          <div className="bg-white rounded-full p-1 shadow-soft border border-neutral-200 w-full max-w-sm sm:max-w-md">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode('services')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full font-medium transition-all duration-300 text-xs sm:text-sm ${
                  viewMode === 'services'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow'
                    : 'text-text-secondary hover:text-primary-600'
                }`}
              >
                <Scissors className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Browse Services</span>
                <span className="sm:hidden">Services</span>
              </button>
              <button
                onClick={() => setViewMode('stylists')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-full font-medium transition-all duration-300 text-xs sm:text-sm ${
                  viewMode === 'stylists'
                    ? 'bg-gradient-to-r from-primary-500 to-accent-500 text-white shadow-glow'
                    : 'text-text-secondary hover:text-primary-600'
                }`}
              >
                <User className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Choose Stylist First</span>
                <span className="sm:hidden">Stylists</span>
              </button>
            </div>
          </div>
        </div>

        {/* Service/Stylist Menu */}
        {viewMode === 'services' ? (
          <ServiceMenu
            services={services as any}
            onBookService={handleBookService}
            onRemoveService={removeService}
            onUpdateQuantity={updateServiceQuantity}
            isAuthenticated={isAuthenticated}
            selectedServices={selectedServices}
          />
        ) : (
          <StylistMenu
            stylists={transformedStylists as any}
            onBookService={handleBookService}
            isAuthenticated={isAuthenticated}
          />
        )}

        {/* Salon Information */}
        <SalonInfo salon={currentSalon} />

        {/* Reviews Section */}
        <ReviewsSection
          reviews={reviews as any}
          averageRating={averageRating}
          totalReviews={reviews.length}
          onWriteReview={handleWriteReview}
          isAuthenticated={isAuthenticated}
          salonId={currentSalon?.id}
          salonName={currentSalon?.name}
        />
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        onSubmit={submitReview}
        salonName={currentSalon?.name || ''}
        salonId={currentSalon?.id || ''}
        userBookings={[
          // Mock user bookings - in real app, this would come from user's booking history
          {
            id: 'booking-1',
            service: { name: 'Hair Cut & Style' },
            date: '2024-01-10',
            status: 'COMPLETED'
          },
          {
            id: 'booking-2',
            service: { name: 'Hair Color' },
            date: '2024-01-05',
            status: 'COMPLETED'
          }
        ]}
      />

      {/* Booking Cart Bar - Sticky Bottom */}
      <BookingCartBar
        services={selectedServices}
        onBookNow={handleBookNow}
        onClearCart={clearServices}
      />

      {/* Salon Switch Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showSwitchDialog}
        title={`${window.location.hostname} says`}
        message={`You have ${salonCarts[cartSalon?.id]?.length || 0} service(s) from ${cartSalon?.name} in your cart. Switching to ${pendingSalon?.name} will hide those services. Continue?`}
        confirmText="OK"
        cancelText="Cancel"
        onConfirm={handleConfirmSwitch}
        onCancel={handleCancelSwitch}
      />
      </div>
    </>
  );
};

export default SalonDetailPage;