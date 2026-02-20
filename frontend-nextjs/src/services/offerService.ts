import { api } from './api';

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SERVICE' | 'BOGO';
  value: number;
  code?: string;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string;
  validUntil: string;
  usageLimit?: number;
  salonId?: string;
  isActive: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  salon?: {
    id: string;
    name: string;
    address: string;
    images: string[];
  };
  _count?: {
    usedBy: number;
  };
}

export interface CreateOfferData {
  title: string;
  description: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SERVICE' | 'BOGO';
  value: number;
  code?: string;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom: string; // YYYY-MM-DD format
  validUntil: string; // YYYY-MM-DD format
  usageLimit?: number;
  salonId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface UpdateOfferData {
  title?: string;
  description?: string;
  type?: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SERVICE' | 'BOGO';
  value?: number;
  code?: string;
  minPurchase?: number;
  maxDiscount?: number;
  validFrom?: string;
  validUntil?: string;
  usageLimit?: number;
  salonId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
}

export interface OfferResponse {
  success: boolean;
  data: Offer;
  message: string;
}

export interface OffersResponse {
  success: boolean;
  data: Offer[];
  message: string;
}

export interface OfferFilters {
  salonId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  type?: string;
}

export const offerService = {
  // Get all offers with optional filters
  async getAllOffers(filters?: OfferFilters): Promise<Offer[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.salonId) params.append('salonId', filters.salonId);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
      if (filters?.isFeatured !== undefined) params.append('isFeatured', filters.isFeatured.toString());
      if (filters?.type) params.append('type', filters.type);

      const queryString = params.toString();
      const url = queryString ? `/offers?${queryString}` : '/offers';
      
      const response = await api.get<OffersResponse>(url);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch offers');
    }
  },

  // Get offer by ID
  async getOfferById(offerId: string): Promise<Offer> {
    try {
      const response = await api.get<OfferResponse>(`/offers/${offerId}`);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch offer');
    }
  },

  // Create a new offer
  async createOffer(offerData: CreateOfferData): Promise<Offer> {
    try {
      const response = await api.post<OfferResponse>('/offers', offerData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create offer');
    }
  },

  // Update an offer
  async updateOffer(offerId: string, offerData: UpdateOfferData): Promise<Offer> {
    try {
      const response = await api.put<OfferResponse>(`/offers/${offerId}`, offerData);
      return response.data.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update offer');
    }
  },

  // Delete an offer
  async deleteOffer(offerId: string): Promise<void> {
    try {
      await api.delete(`/offers/${offerId}`);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete offer');
    }
  },

  // Get active offers only
  async getActiveOffers(): Promise<Offer[]> {
    return this.getAllOffers({ isActive: true });
  },

  // Get featured offers
  async getFeaturedOffers(): Promise<Offer[]> {
    return this.getAllOffers({ isActive: true, isFeatured: true });
  },

  // Get offers by salon
  async getOffersBySalon(salonId: string): Promise<Offer[]> {
    return this.getAllOffers({ salonId, isActive: true });
  },

  // Format offer value for display
  formatOfferValue(offer: Offer): string {
    switch (offer.type) {
      case 'PERCENTAGE':
        return `${offer.value}% OFF`;
      case 'FIXED_AMOUNT':
        return `₹${offer.value} OFF`;
      case 'FREE_SERVICE':
        return 'FREE SERVICE';
      case 'BOGO':
        return 'Buy 1 Get 1';
      default:
        return `${offer.value}`;
    }
  },

  // Get offer type display name
  getOfferTypeDisplayName(type: string): string {
    switch (type) {
      case 'PERCENTAGE':
        return 'Percentage Discount';
      case 'FIXED_AMOUNT':
        return 'Fixed Amount Discount';
      case 'FREE_SERVICE':
        return 'Free Service';
      case 'BOGO':
        return 'Buy One Get One';
      default:
        return type;
    }
  },

  // Check if offer is valid (not expired)
  isOfferValid(offer: Offer): boolean {
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validUntil = new Date(offer.validUntil);
    
    return now >= validFrom && now <= validUntil && offer.isActive;
  },

  // Check if offer is expiring soon (within 7 days)
  isOfferExpiringSoon(offer: Offer): boolean {
    const now = new Date();
    const validUntil = new Date(offer.validUntil);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return validUntil <= sevenDaysFromNow && validUntil > now;
  },

  // Format offer dates for display
  formatOfferDates(offer: Offer): string {
    const validFrom = new Date(offer.validFrom).toLocaleDateString();
    const validUntil = new Date(offer.validUntil).toLocaleDateString();
    
    return `Valid from ${validFrom} to ${validUntil}`;
  },

  // Get offer status color for UI
  getOfferStatusColor(offer: Offer): string {
    if (!offer.isActive) {
      return 'text-gray-600 bg-gray-100';
    }
    if (!this.isOfferValid(offer)) {
      return 'text-red-600 bg-red-100';
    }
    if (this.isOfferExpiringSoon(offer)) {
      return 'text-yellow-600 bg-yellow-100';
    }
    if (offer.isFeatured) {
      return 'text-purple-600 bg-purple-100';
    }
    return 'text-green-600 bg-green-100';
  },

  // Get offer status text
  getOfferStatusText(offer: Offer): string {
    if (!offer.isActive) {
      return 'Inactive';
    }
    if (!this.isOfferValid(offer)) {
      return 'Expired';
    }
    if (this.isOfferExpiringSoon(offer)) {
      return 'Expiring Soon';
    }
    if (offer.isFeatured) {
      return 'Featured';
    }
    return 'Active';
  },

  // Validate offer data
  validateOfferData(data: CreateOfferData | UpdateOfferData): string[] {
    const errors: string[] = [];

    if ('title' in data && data.title && data.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long');
    }

    if ('description' in data && data.description && data.description.trim().length < 10) {
      errors.push('Description must be at least 10 characters long');
    }

    if ('value' in data && data.value !== undefined && data.value < 0) {
      errors.push('Value must be non-negative');
    }

    if ('minPurchase' in data && data.minPurchase !== undefined && data.minPurchase < 0) {
      errors.push('Minimum purchase must be non-negative');
    }

    if ('validFrom' in data && 'validUntil' in data && data.validFrom && data.validUntil) {
      const validFrom = new Date(data.validFrom);
      const validUntil = new Date(data.validUntil);
      
      if (validUntil <= validFrom) {
        errors.push('Valid until date must be after valid from date');
      }
    }

    return errors;
  },

  // Calculate offer metrics
  calculateOfferMetrics(offers: Offer[]): {
    totalOffers: number;
    activeOffers: number;
    featuredOffers: number;
    expiredOffers: number;
    totalUsage: number;
  } {
    const totalOffers = offers.length;
    const activeOffers = offers.filter(o => this.isOfferValid(o)).length;
    const featuredOffers = offers.filter(o => o.isFeatured).length;
    const expiredOffers = offers.filter(o => !this.isOfferValid(o) && o.isActive).length;
    const totalUsage = offers.reduce((sum, o) => sum + (o._count?.usedBy || 0), 0);

    return {
      totalOffers,
      activeOffers,
      featuredOffers,
      expiredOffers,
      totalUsage,
    };
  },

  // Customer-specific coupon functions

  // Validate coupon code
  async validateCouponCode(code: string, salonId?: string): Promise<{
    valid: boolean;
    offer?: Offer;
    error?: string;
  }> {
    try {
      // Get all active offers
      const offers = await this.getActiveOffers();

      // Find offer by code
      const offer = offers.find(o => o.code === code);

      if (!offer) {
        return { valid: false, error: 'Invalid coupon code' };
      }

      // Check if offer is valid (not expired)
      if (!this.isOfferValid(offer)) {
        return { valid: false, error: 'This coupon has expired' };
      }

      // Check salon-specific offers
      if (offer.salonId && salonId && offer.salonId !== salonId) {
        return { valid: false, error: 'This coupon is not valid for the selected salon' };
      }

      return { valid: true, offer };
    } catch (error: any) {
      return { valid: false, error: 'Failed to validate coupon code' };
    }
  },

  // Calculate discount amount
  calculateDiscount(offer: Offer, totalAmount: number): {
    discountAmount: number;
    finalAmount: number;
    applicable: boolean;
    reason?: string;
  } {
    // Check minimum purchase requirement
    if (offer.minPurchase && totalAmount < offer.minPurchase) {
      return {
        discountAmount: 0,
        finalAmount: totalAmount,
        applicable: false,
        reason: `Minimum purchase of ₹${offer.minPurchase} required`
      };
    }

    let discountAmount = 0;

    switch (offer.type) {
      case 'PERCENTAGE':
        discountAmount = (totalAmount * offer.value) / 100;
        // Apply max discount limit if specified
        if (offer.maxDiscount && discountAmount > offer.maxDiscount) {
          discountAmount = offer.maxDiscount;
        }
        break;

      case 'FIXED_AMOUNT':
        discountAmount = Math.min(offer.value, totalAmount);
        break;

      case 'FREE_SERVICE':
        // For free service, discount is the full amount up to the offer value
        discountAmount = Math.min(offer.value || totalAmount, totalAmount);
        break;

      case 'BOGO':
        // For BOGO, discount is 50% of the total (simplified implementation)
        discountAmount = totalAmount * 0.5;
        break;

      default:
        discountAmount = 0;
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);

    return {
      discountAmount,
      finalAmount,
      applicable: true
    };
  },

  // Get customer-friendly offers (active and valid only)
  async getCustomerOffers(salonId?: string): Promise<Offer[]> {
    try {
      const filters: OfferFilters = { isActive: true };
      if (salonId) {
        filters.salonId = salonId;
      }

      const offers = await this.getAllOffers(filters);

      // Filter only valid (not expired) offers
      return offers.filter(offer => this.isOfferValid(offer));
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch offers');
    }
  },

  // Get trending offers (most used or featured)
  async getTrendingOffers(limit: number = 6): Promise<Offer[]> {
    try {
      const offers = await this.getActiveOffers();

      // Sort by featured first, then by usage count, then by creation date
      const sortedOffers = offers
        .filter(offer => this.isOfferValid(offer))
        .sort((a, b) => {
          // Featured offers first
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;

          // Then by usage count
          const aUsage = a._count?.usedBy || 0;
          const bUsage = b._count?.usedBy || 0;
          if (bUsage !== aUsage) return bUsage - aUsage;

          // Finally by creation date
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

      return sortedOffers.slice(0, limit);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch trending offers');
    }
  },

  // Get offers expiring soon
  async getExpiringSoonOffers(days: number = 7): Promise<Offer[]> {
    try {
      const offers = await this.getActiveOffers();

      return offers.filter(offer =>
        this.isOfferValid(offer) && this.isOfferExpiringSoon(offer)
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch expiring offers');
    }
  },

  // Search offers by keyword
  async searchOffers(keyword: string, salonId?: string): Promise<Offer[]> {
    try {
      const offers = await this.getCustomerOffers(salonId);
      const searchLower = keyword.toLowerCase();

      return offers.filter(offer =>
        offer.title.toLowerCase().includes(searchLower) ||
        offer.description.toLowerCase().includes(searchLower) ||
        offer.salon?.name.toLowerCase().includes(searchLower) ||
        offer.code?.toLowerCase().includes(searchLower)
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to search offers');
    }
  },

  // Get offer categories for filtering
  getOfferCategories(offers: Offer[]): {
    types: string[];
    salons: Array<{ id: string; name: string }>;
    valueRanges: Array<{ label: string; min: number; max: number }>;
  } {
    const types = Array.from(new Set(offers.map(o => o.type)));
    const salons = Array.from(
      new Map(
        offers
          .filter(o => o.salon)
          .map(o => [o.salonId, { id: o.salonId!, name: o.salon!.name }])
      ).values()
    );

    const valueRanges = [
      { label: 'Up to 10%', min: 0, max: 10 },
      { label: '10% - 25%', min: 10, max: 25 },
      { label: '25% - 50%', min: 25, max: 50 },
      { label: '50% and above', min: 50, max: 100 }
    ];

    return { types, salons, valueRanges };
  }
};
