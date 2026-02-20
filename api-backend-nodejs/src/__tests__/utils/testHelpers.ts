// Test helper utilities
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { Express } from 'express';
import { env } from '../../config/env';

// ============================================================================
// AUTH HELPERS
// ============================================================================

export const generateTestToken = (payload: any = {}) => {
  const defaultPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'CUSTOMER',
  };
  
  return jwt.sign(
    { ...defaultPayload, ...payload },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

export const generateAdminToken = () => {
  return generateTestToken({
    userId: 'admin-user-id',
    email: 'admin@example.com',
    role: 'ADMIN',
  });
};

export const generateSalonOwnerToken = () => {
  return generateTestToken({
    userId: 'cutq-owner-id',
    email: 'owner@example.com',
    role: 'SALON_OWNER',
  });
};

// ============================================================================
// REQUEST HELPERS
// ============================================================================

export const makeAuthenticatedRequest = (app: Express, token?: string) => {
  const authToken = token || generateTestToken();
  return request(app).set('Authorization', `Bearer ${authToken}`);
};

export const makeAdminRequest = (app: Express) => {
  const adminToken = generateAdminToken();
  return request(app).set('Authorization', `Bearer ${adminToken}`);
};

export const makeSalonOwnerRequest = (app: Express) => {
  const ownerToken = generateSalonOwnerToken();
  return request(app).set('Authorization', `Bearer ${ownerToken}`);
};

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

export const expectSuccessResponse = (response: any, expectedData?: any) => {
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  if (expectedData) {
    expect(response.body.data).toMatchObject(expectedData);
  }
};

export const expectErrorResponse = (response: any, expectedStatus: number, expectedMessage?: string) => {
  expect(response.status).toBe(expectedStatus);
  expect(response.body.success).toBe(false);
  if (expectedMessage) {
    expect(response.body.message).toContain(expectedMessage);
  }
};

export const expectValidationError = (response: any, field?: string) => {
  expect(response.status).toBe(400);
  expect(response.body.success).toBe(false);
  expect(response.body.errors).toBeDefined();
  if (field) {
    expect(response.body.errors.some((error: any) => error.field === field)).toBe(true);
  }
};

export const expectUnauthorizedResponse = (response: any) => {
  expect(response.status).toBe(401);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toContain('Unauthorized');
};

export const expectForbiddenResponse = (response: any) => {
  expect(response.status).toBe(403);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toContain('Forbidden');
};

export const expectNotFoundResponse = (response: any) => {
  expect(response.status).toBe(404);
  expect(response.body.success).toBe(false);
  expect(response.body.message).toContain('not found');
};

// ============================================================================
// DATA HELPERS
// ============================================================================

export const createTestUser = (overrides = {}) => ({
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  phone: '+1234567890',
  role: 'CUSTOMER',
  isActive: true,
  emailVerified: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestSalon = (overrides = {}) => ({
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
  workingHours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '10:00', close: '16:00', closed: false },
    sunday: { open: '10:00', close: '16:00', closed: true },
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestService = (overrides = {}) => ({
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
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestBooking = (overrides = {}) => ({
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
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestReview = (overrides = {}) => ({
  id: 'test-review-id',
  userId: 'test-user-id',
  salonId: 'test-salon-id',
  rating: 5,
  comment: 'Great service!',
  isVerified: true,
  helpfulCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createTestServiceCategory = (overrides = {}) => ({
  id: 'test-category-id',
  name: 'Hair Services',
  description: 'Hair cutting and styling services',
  icon: 'scissors',
  emoji: '✂️',
  isActive: true,
  sortOrder: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

// ============================================================================
// MOCK HELPERS
// ============================================================================

export const mockPrismaMethod = (model: string, method: string, returnValue: any) => {
  const prisma = require('@prisma/client').PrismaClient;
  const mockPrisma = new prisma();
  mockPrisma[model][method].mockResolvedValue(returnValue);
  return mockPrisma;
};

export const mockPrismaError = (model: string, method: string, error: Error) => {
  const prisma = require('@prisma/client').PrismaClient;
  const mockPrisma = new prisma();
  mockPrisma[model][method].mockRejectedValue(error);
  return mockPrisma;
};

// ============================================================================
// FILE UPLOAD HELPERS
// ============================================================================

export const createMockFile = (filename = 'test.jpg', mimetype = 'image/jpeg') => ({
  fieldname: 'image',
  originalname: filename,
  encoding: '7bit',
  mimetype,
  size: 1024,
  destination: 'uploads/',
  filename: `test-${Date.now()}.jpg`,
  path: `uploads/test-${Date.now()}.jpg`,
  buffer: Buffer.from('test image data'),
});

export const createMockMultipleFiles = (count = 3) => {
  return Array.from({ length: count }, (_, index) => 
    createMockFile(`test${index + 1}.jpg`)
  );
};

// ============================================================================
// TIME HELPERS
// ============================================================================

export const mockDate = (dateString: string) => {
  const mockDate = new Date(dateString);
  jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
  return mockDate;
};

export const restoreDate = () => {
  jest.restoreAllMocks();
};

// ============================================================================
// ASYNC HELPERS
// ============================================================================

export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const waitForCondition = async (
  condition: () => boolean | Promise<boolean>,
  timeout = 5000,
  interval = 100
) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await condition()) {
      return true;
    }
    await waitFor(interval);
  }
  throw new Error(`Condition not met within ${timeout}ms`);
};

// ============================================================================
// CLEANUP HELPERS
// ============================================================================

export const cleanupMocks = () => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
};

export const resetDatabase = async () => {
  // In a real test environment, this would clean up the test database
  // For now, we'll just clear the mocks
  cleanupMocks();
};
