import { create } from 'zustand';
import { logger } from '@/config/logger';
import { devtools } from 'zustand/middleware';
import { bookingService, CreateBookingData } from '../services/bookingService';
import { salonService } from '../services/salonService';
import { offerService, Offer } from '../services/offerService';
import type { WorkingHours } from '../types';

interface SubService {
  id: string;
  displayId: number;
  name: string;
  description?: string;
  price: number;
  duration: number;
  images?: string[];
  isActive: boolean;
}

interface Service {
  id: string;
  displayId: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category?: string;
  emoji?: string;
  subServices?: SubService[];
}

interface Salon {
  id: string;
  displayId?: number; // Auto-increment ID for user-friendly URLs
  name: string;
  address: string;
  phone: string;
  rating: number;
  reviewCount: number;
  image: string;
}

interface Stylist {
  id: string;
  displayId?: number; // Auto-increment ID for user-friendly URLs
  name: string;
  avatar: string;
  rating: number;
  specialties: string[];
  experience: string;
  emoji: string;
}

interface BookingConfig {
  salon: {
    id: string;
    displayId?: number;
    name: string;
  };
  slotDuration: number;
  breakDuration: number;
  advanceBookingDays: number;
  minimumNoticeHours: number;
  bufferTime: number;
  maxBookingsPerDay: number;
  allowSameDayBooking: boolean;
  workingHours: any;
  timeSlots: string[];
}

interface SelectedServiceItem {
  service: Service;
  subService?: SubService | null;
  stylist?: Stylist | null;
  quantity?: number;
}

interface BookingState {
  // Current booking data - support both single and multiple services
  selectedService: Service | null; // Kept for backward compatibility
  selectedSubService: SubService | null; // Kept for backward compatibility
  selectedServices: SelectedServiceItem[]; // New: array of selected services
  selectedSalon: Salon | null;
  selectedStylist: Stylist | null; // Kept for backward compatibility
  selectedDate: string | null;
  selectedTime: string | null;
  promoCode: string;
  discount: number;
  appliedOffer: Offer | null;
  couponValidationError: string | null;

  // Available data
  availableStylists: Stylist[];
  bookingConfig: BookingConfig | null;
  // UI state
  currentStep: number;
  isLoading: boolean;
  error: string | null;
  bookingConfirmed: boolean;
  bookingId: string | null;
  verificationCode: string | null;

  // Cache to prevent duplicate API calls
  lastLoadedSalonId: string | null;

  // Salon-specific service carts (key: salonId, value: services array)
  salonCarts: Record<string, SelectedServiceItem[]>;

  // Actions
  setSelectedService: (service: Service) => void;
  setSelectedSubService: (subService: SubService | null) => void;
  setSelectedSalon: (salon: Salon) => void;
  setSelectedStylist: (stylist: Stylist | null) => void;
  setSelectedDate: (date: string) => void;
  setSelectedTime: (time: string) => void;
  setPromoCode: (code: string) => void;
  setDiscount: (discount: number) => void;
  // New actions for multi-service
  addService: (service: Service, subService?: SubService | null, stylist?: Stylist | null) => void;
  removeService: (serviceId: string, subServiceId?: string) => void;
  updateServiceQuantity: (serviceId: string, subServiceId: string | undefined, quantity: number) => void;
  updateServiceStylist: (serviceId: string, stylist: Stylist | null) => void;
  clearServices: () => void;
  // New actions for salon-specific carts
  switchSalon: (newSalon: Salon) => void;
  getCurrentSalonServices: () => SelectedServiceItem[];
  setAppliedOffer: (offer: Offer | null) => void;
  setCouponValidationError: (error: string | null) => void;
  setCurrentStep: (step: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  confirmBooking: () => Promise<void>;
  resetBooking: () => void;
  reset: () => void; // Complete reset for logout
  loadBookingData: (salonId?: string, serviceId?: string, stylistId?: string, subServiceId?: string) => Promise<void>;
  loadBookingDataWithMultipleServices: (salonId: string, services: Array<{ serviceId: string; subServiceId?: string; quantity?: number }>) => Promise<void>;
  loadBookingConfig: (salonId: string) => Promise<void>;
  loadAvailableTimes: (salonId: string, serviceId: string, stylistId?: string, date?: string) => Promise<string[]>;
  applyPromoCode: () => Promise<void>;
  autoApplyCoupon: (couponCode: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>()(
  devtools(
    (set, get) => ({
      // Initial state
      selectedService: null,
      selectedSubService: null,
      selectedServices: [], // New: empty array for multi-service
      selectedSalon: null,
      selectedStylist: null,
      selectedDate: null,
      selectedTime: null,
      promoCode: '',
      discount: 0,
      appliedOffer: null,
      couponValidationError: null,
      availableStylists: [],
      bookingConfig: null,
      currentStep: 1,
      isLoading: false,
      error: null,
      bookingConfirmed: false,
      bookingId: null,
      verificationCode: null,
      lastLoadedSalonId: null,
      salonCarts: {}, // New: salon-specific carts

      // Actions
      setSelectedService: (service) => set({
        selectedService: service,
        // Also update selectedServices array for consistency
        selectedServices: [{ service, subService: get().selectedSubService, stylist: get().selectedStylist }]
      }),
      setSelectedSubService: (subService) => set({ selectedSubService: subService }),
      setSelectedSalon: (salon) => set({ selectedSalon: salon }),
      setSelectedStylist: (stylist) => set({ selectedStylist: stylist }),
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedTime: (time) => set({ selectedTime: time }),
      setPromoCode: (code) => set({ promoCode: code }),
      setDiscount: (discount) => set({ discount }),
      setAppliedOffer: (offer) => set({ appliedOffer: offer }),
      setCouponValidationError: (error) => set({ couponValidationError: error }),
      setCurrentStep: (step) => set({ currentStep: step }),
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // New multi-service actions
      addService: (service, subService = null, stylist = null) => {
        const { selectedSalon, salonCarts } = get();

        if (!selectedSalon) {
          logger.warn('Cannot add service without selected salon');
          return;
        }

        const salonId = selectedSalon.id;
        const currentCart = salonCarts[salonId] || [];

        // Check if service already exists in current salon's cart
        const existingIndex = currentCart.findIndex(item =>
          item.service.id === service.id &&
          item.subService?.id === subService?.id
        );

        let updatedCart;
        if (existingIndex >= 0) {
          // If exists, increment quantity
          updatedCart = [...currentCart];
          updatedCart[existingIndex] = {
            ...updatedCart[existingIndex],
            quantity: (updatedCart[existingIndex].quantity || 1) + 1
          };
        } else {
          // Add new service with quantity 1
          updatedCart = [...currentCart, { service, subService, stylist, quantity: 1 }];
        }

        // Update salon-specific cart and selectedServices
        set({
          salonCarts: { ...salonCarts, [salonId]: updatedCart },
          selectedServices: updatedCart,
          // Update single service fields for backward compatibility
          selectedService: service,
          selectedSubService: subService,
          selectedStylist: stylist
        });
      },

      removeService: (serviceId, subServiceId) => {
        const { selectedSalon, salonCarts, selectedServices } = get();

        if (!selectedSalon) return;

        const salonId = selectedSalon.id;
        const updatedServices = selectedServices.filter(item =>
          !(item.service.id === serviceId && item.subService?.id === subServiceId)
        );

        set({
          salonCarts: { ...salonCarts, [salonId]: updatedServices },
          selectedServices: updatedServices,
          // Update single service fields if we removed the current one
          selectedService: updatedServices.length > 0 ? updatedServices[0].service : null,
          selectedSubService: updatedServices.length > 0 ? updatedServices[0].subService || null : null,
          selectedStylist: updatedServices.length > 0 ? updatedServices[0].stylist || null : null,
        });
      },

      updateServiceQuantity: (serviceId, subServiceId, quantity) => {
        const { selectedSalon, salonCarts, selectedServices } = get();

        if (!selectedSalon) return;

        if (quantity <= 0) {
          // Remove service if quantity is 0 or less
          get().removeService(serviceId, subServiceId);
        } else {
          const salonId = selectedSalon.id;
          const updatedServices = selectedServices.map(item =>
            item.service.id === serviceId && item.subService?.id === subServiceId
              ? { ...item, quantity }
              : item
          );
          set({
            salonCarts: { ...salonCarts, [salonId]: updatedServices },
            selectedServices: updatedServices
          });
        }
      },

      updateServiceStylist: (serviceId, stylist) => {
        const { selectedSalon, salonCarts, selectedServices } = get();

        if (!selectedSalon) return;

        const salonId = selectedSalon.id;
        const updatedServices = selectedServices.map(item =>
          item.service.id === serviceId ? { ...item, stylist } : item
        );
        set({
          salonCarts: { ...salonCarts, [salonId]: updatedServices },
          selectedServices: updatedServices
        });
      },

      clearServices: () => {
        const { selectedSalon, salonCarts } = get();

        if (selectedSalon) {
          const salonId = selectedSalon.id;
          set({
            salonCarts: { ...salonCarts, [salonId]: [] },
            selectedServices: [],
            selectedService: null,
            selectedSubService: null,
            selectedStylist: null,
          });
        } else {
          set({
            selectedServices: [],
            selectedService: null,
            selectedSubService: null,
            selectedStylist: null,
          });
        }
      },

      // Switch to a different salon and load its cart
      switchSalon: (newSalon) => {
        const { salonCarts } = get();
        const newSalonId = newSalon.id;
        const newSalonCart = salonCarts[newSalonId] || [];

        set({
          selectedSalon: newSalon,
          selectedServices: newSalonCart,
          selectedService: newSalonCart.length > 0 ? newSalonCart[0].service : null,
          selectedSubService: newSalonCart.length > 0 ? newSalonCart[0].subService || null : null,
          selectedStylist: newSalonCart.length > 0 ? newSalonCart[0].stylist || null : null,
        });
      },

      // Get current salon's services
      getCurrentSalonServices: () => {
        const { selectedSalon, salonCarts } = get();
        if (!selectedSalon) return [];
        return salonCarts[selectedSalon.id] || [];
      },

      confirmBooking: async (): Promise<boolean> => {
        const state = get();
        const { selectedSalon, selectedService, selectedSubService, selectedStylist, selectedServices, selectedDate, selectedTime, promoCode } = state;

        // Check if we have services to book
        const hasMultipleServices = selectedServices.length > 1;
        const hasServices = hasMultipleServices || selectedService;

        if (!selectedSalon || !hasServices || !selectedDate || !selectedTime) {
          set({ error: 'Missing required booking information' });
          return false;
        }

        set({ isLoading: true, error: null });

        try {
          let bookingData: CreateBookingData;

          if (hasMultipleServices) {
            // Multi-service booking
            bookingData = {
              salonId: selectedSalon.id,
              services: selectedServices.map(item => ({
                serviceId: item.service.id,
                subServiceId: item.subService?.id,
                stylistId: item.stylist?.id,
              })),
              date: selectedDate,
              time: selectedTime,
              promoCode: promoCode || undefined,
            };
          } else {
            // Single service booking (backward compatibility)
            bookingData = {
              salonId: selectedSalon.id,
              serviceId: selectedService!.id,
              subServiceId: selectedSubService?.id,
              stylistId: selectedStylist?.id,
              date: selectedDate,
              time: selectedTime,
              promoCode: promoCode || undefined,
            };
          }

          const booking = await bookingService.createBooking(bookingData);

          set({
            isLoading: false,
            bookingConfirmed: true,
            bookingId: booking.id,
            verificationCode: booking.verificationCode || null
          });

          return true;
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Booking failed'
          });
          return false;
        }
      },

      resetBooking: () => set({
        selectedService: null,
        selectedSubService: null,
        selectedServices: [],
        selectedSalon: null,
        selectedStylist: null,
        selectedDate: null,
        selectedTime: null,
        promoCode: '',
        discount: 0,
        appliedOffer: null,
        couponValidationError: null,
        availableStylists: [],
        bookingConfig: null,
        currentStep: 1,
        isLoading: false,
        error: null,
        bookingConfirmed: false,
        bookingId: null,
        verificationCode: null,
        lastLoadedSalonId: null,
      }),

      clearError: () => set({ error: null }),

      // Complete reset for logout
      reset: () => set({
        selectedService: null,
        selectedSubService: null,
        selectedSalon: null,
        selectedStylist: null,
        selectedDate: null,
        selectedTime: null,
        promoCode: '',
        discount: 0,
        appliedOffer: null,
        couponValidationError: null,
        availableStylists: [],
        bookingConfig: null,
        currentStep: 1,
        isLoading: false,
        error: null,
        bookingConfirmed: false,
        bookingId: null,
        verificationCode: null,
        lastLoadedSalonId: null,
      }),

      loadBookingConfig: async (salonId: string) => {
        try {
          // Read booking config directly from the salon Firestore doc
          const salon = await salonService.getSalonById(salonId);
          const workingHours: WorkingHours = salon.workingHours || {} as WorkingHours;

          // Generate time slots from working hours
          const timeSlots: string[] = [];
          const slotDuration = salon.slotDuration || 30;
          // Use Monday as reference for slot generation
          const refDay = workingHours.monday;
          if (refDay && !refDay.closed) {
            const [openH, openM] = refDay.open.split(':').map(Number);
            const [closeH, closeM] = refDay.close.split(':').map(Number);
            for (let m = openH * 60 + openM; m < closeH * 60 + closeM; m += slotDuration) {
              const h = Math.floor(m / 60);
              const min = m % 60;
              timeSlots.push(`${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
            }
          }

          const bookingConfig: BookingConfig = {
            salon: { id: salon.id, displayId: salon.displayId, name: salon.name },
            slotDuration,
            breakDuration: salon.breakDuration || 0,
            advanceBookingDays: salon.advanceBookingDays || 30,
            minimumNoticeHours: salon.minimumNoticeHours || 1,
            bufferTime: salon.bufferTime || 0,
            maxBookingsPerDay: salon.maxBookingsPerDay || 50,
            allowSameDayBooking: salon.allowSameDayBooking !== false,
            workingHours,
            timeSlots,
          };

          set({ bookingConfig });
        } catch (error) {
          logger.error('Error loading booking config:', error);
          set({ error: error instanceof Error ? error.message : 'Failed to load booking configuration' });
        }
      },

      loadBookingData: async (salonId?: string, serviceId?: string, stylistId?: string, subServiceId?: string) => {
        const state = get();

        // Prevent duplicate API calls for the same salon
        if (state.lastLoadedSalonId === salonId && state.selectedSalon && state.bookingConfig) {
          return;
        }

        set({ isLoading: true, error: null });

        try {
          if (!salonId) {
            set({ isLoading: false, error: 'Salon ID is required' });
            return;
          }

          // Load booking configuration first (this includes salon basic info)
          await get().loadBookingConfig(salonId);

          // Fetch detailed salon data from backend (supports both UUID and displayId)
          const salonData = await salonService.getSalonById(salonId);

          // Transform salon data
          const salon: Salon = {
            id: salonData.id,
            displayId: salonData.displayId, // Include displayId for user-friendly URLs
            name: salonData.name,
            address: salonData.address,
            phone: salonData.phone,
            rating: salonData.rating || 4.5,
            reviewCount: salonData.reviewCount || 0,
            image: salonData.images?.[0] || 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800'
          };

          // Find the selected service from salon's services (supports both UUID and displayId)
          let selectedService: Service | null = null;
          let selectedSubService: SubService | null = null;

          if (serviceId && (salonData as any).services) {
            const foundService = (salonData as any).services.find((s: any) =>
              s.id === serviceId || s.displayId?.toString() === serviceId
            );
            if (foundService) {
              // Transform sub-services if they exist
              const subServices: SubService[] = (foundService.subServices || []).map((subService: any) => ({
                id: subService.id,
                displayId: subService.displayId || 0,
                name: subService.name,
                description: subService.description,
                price: parseFloat(subService.price) || 0,
                duration: subService.duration,
                images: subService.images || [],
                isActive: subService.isActive
              }));

              selectedService = {
                id: foundService.id,
                displayId: foundService.displayId || 0,
                name: foundService.name,
                description: foundService.description,
                price: foundService.price,
                duration: foundService.duration,
                category: foundService.category?.name || 'General',
                emoji: foundService.emoji || '✨',
                subServices
              };

              // Find the selected sub-service if subServiceId is provided
              if (subServiceId && subServices.length > 0) {
                const foundSubService = subServices.find(ss =>
                  ss.id === subServiceId ||
                  foundService.subServices?.find((s: any) => s.displayId?.toString() === subServiceId)?.id === ss.id
                );
                selectedSubService = foundSubService || null;
              }
            }
          }

          // Transform stylists data
          const availableStylists: Stylist[] = ((salonData as any).stylists || []).map((stylist: any) => ({
            id: stylist.id,
            displayId: stylist.displayId, // Include displayId for user-friendly URLs
            name: stylist.name,
            avatar: stylist.avatar || 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=300',
            rating: stylist.rating || 4.5,
            specialties: stylist.specialties || [],
            experience: `${stylist.experience || 5} years`,
            emoji: '💇‍♀️' // Default emoji
          }));

          // Find the selected stylist if stylistId is provided (optional)
          let selectedStylist: Stylist | null = null;
          if (stylistId && availableStylists.length > 0) {
            const foundStylist = availableStylists.find(s =>
              s.id === stylistId || s.displayId?.toString() === stylistId
            );
            selectedStylist = foundStylist || null;
          }

          set({
            selectedSalon: salon,
            selectedService: selectedService,
            selectedSubService: selectedSubService, // Set the selected sub-service
            selectedStylist: selectedStylist, // Can be null if not provided or not found
            availableStylists,
            lastLoadedSalonId: salonId, // Cache the loaded salon ID
            isLoading: false
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load booking data'
          });
        }
      },

      loadBookingDataWithMultipleServices: async (salonId: string, services: Array<{ serviceId: string; subServiceId?: string; quantity?: number }>) => {
        set({ isLoading: true, error: null });

        try {
          // Load booking configuration first
          await get().loadBookingConfig(salonId);

          // Fetch detailed salon data
          const salonData = await salonService.getSalonById(salonId);

          // Transform salon data
          const salon: Salon = {
            id: salonData.id,
            displayId: salonData.displayId,
            name: salonData.name,
            address: salonData.address,
            phone: salonData.phone,
            rating: salonData.rating || 4.5,
            reviewCount: salonData.reviewCount || 0,
            image: salonData.images?.[0] || 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800'
          };

          // Transform stylists data
          const availableStylists: Stylist[] = ((salonData as any).stylists || []).map((stylist: any) => ({
            id: stylist.id,
            displayId: stylist.displayId,
            name: stylist.name,
            avatar: stylist.avatar || 'https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=300',
            rating: stylist.rating || 4.5,
            specialties: stylist.specialties || [],
            experience: `${stylist.experience || 5} years`,
            emoji: '💇‍♀️'
          }));

          // Build selectedServices array from URL-decoded services
          const selectedServiceItems: SelectedServiceItem[] = [];

          for (const item of services) {
            // Find service by ID or displayId
            const foundService = (salonData as any).services?.find((s: any) =>
              s.id === item.serviceId || s.displayId?.toString() === item.serviceId
            );

            if (foundService) {
              // Transform sub-services
              const subServices: SubService[] = (foundService.subServices || []).map((subService: any) => ({
                id: subService.id,
                displayId: subService.displayId || 0,
                name: subService.name,
                description: subService.description,
                price: parseFloat(subService.price) || 0,
                duration: subService.duration,
                images: subService.images || [],
                isActive: subService.isActive
              }));

              const service: Service = {
                id: foundService.id,
                displayId: foundService.displayId || 0,
                name: foundService.name,
                description: foundService.description,
                price: foundService.price,
                duration: foundService.duration,
                category: foundService.category?.name || 'General',
                emoji: foundService.emoji || '✨',
                subServices
              };

              // Find sub-service if specified
              let subService: SubService | null = null;
              if (item.subServiceId && subServices.length > 0) {
                subService = subServices.find(ss =>
                  ss.id === item.subServiceId ||
                  foundService.subServices?.find((s: any) => s.displayId?.toString() === item.subServiceId)?.id === ss.id
                ) || null;
              }

              selectedServiceItems.push({
                service,
                subService,
                stylist: null,
                quantity: item.quantity || 1
              });
            }
          }

          set({
            selectedSalon: salon,
            selectedServices: selectedServiceItems,
            selectedService: selectedServiceItems.length > 0 ? selectedServiceItems[0].service : null,
            selectedSubService: selectedServiceItems.length > 0 ? selectedServiceItems[0].subService : null,
            availableStylists,
            lastLoadedSalonId: salonId,
            isLoading: false
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load booking data'
          });
        }
      },

      loadAvailableTimes: async (salonId: string, serviceId: string, stylistId?: string, date?: string): Promise<string[]> => {
        try {
          // This is a simplified implementation - you might want to call a real API
          // For now, return some mock available times
          const times = [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
          ];

          // Filter out past times if date is today
          const today = new Date().toISOString().split('T')[0];
          if (date === today) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            return times.filter(time => time > currentTime);
          }

          return times;
        } catch (error) {
          logger.error('Failed to load available times:', error);
          return [];
        }
      },

      applyPromoCode: async () => {
        const { promoCode, selectedSalon, selectedService } = get();

        if (!promoCode.trim()) {
          set({
            couponValidationError: 'Please enter a coupon code',
            appliedOffer: null,
            discount: 0
          });
          return;
        }

        try {
          // Validate coupon code using offer service
          const validation = await offerService.validateCouponCode(
            promoCode,
            selectedSalon?.id
          );

          if (!validation.valid || !validation.offer) {
            set({
              couponValidationError: validation.error || 'Invalid coupon code',
              appliedOffer: null,
              discount: 0
            });
            return;
          }

          // Calculate discount based on service price
          const servicePrice = selectedService?.price || 0;
          const discountCalculation = offerService.calculateDiscount(validation.offer, servicePrice);

          if (!discountCalculation.applicable) {
            set({
              couponValidationError: discountCalculation.reason || 'Coupon not applicable',
              appliedOffer: null,
              discount: 0
            });
            return;
          }

          // Apply the coupon successfully
          set({
            appliedOffer: validation.offer,
            discount: discountCalculation.discountAmount,
            couponValidationError: null
          });

        } catch (error) {
          logger.error('Error validating coupon:', error);
          set({
            couponValidationError: 'Failed to validate coupon. Please try again.',
            appliedOffer: null,
            discount: 0
          });
        }
      },

      // Auto-apply coupon from URL parameter
      autoApplyCoupon: async (couponCode: string) => {
        set({ promoCode: couponCode });
        // Use the existing applyPromoCode function
        const { applyPromoCode } = get();
        await applyPromoCode();
      },
    }),
    {
      name: 'booking-store',
    }
  )
);