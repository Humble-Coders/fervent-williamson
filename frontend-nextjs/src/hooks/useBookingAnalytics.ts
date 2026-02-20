import { useCallback } from 'react';
import { useAnalytics } from './useAnalytics';

// Booking-specific analytics hook
export function useBookingAnalytics() {
  const { trackAction, trackConversion, trackBusinessEvent } = useAnalytics();

  // Track booking funnel steps
  const trackBookingStep = useCallback((
    step: 'salon_view' | 'service_selection' | 'stylist_selection' | 'datetime_selection' | 'booking_form' | 'payment' | 'confirmation',
    context: {
      salonId?: string;
      salonDisplayId?: number;
      serviceId?: string;
      serviceDisplayId?: number;
      stylistId?: string;
      stylistDisplayId?: number;
      bookingId?: string;
      bookingDisplayId?: number;
    },
    metadata?: Record<string, unknown>
  ) => {
    trackBusinessEvent('ACTION', `booking_${step}`, context, {
      funnelStep: step,
      ...metadata
    });
  }, [trackBusinessEvent]);

  // Track booking attempt
  const trackBookingAttempt = useCallback((
    context: {
      salonId: string;
      salonDisplayId: number;
      serviceId: string;
      serviceDisplayId: number;
      stylistId?: string;
      stylistDisplayId?: number;
    },
    bookingData: {
      date: string;
      time: string;
      totalPrice: number;
      duration: number;
    }
  ) => {
    trackBusinessEvent('ACTION', 'booking_attempt', context, {
      bookingData,
      timestamp: new Date().toISOString()
    });
  }, [trackBusinessEvent]);

  // Track successful booking
  const trackBookingSuccess = useCallback((
    context: {
      salonId: string;
      salonDisplayId: number;
      serviceId: string;
      serviceDisplayId: number;
      stylistId?: string;
      stylistDisplayId?: number;
      bookingId: string;
      bookingDisplayId: number;
    },
    bookingData: {
      date: string;
      time: string;
      totalPrice: number;
      duration: number;
      paymentMethod?: string;
    }
  ) => {
    trackConversion('booking_completed', {
      ...context,
      bookingData,
      conversionValue: bookingData.totalPrice
    });
  }, [trackConversion]);

  // Track booking cancellation
  const trackBookingCancellation = useCallback((
    context: {
      bookingId: string;
      bookingDisplayId: number;
      salonId: string;
      serviceId: string;
    },
    reason?: string
  ) => {
    trackBusinessEvent('ACTION', 'booking_cancelled', context, {
      cancellationReason: reason,
      timestamp: new Date().toISOString()
    });
  }, [trackBusinessEvent]);

  // Track booking reschedule
  const trackBookingReschedule = useCallback((
    context: {
      bookingId: string;
      bookingDisplayId: number;
      salonId: string;
      serviceId: string;
    },
    rescheduleData: {
      oldDate: string;
      oldTime: string;
      newDate: string;
      newTime: string;
    }
  ) => {
    trackBusinessEvent('ACTION', 'booking_rescheduled', context, {
      rescheduleData,
      timestamp: new Date().toISOString()
    });
  }, [trackBusinessEvent]);

  // Track service interest (viewing service details)
  const trackServiceInterest = useCallback((
    context: {
      salonId: string;
      salonDisplayId: number;
      serviceId: string;
      serviceDisplayId: number;
    },
    serviceData: {
      name: string;
      price: number;
      duration: number;
      category: string;
    }
  ) => {
    trackBusinessEvent('ACTION', 'service_viewed', context, {
      serviceData,
      timestamp: new Date().toISOString()
    });
  }, [trackBusinessEvent]);

  // Track stylist interest (viewing stylist details)
  const trackStylistInterest = useCallback((
    context: {
      salonId: string;
      salonDisplayId: number;
      stylistId: string;
      stylistDisplayId: number;
    },
    stylistData: {
      name: string;
      rating: number;
      experience: number;
      specialties: string[];
    }
  ) => {
    trackBusinessEvent('ACTION', 'stylist_viewed', context, {
      stylistData,
      timestamp: new Date().toISOString()
    });
  }, [trackBusinessEvent]);

  // Track salon interest (viewing salon details)
  const trackSalonInterest = useCallback((
    context: {
      salonId: string;
      salonDisplayId: number;
    },
    salonData: {
      name: string;
      rating: number;
      address: string;
      distance?: string;
    }
  ) => {
    trackBusinessEvent('ACTION', 'salon_viewed', context, {
      salonData,
      timestamp: new Date().toISOString()
    });
  }, [trackBusinessEvent]);

  // Track search behavior
  const trackSearch = useCallback((
    searchQuery: string,
    filters: {
      location?: string;
      category?: string;
      priceRange?: string;
      rating?: number;
      distance?: string;
    },
    results: {
      totalResults: number;
      resultTypes: string[];
    }
  ) => {
    trackAction('search_performed', {
      searchQuery,
      filters,
      results,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track filter usage
  const trackFilterUsage = useCallback((
    filterType: string,
    filterValue: string | number,
    resultCount: number
  ) => {
    trackAction('filter_applied', {
      filterType,
      filterValue,
      resultCount,
      timestamp: new Date().toISOString()
    });
  }, [trackAction]);

  // Track favorites
  const trackFavoriteAction = useCallback((
    action: 'add' | 'remove',
    context: {
      salonId: string;
      salonDisplayId: number;
    },
    salonData: {
      name: string;
      rating: number;
    }
  ) => {
    trackBusinessEvent('ACTION', `favorite_${action}`, context, {
      salonData,
      timestamp: new Date().toISOString()
    });
  }, [trackBusinessEvent]);

  // Track review submission
  const trackReviewSubmission = useCallback((
    context: {
      salonId: string;
      salonDisplayId: number;
      bookingId?: string;
      stylistId?: string;
    },
    reviewData: {
      rating: number;
      hasComment: boolean;
      service: string;
    }
  ) => {
    trackBusinessEvent('CONVERSION', 'review_submitted', context, {
      reviewData,
      timestamp: new Date().toISOString()
    });
  }, [trackBusinessEvent]);

  return {
    trackBookingStep,
    trackBookingAttempt,
    trackBookingSuccess,
    trackBookingCancellation,
    trackBookingReschedule,
    trackServiceInterest,
    trackStylistInterest,
    trackSalonInterest,
    trackSearch,
    trackFilterUsage,
    trackFavoriteAction,
    trackReviewSubmission
  };
}
