// Test setup file for Jest
import { PrismaClient } from '@prisma/client';

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/salon_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-purposes-only';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret-key-for-testing-purposes-only';
process.env.SESSION_SECRET = 'test-session-secret-key-for-testing-purposes-only';
process.env.CORS_ORIGIN = 'http://localhost:3000';

// Global test timeout
jest.setTimeout(30000);

// Mock Prisma Client
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    $transaction: jest.fn(),
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    salon: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    service: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    booking: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
    review: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    serviceCategory: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    stylist: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    offer: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    payment: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    paymentMethod: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    refreshToken: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    loyaltyAccount: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    loyaltyTransaction: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    favorite: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    socialAccount: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    systemConfig: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })),
}));

// Mock external services
jest.mock('../services/otpService', () => ({
  sendSMS: jest.fn().mockResolvedValue({ success: true }),
  sendEmail: jest.fn().mockResolvedValue({ success: true }),
  validatePhoneNumber: jest.fn().mockReturnValue(true),
  validateEmail: jest.fn().mockReturnValue(true),
  generateOTP: jest.fn().mockReturnValue('123456'),
}));

// Mock JWT
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
  decode: jest.fn().mockReturnValue({ userId: 'test-user-id', email: 'test@example.com' }),
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn().mockResolvedValue(true),
  genSalt: jest.fn().mockResolvedValue('salt'),
}));

// Mock multer
jest.mock('multer', () => {
  const multer = () => ({
    single: () => (req: any, res: any, next: any) => {
      req.file = {
        fieldname: 'image',
        originalname: 'test.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: 1024,
        destination: 'uploads/',
        filename: 'test-123.jpg',
        path: 'uploads/test-123.jpg',
        buffer: Buffer.from('test'),
      };
      next();
    },
    array: () => (req: any, res: any, next: any) => {
      req.files = [
        {
          fieldname: 'images',
          originalname: 'test1.jpg',
          encoding: '7bit',
          mimetype: 'image/jpeg',
          size: 1024,
          destination: 'uploads/',
          filename: 'test1-123.jpg',
          path: 'uploads/test1-123.jpg',
          buffer: Buffer.from('test1'),
        },
      ];
      next();
    },
  });
  
  multer.diskStorage = jest.fn();
  multer.memoryStorage = jest.fn();
  
  return multer;
});

// Mock nodemailer
jest.mock('nodemailer', () => ({
  createTransporter: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' }),
  }),
}));

// Global test utilities
global.testUtils = {
  createMockUser: (overrides = {}) => ({
    id: 'test-user-id',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1234567890',
    role: 'CUSTOMER',
    isActive: true,
    emailVerified: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  createMockSalon: (overrides = {}) => ({
    id: 'test-salon-id',
    displayId: 1,
    name: 'Test Salon',
    description: 'A test salon',
    address: '123 Test St',
    phone: '+1234567890',
    email: 'salon@test.com',
    rating: 4.5,
    reviewCount: 10,
    images: ['test-image.jpg'],
    featured: false,
    isOpen: true,
    specialties: ['Hair'],
    amenities: ['WiFi'],
    teamSize: 5,
    yearsInBusiness: 3,
    certifications: [],
    workingHours: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  createMockService: (overrides = {}) => ({
    id: 'test-service-id',
    displayId: 1,
    name: 'Test Service',
    description: 'A test service',
    duration: 60,
    price: 50,
    categoryId: 'test-category-id',
    salonId: 'test-salon-id',
    isActive: true,
    images: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  createMockBooking: (overrides = {}) => ({
    id: 'test-booking-id',
    userId: 'test-user-id',
    salonId: 'test-salon-id',
    serviceId: 'test-service-id',
    date: '2024-01-15',
    time: '10:00',
    duration: 60,
    status: 'PENDING',
    totalPrice: 50,
    discount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
  
  createMockReview: (overrides = {}) => ({
    id: 'test-review-id',
    userId: 'test-user-id',
    salonId: 'test-salon-id',
    rating: 5,
    comment: 'Great service!',
    isVerified: true,
    helpfulCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  }),
};

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
  // Close any open connections
  await new Promise(resolve => setTimeout(resolve, 500));
});
