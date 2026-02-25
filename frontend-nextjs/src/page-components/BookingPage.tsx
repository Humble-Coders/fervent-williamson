'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { logger } from '@/config/logger';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Check, Calendar, User, MapPin } from 'lucide-react';
import { useBookingStore } from '../store/bookingStore';
import { useAuthStore } from '../store/authStore';
import useAuthPrompt from '../hooks/useAuthPrompt';
import ServiceConfirmation from '../components/booking/ServiceConfirmation';
import ServiceCart from '../components/booking/ServiceCart';
import StylistSelection from '../components/booking/StylistSelection';
import DateTimePicker from '../components/booking/DateTimePicker';
import BookingSummary from '../components/booking/BookingSummary';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import LoginModal from '../components/auth/LoginModal';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

import { decodeServicesFromUrl } from '../utils/bookingUrlUtils';

// Define all possible booking steps
const ALL_BOOKING_STEPS = [
  {
    id: 'service',
    title: 'Service Details',
    description: 'Confirm your service and salon',
    icon: MapPin,
    component: 'ServiceConfirmation'
  },
  {
    id: 'stylist',
    title: 'Choose Stylist',
    description: 'Select your preferred stylist',
    icon: User,
    component: 'StylistSelection'
  },
  {
    id: 'datetime',
    title: 'Date & Time',
    description: 'Pick your appointment slot',
    icon: Calendar,
    component: 'DateTimePicker'
  },
  {
    id: 'review',
    title: 'Review & Place',
    description: 'Review your booking details',
    icon: Check,
    component: 'BookingSummary'
  }
];

const BookingPage: React.FC = () => {

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  // Multi-step state
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Payment modal state


  const {
    isLoginModalOpen,
    promptOptions,
    promptLogin,
    handleLoginSuccess,
    handleLoginCancel
  } = useAuthPrompt();
  
  const {selectedService,
    selectedServices,
    selectedSalon,
    selectedStylist,
    selectedDate,
    selectedTime,
    promoCode,
    discount,
    appliedOffer,
    couponValidationError,
    availableStylists,
    bookingConfig,
    isLoading,
    error,
    bookingId,
    setSelectedStylist,
    setSelectedDate,
    setSelectedTime,
    setPromoCode,
    confirmBooking,
    loadBookingData,
    loadBookingDataWithMultipleServices,
    loadBookingConfig,
    applyPromoCode,
    autoApplyCoupon,
    removeService,
    updateServiceQuantity,
  } = useBookingStore();

  // Dynamically determine which steps to show based on available stylists
  const BOOKING_STEPS = useMemo(() => {
    if (availableStylists.length === 0) {
      // Skip stylist selection step if no stylists are available
      return ALL_BOOKING_STEPS.filter(step => step.id !== 'stylist');
    }
    return ALL_BOOKING_STEPS;
  }, [availableStylists]);

  // Load booking data on mount (no authentication required for browsing)
  useEffect(() => {
    // Get salon and service IDs from URL query parameters
    const salonId = searchParams.get('salonId');
    const servicesParam = searchParams.get('services'); // New: encoded services
    const serviceId = searchParams.get('serviceId'); // Legacy: single service
    const subServiceId = searchParams.get('subServiceId');
    const stylistId = searchParams.get('stylistId');
    const couponCode = searchParams.get('coupon');

    if (salonId) {
      if (servicesParam) {
        // New format: Multiple services encoded in URL
        logger.info('Loading booking with multiple services from URL', { salonId, servicesParam });
        const decodedServices = decodeServicesFromUrl(servicesParam);

        // Load booking data with multiple services
        loadBookingDataWithMultipleServices(salonId, decodedServices);
      } else if (serviceId) {
        // Legacy format: Single service in URL
        logger.info('Loading booking data from URL params', { salonId, serviceId, subServiceId });
        loadBookingData(salonId, serviceId, stylistId || undefined, subServiceId || undefined);
      } else {
        // No services in URL - show error
        logger.warn('No services provided in URL');
      }
    }

    // Auto-apply coupon if provided in URL
    if (couponCode && couponCode.trim()) {
      autoApplyCoupon(couponCode.trim());
    }
  }, [searchParams]); // Intentionally not including loadBookingData to prevent duplicate calls

  // Reset booking when leaving page
  useEffect(() => {
    return () => {
      // Don't reset booking when navigating to confirmation page
      // Only reset when actually leaving the booking flow
    };
  }, []);

  // Step validation functions
  const isStepValid = (stepIndex: number): boolean => {
    const step = BOOKING_STEPS[stepIndex];
    if (!step) return false;

    switch (step.component) {
      case 'ServiceConfirmation':
        // Check for either multi-service cart or single service
        return !!((selectedServices.length > 0 || selectedService) && selectedSalon);
      case 'StylistSelection':
        return !!selectedStylist;
      case 'DateTimePicker':
        return !!(selectedDate && selectedTime);
      case 'BookingSummary':
        return true; // Always valid for review step
      default:
        return false;
    }
  };

  // Step navigation functions
  const goToNextStep = () => {
    if (currentStep < BOOKING_STEPS.length - 1 && isStepValid(currentStep)) {
      setCompletedSteps(prev => [...prev.filter(s => s !== currentStep), currentStep]);
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    // Allow going to any previous step or next step if current is valid
    if (stepIndex <= currentStep || (stepIndex === currentStep + 1 && isStepValid(currentStep))) {
      setCurrentStep(stepIndex);
    }
  };

  const handleConfirmBooking = async () => {
    // Check if user is authenticated before confirming booking
    if (!isAuthenticated) {
      promptLogin({
        title: "Sign in to confirm your booking",
        message: "Please sign in to complete your booking and secure your appointment",
        onSuccess: () => {
          logger.info('User successfully signed in!');
          // After successful login, proceed with booking
          proceedWithBooking();
        },
        onCancel: () => {
          // User cancelled login, stay on booking page
          logger.info('User cancelled login');
        }
      });
      return;
    }

    // User is authenticated, proceed with booking
    await proceedWithBooking();
  };

  const proceedWithBooking = async () => {
    logger.info('Placing booking...', {
      service: selectedService?.name,
      salon: selectedSalon?.name,
      date: selectedDate,
      time: selectedTime,
    });

    await confirmBooking();

    // Get the updated state after booking confirmation
    const { bookingId: updatedBookingId, error: updatedError } = useBookingStore.getState();

    logger.info('Booking result:', { bookingId: updatedBookingId, error: updatedError });

    // Only proceed if booking was successful
    if (updatedBookingId && !updatedError) {
      const params = new URLSearchParams({
        message: 'Booking placed successfully! Your appointment is confirmed.',
        bookingId: updatedBookingId
      });
      router.replace(`/appointments?${params.toString()}`);
    }
    // If booking failed, the error will be displayed in the UI automatically
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-text-secondary flex items-center justify-center gap-2">
            <span className="text-2xl animate-bounce-soft">📅</span>
            Loading booking details...
            <span className="text-2xl animate-bounce-soft" style={{ animationDelay: '1s' }}>✨</span>
          </p>
        </div>
      </div>
    );
  }

  // Show full-page error only for loading/configuration errors, not booking errors
  if (error && ((selectedServices.length === 0 && !selectedService) || !selectedSalon)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="flex flex-col text-center justify-center">
          <div className="text-6xl mb-4 animate-bounce-soft">❌</div>
          <p className="text-error-600 mb-4 flex items-center justify-center gap-2">
            {error}
          </p>
          <button
            onClick={() => loadBookingData()}
            className="btn btn-primary flex items-center gap-2"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Check if we have services selected (either multi-service or single service)
  const hasServices = selectedServices.length > 0 || selectedService;

  if (!hasServices || !selectedSalon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce-soft">🔍</div>
          <p className="text-text-secondary mb-4 flex items-center justify-center gap-2">
            <span>❓</span>
            {!selectedSalon ? 'Salon not found' : 'No services selected'}
            <span>❓</span>
          </p>
          <p className="text-text-muted text-sm mb-6">
            Please select at least one service to continue with booking
          </p>
          <button
            onClick={() => router.push('/salons')}
            className="btn btn-primary flex items-center gap-2"
          >
            <span>🏪</span>
            Browse Salons
            <span>✨</span>
          </button>
        </div>
      </div>
    );
  }

  // Render step content
  const renderStepContent = () => {
    const step = BOOKING_STEPS[currentStep];
    if (!step) return null;

    switch (step.component) {
      case 'ServiceConfirmation':
        return (
          <ServiceConfirmation
            service={selectedService}
            services={selectedServices}
            salon={selectedSalon}
            onRemoveService={removeService}
            onUpdateQuantity={updateServiceQuantity}
          />
        );
      case 'StylistSelection':
        return (
          <StylistSelection
            stylists={availableStylists}
            selectedStylist={selectedStylist?.id || null}
            onStylistSelect={(stylistId) => {
              const stylist = availableStylists.find(s => s.id === stylistId);
              setSelectedStylist(stylist || null);
            }}
          />
        );
      case 'DateTimePicker':
        return (
          <DateTimePicker
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onDateSelect={setSelectedDate}
            onTimeSelect={setSelectedTime}
            bookingConfig={bookingConfig as any}
          />
        );
      case 'BookingSummary':
        return (
          <BookingSummary
            service={selectedService}
            salon={selectedSalon}
            stylist={selectedStylist || undefined}
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            discount={discount}
            onConfirmBooking={handleConfirmBooking}
            onEditBooking={() => {}}
            isLoading={isLoading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-secondary via-white to-primary-50 pb-24 md:pb-8">
      <div className="container-custom py-4 sm:py-6 max-w-4xl mx-auto px-4 sm:px-6">
        {/* Page Header */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            Book Your Appointment
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Complete your booking in {BOOKING_STEPS.length} easy steps
          </p>
        </div>

        {/* Step Progress Indicator */}
        <div className="mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3">
            {BOOKING_STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === currentStep;
              const isCompleted = completedSteps.includes(index);
              const isAccessible = index <= currentStep || completedSteps.includes(index);

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <button
                    onClick={() => goToStep(index)}
                    disabled={!isAccessible}
                    className={`
                      w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mb-1 sm:mb-2 transition-all duration-200
                      ${isActive
                        ? 'bg-primary-500 text-white shadow-lg scale-105'
                        : isCompleted
                          ? 'bg-green-500 text-white'
                          : isAccessible
                            ? 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }
                    `}
                  >
                    {isCompleted ? (
                      <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                    ) : (
                      <Icon className="w-3 h-3 sm:w-4 sm:h-4" />
                    )}
                  </button>
                  <div className="text-center">
                    <p className={`text-xs font-medium ${isActive ? 'text-primary-600' : 'text-gray-600'} hidden sm:block`}>
                      {step.title}
                    </p>
                    <p className={`text-xs font-medium ${isActive ? 'text-primary-600' : 'text-gray-600'} sm:hidden`}>
                      {step.title.split(' ')[0]}
                    </p>
                    <p className="text-xs text-gray-500 hidden lg:block">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / BOOKING_STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && selectedService && selectedSalon && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
              <div className="text-red-500 text-xl">⚠️</div>
              <div className="flex-1">
                <h3 className="text-red-800 font-semibold mb-1">Booking Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button
                onClick={() => {/* Error will be cleared automatically */}}
                className="text-red-500 hover:text-red-700 text-xl"
                title="Dismiss"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-4 sm:mb-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-0">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStep === 0}
            size="sm"
            className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto order-2 sm:order-1"
          >
            <ChevronLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-sm">Previous</span>
          </Button>

          <div className="text-xs sm:text-sm text-gray-500 order-1 sm:order-2">
            Step {currentStep + 1} of {BOOKING_STEPS.length}
          </div>

          {currentStep < BOOKING_STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={goToNextStep}
              disabled={!isStepValid(currentStep)}
              size="sm"
              className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto order-3"
            >
              <span className="text-sm">Next</span>
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleConfirmBooking}
              disabled={!isStepValid(currentStep) || isLoading}
              size="sm"
              className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto order-3"
            >
              {isLoading ? (
                <>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Confirming...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="text-sm">Place Booking</span>
                </>
              )}
            </Button>
          )}
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


    </div>
  );
};

export default BookingPage;