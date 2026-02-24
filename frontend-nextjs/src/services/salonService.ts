import {
  FirestoreService,
  SubcollectionService,
  docToObject,
  db,
  collection,
  query,
  where,
  getDocs,
} from './firestore/firestoreService';
import { auth } from '@/config/firebase';
import {
  Salon,
  SalonWithRelations,
  CreateSalonData,
  WorkingHours,
  Service as SalonService,
  Stylist,
  Review,
} from '../types';

// Re-export types for backward compatibility
export type { WorkingHours, SalonService as Service, Stylist, CreateSalonData };

const salonsFs = new FirestoreService<Salon>('salons');
const servicesSubFs = new SubcollectionService<SalonService>('salons', 'services');
const stylistsSubFs = new SubcollectionService<Stylist>('salons', 'stylists');
const reviewsFs = new FirestoreService<Review>('reviews');

/**
 * Salon service using Firestore
 */
class SalonServiceClass {
  /**
   * Get featured salons
   */
  async getFeatured(): Promise<Salon[]> {
    return salonsFs.getAll({
      filters: [{ field: 'featured', op: '==', value: true }],
    });
  }

  /**
   * Get salons with advanced filtering
   */
  async getWithFilters(params?: Record<string, any>): Promise<{ data: Salon[] }> {
    const filters: { field: string; op: any; value: any }[] = [];

    if (params?.isOpen !== undefined) {
      filters.push({ field: 'isOpen', op: '==', value: params.isOpen });
    }
    if (params?.featured !== undefined) {
      filters.push({ field: 'featured', op: '==', value: params.featured });
    }

    const data = await salonsFs.getAll({ filters });
    return { data };
  }

  /**
   * Get salon by display ID (user-friendly ID)
   */
  async getByDisplayId(displayId: number): Promise<Salon> {
    const results = await salonsFs.getAll({
      filters: [{ field: 'displayId', op: '==', value: displayId }],
      limitCount: 1,
    });
    if (results.length === 0) throw new Error(`Salon with displayId ${displayId} not found`);
    return results[0];
  }

  /**
   * Get salon with all related data (services, stylists, reviews)
   */
  async getWithRelations(id: string | number): Promise<SalonWithRelations> {
    const salonId = String(id);
    const [salon, services, stylists, reviewDocs] = await Promise.all([
      salonsFs.getById(salonId),
      servicesSubFs.getAll(salonId),
      stylistsSubFs.getAll(salonId),
      reviewsFs.getAll({
        filters: [{ field: 'salonId', op: '==', value: salonId }],
        sort: { field: 'createdAt', direction: 'desc' },
        limitCount: 10,
      }),
    ]);

    return {
      ...salon,
      services,
      stylists,
      reviews: reviewDocs,
      _count: {
        services: services.length,
        stylists: stylists.length,
        reviews: salon.reviewCount || reviewDocs.length,
        bookings: 0,
      },
    };
  }

  /**
   * Search salons by location (client-side distance filter for now)
   */
  async searchByLocation(
    latitude: number,
    longitude: number,
    radius: number = 10,
    _params?: Record<string, any>
  ): Promise<Salon[]> {
    const allSalons = await salonsFs.getAll({
      filters: [{ field: 'isOpen', op: '==', value: true }],
    });

    return allSalons.filter((salon) => {
      if (!salon.latitude || !salon.longitude) return false;
      const dist = this.calculateDistance(latitude, longitude, salon.latitude, salon.longitude);
      return dist <= radius;
    });
  }

  /**
   * Get salon availability for a specific date
   */
  async getAvailability(
    salonId: string | number,
    date: string,
    _serviceId?: string
  ): Promise<{
    date: string;
    availableSlots: Array<{
      time: string;
      available: boolean;
      stylistId?: string;
      stylistName?: string;
    }>;
  }> {
    const sid = String(salonId);
    const salon = await salonsFs.getById(sid);
    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof WorkingHours;
    const daySchedule = salon.workingHours?.[dayOfWeek];

    if (!daySchedule || daySchedule.closed) {
      return { date, availableSlots: [] };
    }

    const slots: Array<{ time: string; available: boolean }> = [];
    const [openH, openM] = daySchedule.open.split(':').map(Number);
    const [closeH, closeM] = daySchedule.close.split(':').map(Number);
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    for (let m = openMinutes; m < closeMinutes; m += 30) {
      const h = Math.floor(m / 60);
      const min = m % 60;
      slots.push({
        time: `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`,
        available: true,
      });
    }

    return { date, availableSlots: slots };
  }

  /**
   * Get salon services
   */
  async getServices(salonId: string | number): Promise<SalonService[]> {
    return servicesSubFs.getAll(String(salonId));
  }

  /**
   * Get salon stylists
   */
  async getStylists(salonId: string | number): Promise<Stylist[]> {
    return stylistsSubFs.getAll(String(salonId));
  }

  /**
   * Get salon reviews
   */
  async getReviews(salonId: string | number, _params?: Record<string, any>): Promise<Review[]> {
    return reviewsFs.getAll({
      filters: [{ field: 'salonId', op: '==', value: String(salonId) }],
      sort: { field: 'createdAt', direction: 'desc' },
    });
  }

  /**
   * Toggle salon featured status
   */
  async toggleFeatured(salonId: string | number): Promise<Salon> {
    const sid = String(salonId);
    const salon = await salonsFs.getById(sid);
    return salonsFs.update(sid, { featured: !salon.featured } as any);
  }

  /**
   * Get similar salons (by matching specialties)
   */
  async getSimilar(salonId: string | number, limit: number = 5): Promise<Salon[]> {
    const sid = String(salonId);
    const salon = await salonsFs.getById(sid);

    const allSalons = await salonsFs.getAll({
      filters: [{ field: 'isOpen', op: '==', value: true }],
      limitCount: limit + 5,
    });

    return allSalons
      .filter((s) => s.id !== sid)
      .sort((a, b) => {
        const aOverlap = a.specialties?.filter((sp: string) => salon.specialties?.includes(sp)).length || 0;
        const bOverlap = b.specialties?.filter((sp: string) => salon.specialties?.includes(sp)).length || 0;
        return bOverlap - aOverlap;
      })
      .slice(0, limit);
  }

  // Backward compatibility methods
  async getAllSalons(): Promise<Salon[]> {
    return salonsFs.getAll();
  }

  /**
   * Get salon by ID. Accepts either Firestore document ID (UUID) or displayId (numeric from URL).
   */
  async getSalonById(id: string): Promise<Salon> {
    const numericId = /^\d+$/.test(id) ? parseInt(id, 10) : NaN;
    if (!Number.isNaN(numericId)) {
      return this.getByDisplayId(numericId);
    }
    return salonsFs.getById(id);
  }

  async createSalon(salonData: CreateSalonData): Promise<Salon> {
    return salonsFs.create(salonData as any);
  }

  async updateSalon(id: string, salonData: Partial<CreateSalonData>): Promise<Salon> {
    return salonsFs.update(id, salonData as any);
  }

  async deleteSalon(id: string): Promise<void> {
    return salonsFs.delete(id);
  }

  /**
   * Upload salon images (delegated to uploadService)
   */
  async uploadImages(files: File[]): Promise<string[]> {
    const { uploadService } = await import('./uploadService');
    const results = await Promise.all(
      files.map((f) => uploadService.uploadImage(f, 'salons'))
    );
    return results.map((r) => r.url);
  }

  // Haversine distance calculation (km)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// Create and export the service instance
export const salonService = new SalonServiceClass();
export default salonService;
