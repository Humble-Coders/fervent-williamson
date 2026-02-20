import { create } from 'zustand';
import { logger } from '@/config/logger';
import { devtools } from 'zustand/middleware';
import { salonService } from '../services/salonService';
import { categoryService } from '../services/categoryService';
import { bookingService } from '../services/bookingService';
import { offerService } from '../services/offerService';
import { useAuthStore } from './authStore';
import { getSalonMainImage, getAbsoluteImageUrls } from '../utils/imageUtils';
import { getCategorySlug } from '../utils/urlUtils';
import type { Salon as APISalon } from '../types';
import type { ServiceCategory as APIServiceCategory } from '../services/categoryService';

interface HeroSlide {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  emoji: string;
}

interface ServiceCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  emoji: string;
  description: string;
}

interface Salon {
  id: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  image: string;
  images?: string[];
  rating: number;
  reviewCount: number;
  distance?: string;
  services: string[];
  price: string;
  featured?: boolean;
  emoji: string;
  specialOffer?: string;
  openNow?: boolean;
  isOpen: boolean;
  specialties?: string[];
  amenities?: string[];
  mapsLink?: string;
  workingHours?: any;
  teamSize?: number;
  yearsInBusiness?: number;
}

interface Appointment {
  id: string;
  salonName: string;
  service: string;
  date: string;
  time: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  emoji: string;
  stylistName: string;
  location: string;
}

interface Offer {
  id: string;
  title: string;
  description: string;
  discount: string;
  badge: string;
  emoji: string;
  gradient: string;
}

interface HomeState {
  // Data
  heroSlides: HeroSlide[];
  serviceCategories: ServiceCategory[];
  featuredSalons: Salon[];
  allSalons: APISalon[]; // Store original API data to avoid re-fetching
  upcomingAppointments: Appointment[];
  specialOffers: Offer[];
  
  // UI State
  searchQuery: string;
  loading: boolean;
  error: string | null;
  
  // Actions
  setSearchQuery: (query: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  loadHomeData: () => Promise<void>;
  loadUserAppointments: () => Promise<void>;
  searchSalons: () => void;
  bookSalon: (salonId: string) => void;
  claimOffer: (offerId: string) => void;
  rescheduleAppointment: (appointmentId: string) => void;
  viewAppointmentDetails: (appointmentId: string) => void;
  selectServiceCategory: (categoryId: string) => void;
}

export const useHomeStore = create<HomeState>()(
  devtools(
    (set, get) => ({
      // Initial state with hero slides
      heroSlides: [
        {
          id: '1',
          image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200',
          title: 'Luxe Beauty Studio',
          subtitle: 'Premium salon experience',
          // emoji: '💇‍♀️'
        },
        {
          id: '2',
          image: 'https://images.pexels.com/photos/3992876/pexels-photo-3992876.jpeg?auto=compress&cs=tinysrgb&w=1200',
          title: 'Elite Salon & Spa',
          subtitle: 'Relaxation and beauty combined',
          // emoji: '🧖‍♀️'
        },
        {
          id: '3',
          image: 'https://images.pexels.com/photos/3993456/pexels-photo-3993456.jpeg?auto=compress&cs=tinysrgb&w=1200',
          title: 'Glamour Lounge',
          subtitle: 'Where beauty meets luxury',
          // emoji: '✨'
        }
      ],
      
      serviceCategories: [],
      
      featuredSalons: [],

      allSalons: [], // Store original API data to avoid re-fetching
      upcomingAppointments: [], // Start with empty array - will be populated from API if user has appointments
      
      specialOffers: [],
      
      searchQuery: '',
      loading: false,
      error: null,
      
      // Actions
      setSearchQuery: (query) => set({ searchQuery: query }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
      
      loadHomeData: async () => {
        set({ loading: true, error: null });
        try {
          // Fetch real data from APIs
          const [apiSalons, apiCategories, apiOffers] = await Promise.all([
            salonService.getAllSalons(),
            categoryService.getVisibleCategories().catch(() => []), // Use visible categories based on config
            offerService.getFeaturedOffers().catch(() => []) // Fallback to empty array if offers fail
          ]);

          // Note: User appointments are loaded separately in HomePage useEffect

          // Transform API salon data to match our interface
          const transformedSalons: Salon[] = apiSalons.map((salon: APISalon) => ({
            id: salon.id,
            displayId: salon.displayId, // Include displayId for user-friendly URLs
            name: salon.name,
            description: salon.description,
            address: salon.address,
            phone: salon.phone,
            email: salon.email,
            image: salon.images?.[0] || 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800',
            images: salon.images,
            rating: salon.rating || 4.5,
            reviewCount: salon.reviewCount || Math.floor(Math.random() * 200) + 50,
            distance: `${(Math.random() * 3 + 0.5).toFixed(1)} mi`, // Random distance for now
            services: salon.specialties || [],
            price: `From ₹${Math.floor(Math.random() * 500) + 300}`, // Random price range
            featured: salon.featured,
            emoji: salon.featured ? '💎' : '✨',
            specialOffer: salon.featured ? '20% OFF' : undefined,
            openNow: salon.isOpen,
            isOpen: salon.isOpen,
            specialties: salon.specialties,
            amenities: salon.amenities,
            mapsLink: salon.mapsLink,
            workingHours: salon.workingHours,
          }));

          // Transform API categories to match our interface
          const transformedCategories = apiCategories.map((category: APIServiceCategory) => ({
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color || 'from-primary-400 to-primary-600',
            emoji: category.emoji,
            description: category.description || `${category.name} services`,
          }));

          // Update featured salons with real data
          const featuredSalons = transformedSalons.filter(salon => salon.featured);

          // Transform API offers to match our interface
          const transformedOffers = apiOffers.map((offer: any) => ({
            id: offer.id,
            title: offer.title,
            description: offer.description,
            discount: offerService.formatOfferValue(offer),
            validUntil: new Date(offer.validUntil).toLocaleDateString(),
            emoji: offer.type === 'PERCENTAGE' ? '🎯' :
                   offer.type === 'FIXED_AMOUNT' ? '💰' :
                   offer.type === 'FREE_SERVICE' ? '🎁' : '🔥',
            color: 'from-purple-400 to-pink-500',
            featured: offer.isFeatured,
            code: offer.code,
          }));

          // Use real API data only
          const finalFeaturedSalons = featuredSalons.length > 0 ? featuredSalons : transformedSalons.slice(0, 4);
          const finalOffers = transformedOffers;

          set({
            allSalons: apiSalons, // Store original API data
            featuredSalons: finalFeaturedSalons,
            serviceCategories: transformedCategories,
            specialOffers: finalOffers as any,
            loading: false
          });
        } catch (error) {
          logger.error('Error loading home data:', error);
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to load salon data'
          });
        }
      },

      loadUserAppointments: async () => {
        try {
          const authStore = useAuthStore.getState();
          if (!authStore.isAuthenticated || !authStore.user) {
            set({ upcomingAppointments: [] });
            return;
          }

          const userBookings = await bookingService.getUserBookings();

          // Filter for upcoming appointments (not cancelled or completed)
          const upcomingBookings = userBookings.filter(booking =>
            booking.status === 'PENDING' || booking.status === 'CONFIRMED'
          );

          // Transform bookings to appointment format
          const appointments = upcomingBookings.map(booking => ({
            id: booking.id,
            salonName: booking.salon.name,
            service: booking.service.name,
            date: new Date(booking.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            time: booking.time,
            status: booking.status.toLowerCase() as 'confirmed' | 'pending' | 'cancelled',
            emoji: (booking.service as any).emoji || '✨',
            stylistName: booking.stylist?.name || 'Any Stylist',
            location: booking.salon.address,
          }));

          set({ upcomingAppointments: appointments });
        } catch (error) {
          logger.error('Error loading user appointments:', error);
          set({ upcomingAppointments: [] });
        }
      },

      searchSalons: async () => {
        const { searchQuery, allSalons } = get();
        if (!searchQuery.trim()) return;

        set({ loading: true, error: null });
        try {
          // Use cached salon data if available, otherwise fetch
          const salonsToSearch = allSalons.length > 0 ? allSalons : await salonService.getAllSalons();

          const filteredSalons = salonsToSearch.filter(salon =>
            salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            salon.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
            salon.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
            salon.specialties?.some(specialty =>
              specialty.toLowerCase().includes(searchQuery.toLowerCase())
            )
          );

          // Transform and update featured salons with search results
          const transformedSalons: Salon[] = filteredSalons.map((salon: APISalon) => ({
            id: salon.id,
            name: salon.name,
            description: salon.description,
            address: salon.address,
            phone: salon.phone,
            email: salon.email,
            image: getSalonMainImage(salon.images),
            images: salon.images,
            rating: salon.rating || 4.5,
            reviewCount: salon.reviewCount || Math.floor(Math.random() * 200) + 50,
            distance: `${(Math.random() * 3 + 0.5).toFixed(1)} mi`,
            services: salon.specialties || [],
            price: `From ₹${Math.floor(Math.random() * 500) + 300}`,
            featured: salon.featured,
            emoji: '🔍',
            openNow: salon.isOpen,
            isOpen: salon.isOpen,
            specialties: salon.specialties,
            amenities: salon.amenities,
            mapsLink: salon.mapsLink,
            workingHours: salon.workingHours,
          }));

          // Update allSalons cache if we fetched new data
          if (allSalons.length === 0) {
            set({ allSalons: salonsToSearch });
          }

          set({
            featuredSalons: transformedSalons,
            loading: false
          });

          logger.info(`Found ${transformedSalons.length} salons matching "${searchQuery}"`);
        } catch (error) {
          logger.error('Error searching salons:', error);
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to search salons'
          });
        }
      },
      
      bookSalon: (salonId) => {
        logger.info('Booking salon:', salonId);
        // Navigate to booking page with salon ID as query parameter
        // Use displayId if available, otherwise use UUID
        const salon = get().allSalons.find(s => s.id === salonId);
        const displayId = salon?.displayId || salonId;
        window.location.href = `/booking?salonId=${displayId}`;
      },
      
      claimOffer: (offerId) => {
        logger.info('Claiming offer:', offerId);
        // Implement offer claiming logic
      },
      
      rescheduleAppointment: (appointmentId) => {
        logger.info('Rescheduling appointment:', appointmentId);
        // Navigate to appointments page with reschedule action
        window.location.href = `/appointments?reschedule=${appointmentId}`;
      },

      viewAppointmentDetails: (appointmentId) => {
        logger.info('Viewing appointment details:', appointmentId);
        // Navigate to appointments page with specific appointment highlighted
        window.location.href = `/appointments?highlight=${appointmentId}`;
      },
      
      selectServiceCategory: async (categoryId) => {
        const { serviceCategories, allSalons } = get();
        const selectedCategory = serviceCategories.find(cat => cat.id === categoryId);

        if (!selectedCategory) return;

        set({ loading: true, error: null });
        try {
          // Use cached salon data if available, otherwise fetch
          const salonsToFilter = allSalons.length > 0 ? allSalons : await salonService.getAllSalons();

          const filteredSalons = salonsToFilter.filter(salon =>
            salon.specialties?.some(specialty =>
              specialty.toLowerCase().includes(selectedCategory.name.toLowerCase())
            )
          );

          // Transform filtered salons
          const transformedSalons: Salon[] = filteredSalons.map((salon: APISalon) => ({
            id: salon.id,
            name: salon.name,
            description: salon.description,
            address: salon.address,
            phone: salon.phone,
            email: salon.email,
            image: getSalonMainImage(salon.images),
            images: getAbsoluteImageUrls(salon.images),
            rating: salon.rating || 4.5,
            reviewCount: salon.reviewCount || Math.floor(Math.random() * 200) + 50,
            distance: `${(Math.random() * 3 + 0.5).toFixed(1)} mi`,
            services: salon.specialties || [],
            price: `From ₹${Math.floor(Math.random() * 500) + 300}`,
            featured: salon.featured,
            emoji: selectedCategory.emoji,
            openNow: salon.isOpen,
            isOpen: salon.isOpen,
            specialties: salon.specialties,
            amenities: salon.amenities,
            mapsLink: salon.mapsLink,
            workingHours: salon.workingHours,
          }));

          // Update allSalons cache if we fetched new data
          if (allSalons.length === 0) {
            set({ allSalons: salonsToFilter });
          }

          set({
            featuredSalons: transformedSalons,
            loading: false
          });

          logger.info(`Found ${transformedSalons.length} salons for category "${selectedCategory.name}"`);

          // Navigate to the services category page
          const categorySlug = getCategorySlug(selectedCategory.name);
          window.location.href = `/services/${categorySlug}`;
        } catch (error) {
          logger.error('Error filtering salons by category:', error);
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to filter salons'
          });
        }
      },
    }),
    {
      name: 'home-store',
    }
  )
);