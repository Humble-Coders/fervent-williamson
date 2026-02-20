import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/cutq_test';

// Create test database instance
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Test data factory
export const testData = {
  // User test data
  adminUser: {
    email: 'admin@test.com',
    password: 'password123',
    name: 'Test Admin',
    role: 'ADMIN' as const,
    emailVerified: true,
    isActive: true,
  },
  
  salonOwner: {
    email: 'owner@test.com',
    password: 'password123',
    name: 'Test Owner',
    role: 'SALON_OWNER' as const,
    emailVerified: true,
    isActive: true,
  },
  
  customer: {
    email: 'customer@test.com',
    password: 'password123',
    name: 'Test Customer',
    role: 'CUSTOMER' as const,
    phone: '+1234567890',
    emailVerified: true,
    isActive: true,
  },

  // Salon test data
  salon: {
    displayId: 1,
    name: 'Test Salon',
    description: 'A test salon for testing purposes',
    address: '123 Test Street, Test City',
    phone: '+1234567890',
    email: 'salon@test.com',
    images: ['https://example.com/image1.jpg'],
    rating: 4.5,
    reviewCount: 10,
    amenities: ['WiFi', 'Parking'],
    specialties: ['Hair Care'],
    workingHours: {
      monday: { open: '09:00', close: '18:00', isOpen: true },
      tuesday: { open: '09:00', close: '18:00', isOpen: true },
      wednesday: { open: '09:00', close: '18:00', isOpen: true },
      thursday: { open: '09:00', close: '18:00', isOpen: true },
      friday: { open: '09:00', close: '18:00', isOpen: true },
      saturday: { open: '09:00', close: '17:00', isOpen: true },
      sunday: { open: '10:00', close: '16:00', isOpen: false },
    },
  },

  // Service test data
  service: {
    displayId: 1,
    name: 'Test Service',
    description: 'A test service',
    price: 50.00,
    duration: 60,
    emoji: '✂️',
    isActive: true,
  },

  // Stylist test data
  stylist: {
    displayId: 1,
    name: 'Test Stylist',
    email: 'stylist@test.com',
    phone: '+1234567891',
    specialties: ['Hair Cutting'],
    services: { 'Hair Cut': { price: 50, duration: 60 } },
    experience: 5,
    rating: 4.8,
    isActive: true,
  },

  // Booking test data
  booking: {
    date: new Date('2024-12-01'),
    startTime: '10:00',
    endTime: '11:00',
    status: 'CONFIRMED' as const,
    totalAmount: 50.00,
    notes: 'Test booking',
  },

  // System config test data
  systemConfig: {
    key: 'test_config',
    value: 'test_value',
    type: 'string' as const,
    category: 'test',
    name: 'Test Config',
    description: 'A test configuration',
    isActive: true,
  },
};

// Helper functions for test data creation
export const createTestUser = async (userData: any) => {
  const hashedPassword = await bcrypt.hash(userData.password, 10);
  return await testPrisma.user.create({
    data: {
      ...userData,
      password: hashedPassword,
    },
  });
};

export const createTestSalon = async (salonData: any, ownerId: string) => {
  return await testPrisma.salon.create({
    data: {
      ...salonData,
      ownerId,
    },
  });
};

export const createTestServiceCategory = async () => {
  return await testPrisma.serviceCategory.create({
    data: {
      name: 'Test Category',
      description: 'Test category description',
      emoji: '✂️',
      icon: 'scissors',
    },
  });
};

export const createTestService = async (serviceData: any, salonId: string, categoryId: string) => {
  return await testPrisma.service.create({
    data: {
      ...serviceData,
      salonId,
      categoryId,
    },
  });
};

export const createTestStylist = async (stylistData: any, salonId: string) => {
  return await testPrisma.stylist.create({
    data: {
      ...stylistData,
      salonId,
    },
  });
};

export const createTestBooking = async (bookingData: any, customerId: string, salonId: string, serviceId: string, stylistId: string) => {
  return await testPrisma.booking.create({
    data: {
      ...bookingData,
      customerId,
      salonId,
      serviceId,
      stylistId,
    },
  });
};

// Cleanup function
export const cleanupTestData = async () => {
  // Delete in correct order to respect foreign key constraints
  await testPrisma.booking.deleteMany();
  await testPrisma.review.deleteMany();
  await testPrisma.service.deleteMany();
  await testPrisma.stylist.deleteMany();
  await testPrisma.serviceCategory.deleteMany();
  await testPrisma.salon.deleteMany();
  await testPrisma.refreshToken.deleteMany();
  await testPrisma.user.deleteMany();
  await testPrisma.systemConfig.deleteMany();
};

// Setup and teardown hooks
beforeEach(async () => {
  await cleanupTestData();
});

afterAll(async () => {
  await cleanupTestData();
  await testPrisma.$disconnect();
});
