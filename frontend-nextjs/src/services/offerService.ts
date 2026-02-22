import { FirestoreService } from './firestore/firestoreService';

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
  validFrom: string;
  validUntil: string;
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

export interface OfferFilters {
  salonId?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  type?: string;
}

const offersFs = new FirestoreService<Offer>('offers');

export const offerService = {
  // Get all offers with optional filters
  async getAllOffers(filters?: OfferFilters): Promise<Offer[]> {
    try {
      const queryFilters: { field: string; op: any; value: any }[] = [];
      if (filters?.salonId) queryFilters.push({ field: 'salonId', op: '==', value: filters.salonId });
      if (filters?.isActive !== undefined) queryFilters.push({ field: 'isActive', op: '==', value: filters.isActive });
      if (filters?.isFeatured !== undefined) queryFilters.push({ field: 'isFeatured', op: '==', value: filters.isFeatured });
      if (filters?.type) queryFilters.push({ field: 'type', op: '==', value: filters.type });

      return await offersFs.getAll({ filters: queryFilters });
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch offers');
    }
  },

  // Get offer by ID
  async getOfferById(offerId: string): Promise<Offer> {
    try {
      return await offersFs.getById(offerId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch offer');
    }
  },

  // Create a new offer
  async createOffer(offerData: CreateOfferData): Promise<Offer> {
    try {
      return await offersFs.create(offerData as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create offer');
    }
  },

  // Update an offer
  async updateOffer(offerId: string, offerData: UpdateOfferData): Promise<Offer> {
    try {
      return await offersFs.update(offerId, offerData as any);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update offer');
    }
  },

  // Delete an offer
  async deleteOffer(offerId: string): Promise<void> {
    try {
      await offersFs.delete(offerId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete offer');
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
      case 'PERCENTAGE': return `${offer.value}% OFF`;
      case 'FIXED_AMOUNT': return `₹${offer.value} OFF`;
      case 'FREE_SERVICE': return 'FREE SERVICE';
      case 'BOGO': return 'Buy 1 Get 1';
      default: return `${offer.value}`;
    }
  },

  // Get offer type display name
  getOfferTypeDisplayName(type: string): string {
    switch (type) {
      case 'PERCENTAGE': return 'Percentage Discount';
      case 'FIXED_AMOUNT': return 'Fixed Amount Discount';
      case 'FREE_SERVICE': return 'Free Service';
      case 'BOGO': return 'Buy One Get One';
      default: return type;
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
    if (!offer.isActive) return 'text-gray-600 bg-gray-100';
    if (!this.isOfferValid(offer)) return 'text-red-600 bg-red-100';
    if (this.isOfferExpiringSoon(offer)) return 'text-yellow-600 bg-yellow-100';
    if (offer.isFeatured) return 'text-purple-600 bg-purple-100';
    return 'text-green-600 bg-green-100';
  },

  // Get offer status text
  getOfferStatusText(offer: Offer): string {
    if (!offer.isActive) return 'Inactive';
    if (!this.isOfferValid(offer)) return 'Expired';
    if (this.isOfferExpiringSoon(offer)) return 'Expiring Soon';
    if (offer.isFeatured) return 'Featured';
    return 'Active';
  },

  // Validate offer data
  validateOfferData(data: CreateOfferData | UpdateOfferData): string[] {
    const errors: string[] = [];
    if ('title' in data && data.title && data.title.trim().length < 3) errors.push('Title must be at least 3 characters long');
    if ('description' in data && data.description && data.description.trim().length < 10) errors.push('Description must be at least 10 characters long');
    if ('value' in data && data.value !== undefined && data.value < 0) errors.push('Value must be non-negative');
    if ('minPurchase' in data && data.minPurchase !== undefined && data.minPurchase < 0) errors.push('Minimum purchase must be non-negative');
    if ('validFrom' in data && 'validUntil' in data && data.validFrom && data.validUntil) {
      if (new Date(data.validUntil) <= new Date(data.validFrom)) errors.push('Valid until date must be after valid from date');
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
    return {
      totalOffers: offers.length,
      activeOffers: offers.filter((o) => this.isOfferValid(o)).length,
      featuredOffers: offers.filter((o) => o.isFeatured).length,
      expiredOffers: offers.filter((o) => !this.isOfferValid(o) && o.isActive).length,
      totalUsage: offers.reduce((sum, o) => sum + (o._count?.usedBy || 0), 0),
    };
  },

  // Validate coupon code
  async validateCouponCode(code: string, salonId?: string): Promise<{ valid: boolean; offer?: Offer; error?: string }> {
    try {
      const offers = await this.getActiveOffers();
      const offer = offers.find((o) => o.code === code);
      if (!offer) return { valid: false, error: 'Invalid coupon code' };
      if (!this.isOfferValid(offer)) return { valid: false, error: 'This coupon has expired' };
      if (offer.salonId && salonId && offer.salonId !== salonId) return { valid: false, error: 'This coupon is not valid for the selected salon' };
      return { valid: true, offer };
    } catch {
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
    if (offer.minPurchase && totalAmount < offer.minPurchase) {
      return { discountAmount: 0, finalAmount: totalAmount, applicable: false, reason: `Minimum purchase of ₹${offer.minPurchase} required` };
    }

    let discountAmount = 0;
    switch (offer.type) {
      case 'PERCENTAGE':
        discountAmount = (totalAmount * offer.value) / 100;
        if (offer.maxDiscount && discountAmount > offer.maxDiscount) discountAmount = offer.maxDiscount;
        break;
      case 'FIXED_AMOUNT':
        discountAmount = Math.min(offer.value, totalAmount);
        break;
      case 'FREE_SERVICE':
        discountAmount = Math.min(offer.value || totalAmount, totalAmount);
        break;
      case 'BOGO':
        discountAmount = totalAmount * 0.5;
        break;
      default:
        discountAmount = 0;
    }

    return { discountAmount, finalAmount: Math.max(0, totalAmount - discountAmount), applicable: true };
  },

  // Get customer-friendly offers
  async getCustomerOffers(salonId?: string): Promise<Offer[]> {
    try {
      const filters: OfferFilters = { isActive: true };
      if (salonId) filters.salonId = salonId;
      const offers = await this.getAllOffers(filters);
      return offers.filter((offer) => this.isOfferValid(offer));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch offers');
    }
  },

  // Get trending offers
  async getTrendingOffers(limit: number = 6): Promise<Offer[]> {
    try {
      const offers = await this.getActiveOffers();
      return offers
        .filter((offer) => this.isOfferValid(offer))
        .sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return (b._count?.usedBy || 0) - (a._count?.usedBy || 0);
        })
        .slice(0, limit);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch trending offers');
    }
  },

  // Get offers expiring soon
  async getExpiringSoonOffers(_days: number = 7): Promise<Offer[]> {
    try {
      const offers = await this.getActiveOffers();
      return offers.filter((offer) => this.isOfferValid(offer) && this.isOfferExpiringSoon(offer));
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch expiring offers');
    }
  },

  // Search offers by keyword
  async searchOffers(keyword: string, salonId?: string): Promise<Offer[]> {
    try {
      const offers = await this.getCustomerOffers(salonId);
      const searchLower = keyword.toLowerCase();
      return offers.filter(
        (offer) =>
          offer.title.toLowerCase().includes(searchLower) ||
          offer.description.toLowerCase().includes(searchLower) ||
          offer.salon?.name.toLowerCase().includes(searchLower) ||
          offer.code?.toLowerCase().includes(searchLower)
      );
    } catch (error: any) {
      throw new Error(error.message || 'Failed to search offers');
    }
  },

  // Get offer categories for filtering
  getOfferCategories(offers: Offer[]): {
    types: string[];
    salons: Array<{ id: string; name: string }>;
    valueRanges: Array<{ label: string; min: number; max: number }>;
  } {
    const types = Array.from(new Set(offers.map((o) => o.type)));
    const salons = Array.from(
      new Map(
        offers
          .filter((o) => o.salon)
          .map((o) => [o.salonId, { id: o.salonId!, name: o.salon!.name }])
      ).values()
    );
    const valueRanges = [
      { label: 'Up to 10%', min: 0, max: 10 },
      { label: '10% - 25%', min: 10, max: 25 },
      { label: '25% - 50%', min: 25, max: 50 },
      { label: '50% and above', min: 50, max: 100 },
    ];
    return { types, salons, valueRanges };
  },
};
