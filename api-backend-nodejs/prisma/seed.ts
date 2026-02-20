import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { logger } from '../src/config/logger';

const prisma = new PrismaClient();

async function main() {
  logger.info('🌱 Starting minimal database seeding...');

  // Hash password for admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);

  // Create Admin User
  // const adminUser = await prisma.user.upsert({
  //   where: { email: 'admin@cutq.store' },
  //   update: {},
  //   create: {
  //     name: 'Admin User',
  //     email: 'admin@cutq.store',
  //     password: hashedPassword,
  //     phone: '+1234567890',
  //     role: UserRole.ADMIN,
  //     isActive: true,
  //   },
  // });

  // Create Salon Owner User
  // const salonOwnerUser = await prisma.user.upsert({
  //   where: { email: 'owner@luxebeauty.com' },
  //   update: {},
  //   create: {
  //     name: 'Salon Owner',
  //     email: 'owner@luxebeauty.com',
  //     password: hashedPassword,
  //     phone: '+1234567891',
  //     role: UserRole.SALON_OWNER,
  //     isActive: true,
  //   },
  // });

  // // Create essential Service Categories only
  // const serviceCategories = await Promise.all([
  //   prisma.serviceCategory.upsert({
  //     where: { name: 'Hair' },
  //     update: {},
  //     create: {
  //       name: 'Hair',
  //       icon: 'Scissors',
  //       color: 'from-primary-400 to-primary-600',
  //       emoji: '💇‍♀️',
  //       description: 'Cuts, colors & styling',
  //     },
  //   }),
  //   prisma.serviceCategory.upsert({
  //     where: { name: 'Nails' },
  //     update: {},
  //     create: {
  //       name: 'Nails',
  //       icon: 'Sparkles',
  //       color: 'from-accent-400 to-accent-600',
  //       emoji: '💅',
  //       description: 'Manicures & pedicures',
  //     },
  //   }),
  //   prisma.serviceCategory.upsert({
  //     where: { name: 'Facial' },
  //     update: {},
  //     create: {
  //       name: 'Facial',
  //       icon: 'User',
  //       color: 'from-purple-400 to-purple-600',
  //       emoji: '🧴',
  //       description: 'Skincare treatments',
  //     },
  //   }),
  //   prisma.serviceCategory.upsert({
  //     where: { name: 'Massage' },
  //     update: {},
  //     create: {
  //       name: 'Massage',
  //       icon: 'Hand',
  //       color: 'from-blue-400 to-blue-600',
  //       emoji: '💆‍♀️',
  //       description: 'Relaxation therapy',
  //     },
  //   }),
  //   prisma.serviceCategory.upsert({
  //     where: { name: 'Makeup' },
  //     update: {},
  //     create: {
  //       name: 'Makeup',
  //       icon: 'Palette',
  //       color: 'from-pink-400 to-pink-600',
  //       emoji: '💄',
  //       description: 'Beauty & glamour',
  //     },
  //   }),
  //   prisma.serviceCategory.upsert({
  //     where: { name: 'Eyebrows' },
  //     update: {},
  //     create: {
  //       name: 'Eyebrows',
  //       icon: 'Eye',
  //       color: 'from-green-400 to-green-600',
  //       emoji: '👁️',
  //       description: 'Shaping & threading',
  //     },
  //   }),
  // ]);

  // // Create sample salons for demonstration
  // const sampleSalons = await Promise.all([
  //   prisma.salon.create({
  //     data: {
  //       name: 'Luxe Beauty Studio',
  //       description: 'Premium salon experience with expert stylists',
  //       address: '123 Beauty Street, Downtown Plaza, NY 10001',
  //       latitude: 40.7128,
  //       longitude: -74.0060,
  //       phone: '+1 (555) 123-4567',
  //       email: 'info@luxebeautystudio.com',
  //       rating: 4.9,
  //       reviewCount: 234,
  //       images: [
  //         'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=1200',
  //         'https://images.pexels.com/photos/3992876/pexels-photo-3992876.jpeg?auto=compress&cs=tinysrgb&w=800',
  //       ],
  //       featured: true,
  //       distance: '0.5 mi',
  //       specialties: ['Hair Styling', 'Color Specialist', 'Bridal Makeup'],
  //       amenities: ['Free WiFi', 'Complimentary Drinks', 'Parking Available'],
  //       ownerId: salonOwnerUser.id, // Link to salon owner
  //       workingHours: {
  //         monday: { open: '09:00', close: '19:00' },
  //         tuesday: { open: '09:00', close: '19:00' },
  //         wednesday: { open: '09:00', close: '19:00' },
  //         thursday: { open: '09:00', close: '20:00' },
  //         friday: { open: '09:00', close: '20:00' },
  //         saturday: { open: '08:00', close: '18:00' },
  //         sunday: { open: '10:00', close: '17:00' },
  //       },
  //     },
  //   }),
  //   prisma.salon.create({
  //     data: {
  //       name: 'Elite Salon & Spa',
  //       description: 'Relaxation and beauty combined in our premium spa environment',
  //       address: '456 Spa Street, Westside Mall, NY 10002',
  //       latitude: 40.7589,
  //       longitude: -73.9851,
  //       phone: '+1 (555) 987-6543',
  //       email: 'info@elitesalonspa.com',
  //       rating: 4.8,
  //       reviewCount: 189,
  //       images: [
  //         'https://images.pexels.com/photos/3992876/pexels-photo-3992876.jpeg?auto=compress&cs=tinysrgb&w=800',
  //       ],
  //       featured: true,
  //       distance: '1.2 mi',
  //       specialties: ['Spa Treatments', 'Massage Therapy', 'Facial Treatments'],
  //       amenities: ['Spa Facilities', 'Relaxation Lounge', 'Steam Room'],
  //       workingHours: {
  //         monday: { open: '10:00', close: '20:00' },
  //         tuesday: { open: '10:00', close: '20:00' },
  //         wednesday: { open: '10:00', close: '20:00' },
  //         thursday: { open: '10:00', close: '20:00' },
  //         friday: { open: '10:00', close: '20:00' },
  //         saturday: { open: '09:00', close: '19:00' },
  //         sunday: { open: '11:00', close: '18:00' },
  //       },
  //     },
  //   }),
  // ]);

///
}

main()
  .catch((e) => {
    logger.error('❌ Error during seeding:', { error: e });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
