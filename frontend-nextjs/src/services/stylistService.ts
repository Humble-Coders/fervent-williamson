import { SubcollectionService } from './firestore/firestoreService';
import { auth } from '@/config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { Service } from './serviceService';

export interface Stylist {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  images?: string[];
  specialties: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  isActive: boolean;
  salonId: string;
  displayId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStylistData {
  name: string;
  email: string;
  phone: string;
  specialties: string[];
  serviceIds: string[];
  canDoAllServices: boolean;
  avatar?: string;
  images?: string[];
  experience?: number;
  isActive?: boolean;
}

export interface UpdateStylistData {
  name?: string;
  email?: string;
  phone?: string;
  specialties?: string[];
  serviceIds?: string[];
  canDoAllServices?: boolean;
  avatar?: string;
  images?: string[];
  experience?: number;
  isActive?: boolean;
}

const stylistsSubFs = new SubcollectionService<Stylist>('salons', 'stylists');

/**
 * Get the current user's salonId from their Firestore profile
 */
async function getOwnerSalonId(): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  const salonId = userDoc.data()?.salonId;
  if (!salonId) throw new Error('User does not own a salon');
  return salonId;
}

class StylistService {
  async getStylists(): Promise<Stylist[]> {
    const salonId = await getOwnerSalonId();
    return stylistsSubFs.getAll(salonId);
  }

  async getStylist(id: string): Promise<Stylist> {
    const salonId = await getOwnerSalonId();
    return stylistsSubFs.getById(salonId, id);
  }

  async createStylist(data: CreateStylistData): Promise<Stylist> {
    const salonId = await getOwnerSalonId();
    return stylistsSubFs.create(salonId, { ...data, salonId, rating: 0, reviewCount: 0, isActive: data.isActive ?? true } as any);
  }

  async updateStylist(id: string, data: UpdateStylistData): Promise<Stylist> {
    const salonId = await getOwnerSalonId();
    return stylistsSubFs.update(salonId, id, data as any);
  }

  async deleteStylist(id: string): Promise<void> {
    const salonId = await getOwnerSalonId();
    return stylistsSubFs.delete(salonId, id);
  }

  async toggleStylistStatus(id: string, isActive: boolean): Promise<Stylist> {
    const salonId = await getOwnerSalonId();
    return stylistsSubFs.update(salonId, id, { isActive } as any);
  }
}

export const stylistService = new StylistService();

// Helper: get salon services for stylist assignment
export const getSalonServices = async (): Promise<Service[]> => {
  const salonId = await getOwnerSalonId();
  const servicesSubFs = new SubcollectionService<Service>('salons', 'services');
  return servicesSubFs.getAll(salonId);
};
