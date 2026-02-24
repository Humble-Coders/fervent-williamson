import {
  FirestoreService,
  SubcollectionService,
  db,
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  limit,
} from './firestore/firestoreService';
import { logger } from '@/config/logger';
import {
  Salon,
  SalonWithRelations,
  CreateSalonData,
  WorkingHours,
  Service as SalonService,
  Stylist,
} from '../types';

// Re-export types for backward compatibility
export type { WorkingHours, SalonService as Service, Stylist, CreateSalonData };

const salonsFs = new FirestoreService<Salon>('salons');
const servicesSubFs = new SubcollectionService<SalonService>('salons', 'services');
const stylistsSubFs = new SubcollectionService<Stylist>('salons', 'stylists');

/**
 * Look up salon owner from users collection (role=SALON_OWNER, salonId=salon.id)
 */
async function getSalonOwner(salonId: string): Promise<{ name: string; email: string } | null> {
  const q = query(
    collection(db, 'users'),
    where('salonId', '==', salonId),
    where('role', '==', 'SALON_OWNER'),
    limit(1)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const data = snapshot.docs[0].data();
  return {
    name: data.name || 'Unknown',
    email: data.email || '',
  };
}

/**
 * Admin salon service using Firestore
 * Security rules enforce admin-only access
 */
class AdminSalonServiceClass {
  /**
   * Upload images (delegated to uploadService)
   */
  async uploadImages(files: File[], context?: {
    type: 'salon' | 'service' | 'stylist' | 'temp';
    salonId: string;
    entityId?: string;
  }): Promise<string[]> {
    logger.info('[FRONTEND] uploadImages called with:', {
      fileCount: files.length,
      context,
    });

    const { uploadService } = await import('./uploadService');
    const folder = context
      ? `${context.type}/${context.salonId}${context.entityId ? '/' + context.entityId : ''}`
      : 'salons';

    const results = await Promise.all(
      files.map((f) => uploadService.uploadImage(f, folder))
    );
    const urls = results.map((r) => r.url);

    logger.info('[FRONTEND] Final URLs:', urls);
    return urls;
  }

  /**
   * Upload images to temp folder
   */
  async uploadTempImages(files: File[]): Promise<string[]> {
    logger.info('[FRONTEND] uploadTempImages called');
    return this.uploadImages(files, { type: 'temp', salonId: '', entityId: '' });
  }

  /**
   * Organize temp images - with Firebase Storage, images are already permanent
   */
  async organizeImages(tempUrls: string[], _type: 'service' | 'stylist', _salonId: string, _entityId: string): Promise<string[]> {
    return tempUrls;
  }

  /**
   * Get all salons for admin
   */
  async getAllSalons(_params?: Record<string, any>): Promise<SalonWithRelations[]> {
    const salons = await salonsFs.getAll({
      sort: { field: 'createdAt', direction: 'desc' },
    });

    const enriched: SalonWithRelations[] = await Promise.all(
      salons.map(async (salon) => {
        try {
          const [services, stylists, owner] = await Promise.all([
            servicesSubFs.getAll(salon.id),
            stylistsSubFs.getAll(salon.id),
            getSalonOwner(salon.id),
          ]);
          return {
            ...salon,
            services,
            stylists,
            owner: owner ?? undefined,
            _count: {
              services: services.length,
              stylists: stylists.length,
              reviews: salon.reviewCount || 0,
              bookings: 0,
            },
          };
        } catch {
          return {
            ...salon,
            owner: (await getSalonOwner(salon.id)) ?? undefined,
            _count: { services: 0, stylists: 0, reviews: 0, bookings: 0 },
          };
        }
      })
    );

    return enriched;
  }

  /**
   * Get salon by ID
   */
  async getSalonById(id: string): Promise<SalonWithRelations> {
    const salon = await salonsFs.getById(id);
    const [services, stylists, owner] = await Promise.all([
      servicesSubFs.getAll(id),
      stylistsSubFs.getAll(id),
      getSalonOwner(id),
    ]);

    return {
      ...salon,
      services,
      stylists,
      owner: owner ?? undefined,
      _count: {
        services: services.length,
        stylists: stylists.length,
        reviews: salon.reviewCount || 0,
        bookings: 0,
      },
    };
  }

  /**
   * Get salon with complete data
   */
  async getSalonComplete(id: string): Promise<SalonWithRelations> {
    return this.getSalonById(id);
  }

  /**
   * Create salon
   */
  async createSalon(salonData: CreateSalonData): Promise<Salon> {
    logger.info('[FRONTEND] createSalon called');
    return salonsFs.create(salonData as any);
  }

  /**
   * Update salon
   */
  async updateSalon(id: string, salonData: Partial<CreateSalonData>): Promise<Salon> {
    return salonsFs.update(id, salonData as any);
  }

  /**
   * Delete salon
   */
  async deleteSalon(id: string): Promise<void> {
    await salonsFs.delete(id);
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
   * Get salon statistics
   */
  async getSalonStats(salonId: string): Promise<any> {
    const salon = await salonsFs.getById(salonId);
    return {
      rating: salon.rating || 0,
      reviewCount: salon.reviewCount || 0,
      isOpen: salon.isOpen,
    };
  }

  /**
   * Approve salon
   */
  async approveSalon(salonId: string): Promise<Salon> {
    return salonsFs.update(salonId, { isOpen: true } as any);
  }

  /**
   * Suspend salon
   */
  async suspendSalon(salonId: string, _reason?: string): Promise<Salon> {
    return salonsFs.update(salonId, { isOpen: false } as any);
  }

  /**
   * Create service (admin)
   */
  async createService(serviceData: any): Promise<any> {
    const salonId = serviceData.salonId;
    if (!salonId) throw new Error('salonId is required');
    return servicesSubFs.create(salonId, serviceData);
  }

  /**
   * Update service (admin)
   */
  async updateService(serviceId: string, serviceData: any): Promise<any> {
    const salonId = serviceData.salonId;
    if (!salonId) throw new Error('salonId is required');
    return servicesSubFs.update(salonId, serviceId, serviceData);
  }
}

// Create and export the admin service instance
export const adminSalonService = new AdminSalonServiceClass();
export default adminSalonService;
