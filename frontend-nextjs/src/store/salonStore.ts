import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { salonService } from '../services/salonService';
import { reviewService } from '../services/reviewService';
import type { Salon as APISalon } from '../types';
import type { Review as APIReview } from '../services/reviewService';
import type { QueryDocumentSnapshot } from '../services/firestore/firestoreService';
import { extractErrorMessage } from '../utils/errorHandler';
import { getAbsoluteImageUrl, getAbsoluteImageUrls } from '../utils/imageUtils';

interface Salon {
  id: string;
  displayId: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  isOpen: boolean;
  featured: boolean;
  distance?: string;
  specialties?: string[];
  amenities?: string[];
  workingHours?: {
    [key: string]: { open: string; close: string; isOpen?: boolean };
  };
  mapsLink?: string;
  latitude?: number;
  longitude?: number;
  slotDuration?: number;
  breakDuration?: number;
  advanceBookingDays?: number;
  minimumNoticeHours?: number;
  // Computed fields for UI
  teamSize?: number;
  yearsInBusiness?: number;
  certifications?: string[];
  // API relations
  services?: any[];
  stylists?: any[];
  owner?: any;
}

interface SubService {
  id: string;
  displayId: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  images?: string[];
  isActive: boolean;
  serviceId: string;
  createdAt?: string;
  updatedAt?: string;
}

interface Service {
  id: string;
  displayId: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category?: string;
  categoryId?: string;
  categoryEmoji?: string; // Category emoji for display
  salonId?: string;
  isActive: boolean;
  emoji?: string;
  images?: string[]; // Service images
  popular?: boolean;
  gender?: 'MALE' | 'FEMALE' | 'UNISEX'; // Service gender specification
  createdAt?: string;
  updatedAt?: string;
  subServices?: SubService[]; // Sub-services for drill-down functionality
}

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  service: string;
  helpful?: number;
  verified?: boolean;
  emoji?: string;
  // API fields
  salonId?: string;
  bookingId?: string;
  userId?: string;
  createdAt?: string;
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
  booking?: {
    id: string;
    service: {
      name: string;
    };
  };
}

interface SalonState {
  // Data
  currentSalon: Salon | null;
  services: Service[];
  reviews: Review[];

  // UI State
  loading: boolean;
  error: string | null;
  showReviewModal: boolean;

  // Review pagination (cursor-based)
  reviewsLoading: boolean;
  reviewsPagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasMore: boolean;
    lastDoc: QueryDocumentSnapshot | null;
  };

  // Actions
  setCurrentSalon: (salon: Salon | null) => void;
  setServices: (services: Service[]) => void;
  setReviews: (reviews: Review[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setShowReviewModal: (show: boolean) => void;
  loadSalonData: (salonId: string) => Promise<void>;
  loadMoreReviews: () => Promise<void>;
  bookService: (serviceId: string) => void;
  writeReview: () => void;
  submitReview: (reviewData: { rating: number; comment: string; bookingId: string }) => Promise<void>;
}

export const useSalonStore = create<SalonState>()(
  devtools(
    (set, get) => ({
      // Initial state
      currentSalon: null,
      services: [],
      reviews: [],
      loading: false,
      error: null,
      showReviewModal: false,
      reviewsLoading: false,
      reviewsPagination: {
        page: 1,
        limit: 10,
        total: 0,
        pages: 0,
        hasMore: false,
        lastDoc: null,
      },

      // Actions
      setCurrentSalon: (salon) => set({ currentSalon: salon }),
      setServices: (services) => set({ services }),
      setReviews: (reviews) => set({ reviews }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      setShowReviewModal: (show) => set({ showReviewModal: show }),

      loadSalonData: async (salonId) => {
        set({ loading: true, error: null, reviewsPagination: { page: 1, limit: 10, total: 0, pages: 0, hasMore: false, lastDoc: null } });
        try {
          // Fetch real salon and reviews data from APIs
          const [apiSalon, reviewsData] = await Promise.all([
            salonService.getSalonById(salonId),
            reviewService.getReviewsBySalon(salonId, { pageSize: 10 }).catch(() => ({
              reviews: [],
              averageRating: 0,
              totalReviews: 0,
              pagination: { page: 1, limit: 10, total: 0, pages: 0 },
              lastDoc: null,
              hasMore: false,
            }))
          ]);

          // Transform API salon data to match our interface
          // Convert images to absolute URLs (backend already returns absolute URLs, but this ensures consistency)
          const absoluteImages = getAbsoluteImageUrls(apiSalon.images);

          const transformedSalon: Salon = {
            id: apiSalon.id,
            displayId: apiSalon.displayId, // Include displayId for user-friendly URLs
            name: apiSalon.name,
            description: apiSalon.description,
            address: apiSalon.address,
            phone: apiSalon.phone,
            email: apiSalon.email,
            image: absoluteImages[0] || 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200',
            images: absoluteImages,
            rating: apiSalon.rating || 4.5,
            reviewCount: apiSalon.reviewCount || 0,
            isOpen: apiSalon.isOpen,
            featured: apiSalon.featured,
            distance: '0.5 mi', // TODO: Calculate based on user location
            specialties: apiSalon.specialties || [],
            amenities: apiSalon.amenities || [],
            workingHours: (apiSalon.workingHours || {}) as any,
            mapsLink: apiSalon.mapsLink,
            latitude: apiSalon.latitude,
            longitude: apiSalon.longitude,
            slotDuration: (apiSalon as any).slotDuration,
            breakDuration: (apiSalon as any).breakDuration,
            advanceBookingDays: (apiSalon as any).advanceBookingDays,
            minimumNoticeHours: (apiSalon as any).minimumNoticeHours,
            // Computed fields
            teamSize: (apiSalon as any).stylists?.length || 0,
            yearsInBusiness: Math.floor((new Date().getTime() - new Date((apiSalon as any).createdAt || '2020-01-01').getTime()) / (1000 * 60 * 60 * 24 * 365)) || 1,
            certifications: (apiSalon as any).certifications || [],
            // Store API relations
            services: (apiSalon as any).services,
            stylists: (apiSalon as any).stylists,
            owner: (apiSalon as any).owner,
          };

          // Transform API services data
          const transformedServices: Service[] = ((apiSalon as any).services || []).map((service: any) => ({
            id: service.id,
            displayId: service.displayId, // Include displayId for user-friendly URLs
            name: service.name,
            description: service.description,
            price: parseFloat(service.price) || 0,
            duration: service.duration,
            category: service.category?.name || 'General',
            categoryId: service.categoryId,
            categoryEmoji: service.category?.emoji || '✨', // Include category emoji
            salonId: service.salonId,
            isActive: service.isActive,
            emoji: service.emoji || service.category?.emoji || '✨', // Use service emoji or fallback to category emoji
            images: service.images || [], // Include service images
            popular: service.popular || Math.random() > 0.7, // Use API popular field or fallback
            gender: service.gender || 'UNISEX', // Include gender field
            createdAt: service.createdAt,
            updatedAt: service.updatedAt,
            // Transform sub-services if they exist
            subServices: (service.subServices || []).map((subService: any) => ({
              id: subService.id,
              displayId: subService.displayId,
              name: subService.name,
              description: subService.description,
              price: parseFloat(subService.price) || 0,
              duration: subService.duration,
              images: subService.images || [],
              isActive: subService.isActive,
              serviceId: subService.serviceId,
              createdAt: subService.createdAt,
              updatedAt: subService.updatedAt,
            })),
          }));



          // Use transformed services from API, don't fall back to mock data
          const finalServices = transformedServices;

          // Transform API reviews data
          const transformedReviews: Review[] = (reviewsData.reviews || []).map((review: APIReview) => ({
            id: review.id,
            userName: review.user?.name || 'Anonymous',
            userAvatar: review.user?.avatar,
            rating: review.rating,
            comment: review.comment,
            date: new Date(review.createdAt || '').toLocaleDateString() || 'Recently',
            service: review.booking?.service?.name || 'Service',
            helpful: Math.floor(Math.random() * 20), // TODO: Add helpful votes to API
            verified: true, // All reviews from completed bookings are verified
            emoji: ['😍', '🥰', '😊', '✨', '🌟'][Math.floor(Math.random() * 5)],
            // Store API fields for future use
            salonId: review.salonId,
            bookingId: review.bookingId,
            userId: review.userId,
            createdAt: review.createdAt,
            user: review.user,
            booking: review.booking,
          }));



          // Use transformed reviews from API, don't fall back to mock data
          const finalReviews = transformedReviews;

          // Set pagination data (cursor-based)
          const pagination = reviewsData.pagination || { page: 1, limit: 10, total: finalReviews.length, pages: 1 };

          set({
            currentSalon: transformedSalon,
            services: finalServices,
            reviews: finalReviews,
            reviewsPagination: {
              ...pagination,
              hasMore: reviewsData.hasMore ?? (pagination.page < pagination.pages),
              lastDoc: reviewsData.lastDoc ?? null,
            },
            loading: false
          });
        } catch (error) {
          set({
            loading: false,
            error: extractErrorMessage(error)
          });
        }
      },

      loadMoreReviews: async () => {
        const { currentSalon, reviewsPagination, reviews } = get();
        if (!currentSalon || !reviewsPagination.hasMore || get().reviewsLoading) return;

        set({ reviewsLoading: true });
        try {
          // Use cursor-based pagination with lastDoc
          const reviewsData = await reviewService.getReviewsBySalon(currentSalon.id, {
            pageSize: reviewsPagination.limit,
            lastDoc: reviewsPagination.lastDoc,
          });

          // Transform API reviews data
          const transformedReviews: Review[] = (reviewsData.reviews || []).map((review: APIReview) => ({
            id: review.id,
            userName: review.user?.name || 'Anonymous',
            userAvatar: review.user?.avatar,
            rating: review.rating,
            comment: review.comment,
            date: new Date(review.createdAt || '').toLocaleDateString() || 'Recently',
            service: review.booking?.service?.name || 'Service',
            helpful: Math.floor(Math.random() * 20), // TODO: Add helpful votes to API
            verified: true, // All reviews from completed bookings are verified
            emoji: ['😍', '🥰', '😊', '✨', '🌟'][Math.floor(Math.random() * 5)],
            // Store API fields for future use
            salonId: review.salonId,
            bookingId: review.bookingId,
            userId: review.userId,
            createdAt: review.createdAt,
            user: review.user,
            booking: review.booking,
          }));

          set({
            reviews: [...reviews, ...transformedReviews],
            reviewsPagination: {
              ...reviewsData.pagination,
              hasMore: reviewsData.hasMore,
              lastDoc: reviewsData.lastDoc,
            },
            reviewsLoading: false,
          });
        } catch (error) {
          set({
            reviewsLoading: false,
            error: extractErrorMessage(error)
          });
        }
      },

      bookService: (serviceId) => {
        const { currentSalon } = get();
        if (currentSalon) {
          // Navigate to booking page with salon and service
          window.location.href = `/booking/${currentSalon.id}?service=${serviceId}`;
        }
      },

      writeReview: () => {
        set({ showReviewModal: true });
      },

      submitReview: async (reviewData) => {
        try {
          const { currentSalon } = get();
          if (!currentSalon) return;

          const newReview = await reviewService.createReview({
            salonId: currentSalon.id,
            bookingId: reviewData.bookingId,
            rating: reviewData.rating,
            comment: reviewData.comment,
          });

          // Transform the new review to match our interface
          const transformedReview: Review = {
            id: newReview.id,
            userName: newReview.user?.name || 'You',
            userAvatar: newReview.user?.avatar,
            rating: newReview.rating,
            comment: newReview.comment,
            date: 'Just now',
            service: newReview.booking?.service?.name || 'Service',
            helpful: 0,
            verified: true,
            emoji: '🌟',
            salonId: newReview.salonId,
            bookingId: newReview.bookingId,
            userId: newReview.userId,
            createdAt: newReview.createdAt,
            user: newReview.user,
            booking: newReview.booking,
          };

          // Add the new review to the list
          const { reviews } = get();
          set({
            reviews: [transformedReview, ...reviews],
            showReviewModal: false
          });

          // Reload salon data to get updated rating
          await get().loadSalonData(currentSalon.id);
        } catch (error) {
          set({ error: extractErrorMessage(error) });
        }
      },

      // Reset store to initial state (for logout)
      reset: () => {
        set({
          currentSalon: null,
          services: [],
          reviews: [],
          loading: false,
          error: null,
          showReviewModal: false,
          reviewsLoading: false,
          reviewsPagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0,
            hasMore: false,
            lastDoc: null,
          },
        });
      },
    }),
    {
      name: 'salon-store',
    }
  )
);