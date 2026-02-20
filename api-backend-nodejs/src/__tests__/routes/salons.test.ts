// Integration tests for salon routes
import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../app';
import {
  expectSuccessResponse,
  expectErrorResponse,
  expectUnauthorizedResponse,
  expectNotFoundResponse,
  makeAuthenticatedRequest,
  makeAdminRequest,
  createTestSalon,
  createTestUser,
} from '../utils/testHelpers';

describe('Salon Routes', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = createApp();
    prisma = new PrismaClient();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/salons', () => {
    it('should get all salons', async () => {
      const mockSalons = [
        createTestSalon({ id: 'salon-1', name: 'Salon One' }),
        createTestSalon({ id: 'salon-2', name: 'Salon Two' }),
      ];
      (prisma.salon.findMany as jest.Mock).mockResolvedValue(mockSalons);

      const response = await request(app).get('/api/v1/salons');

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].name).toBe('Salon One');
      expect(response.body.data[1].name).toBe('Salon Two');
    });

    it('should filter salons by featured status', async () => {
      const featuredSalons = [
        createTestSalon({ id: 'salon-1', featured: true }),
      ];
      (prisma.salon.findMany as jest.Mock).mockResolvedValue(featuredSalons);

      const response = await request(app)
        .get('/api/v1/salons')
        .query({ featured: 'true' });

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].featured).toBe(true);
    });

    it('should search salons by name', async () => {
      const searchResults = [
        createTestSalon({ name: 'Hair Studio' }),
      ];
      (prisma.salon.findMany as jest.Mock).mockResolvedValue(searchResults);

      const response = await request(app)
        .get('/api/v1/salons')
        .query({ search: 'Hair' });

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toContain('Hair');
    });

    it('should paginate results', async () => {
      const mockSalons = Array.from({ length: 5 }, (_, i) =>
        createTestSalon({ id: `salon-${i}`, name: `Salon ${i}` })
      );
      (prisma.salon.findMany as jest.Mock).mockResolvedValue(mockSalons.slice(0, 2));
      (prisma.salon.count as jest.Mock).mockResolvedValue(5);

      const response = await request(app)
        .get('/api/v1/salons')
        .query({ page: '1', limit: '2' });

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 5,
        totalPages: 3,
      });
    });

    it('should return empty array when no salons found', async () => {
      (prisma.salon.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/v1/salons');

      expectSuccessResponse(response);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/v1/salons/:id', () => {
    it('should get salon by ID', async () => {
      const mockSalon = createTestSalon();
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);

      const response = await request(app).get('/api/v1/salons/test-salon-id');

      expectSuccessResponse(response);
      expect(response.body.data.id).toBe('test-salon-id');
      expect(response.body.data.name).toBe(mockSalon.name);
    });

    it('should get salon by display ID', async () => {
      const mockSalon = createTestSalon({ displayId: 1 });
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);

      const response = await request(app).get('/api/v1/salons/1');

      expectSuccessResponse(response);
      expect(response.body.data.displayId).toBe(1);
    });

    it('should return 404 for non-existent salon', async () => {
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/v1/salons/non-existent');

      expectNotFoundResponse(response);
    });

    it('should include related data', async () => {
      const mockSalon = createTestSalon();
      const mockSalonWithRelations = {
        ...mockSalon,
        services: [{ id: 'service-1', name: 'Haircut' }],
        stylists: [{ id: 'stylist-1', name: 'John Doe' }],
        reviews: [{ id: 'review-1', rating: 5 }],
      };
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalonWithRelations);

      const response = await request(app).get('/api/v1/salons/test-salon-id');

      expectSuccessResponse(response);
      expect(response.body.data.services).toBeDefined();
      expect(response.body.data.stylists).toBeDefined();
      expect(response.body.data.reviews).toBeDefined();
    });
  });

  describe('POST /api/v1/salons', () => {
    const validSalonData = {
      name: 'New Salon',
      description: 'A new salon',
      address: '123 New St',
      phone: '+1234567890',
      email: 'new@salon.com',
      workingHours: {
        monday: { open: '09:00', close: '18:00', closed: false },
        tuesday: { open: '09:00', close: '18:00', closed: false },
        wednesday: { open: '09:00', close: '18:00', closed: false },
        thursday: { open: '09:00', close: '18:00', closed: false },
        friday: { open: '09:00', close: '18:00', closed: false },
        saturday: { open: '10:00', close: '16:00', closed: false },
        sunday: { open: '10:00', close: '16:00', closed: true },
      },
    };

    it('should create salon with valid data', async () => {
      const mockUser = createTestUser({ role: 'SALON_OWNER' });
      const mockSalon = createTestSalon(validSalonData);
      
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.salon.create as jest.Mock).mockResolvedValue(mockSalon);

      const response = await makeAuthenticatedRequest(app)
        .post('/api/v1/salons')
        .send(validSalonData);

      expectSuccessResponse(response);
      expect(response.body.data.name).toBe(validSalonData.name);
      expect(response.body.data.address).toBe(validSalonData.address);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/v1/salons')
        .send(validSalonData);

      expectUnauthorizedResponse(response);
    });

    it('should validate required fields', async () => {
      const mockUser = createTestUser({ role: 'SALON_OWNER' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await makeAuthenticatedRequest(app)
        .post('/api/v1/salons')
        .send({});

      expectErrorResponse(response, 400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'description' }),
          expect.objectContaining({ field: 'address' }),
        ])
      );
    });

    it('should validate email format', async () => {
      const mockUser = createTestUser({ role: 'SALON_OWNER' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await makeAuthenticatedRequest(app)
        .post('/api/v1/salons')
        .send({
          ...validSalonData,
          email: 'invalid-email',
        });

      expectErrorResponse(response, 400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
        ])
      );
    });

    it('should validate phone format', async () => {
      const mockUser = createTestUser({ role: 'SALON_OWNER' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await makeAuthenticatedRequest(app)
        .post('/api/v1/salons')
        .send({
          ...validSalonData,
          phone: 'invalid-phone',
        });

      expectErrorResponse(response, 400);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'phone' }),
        ])
      );
    });
  });

  describe('PUT /api/v1/salons/:id', () => {
    const updateData = {
      name: 'Updated Salon Name',
      description: 'Updated description',
    };

    it('should update salon with valid data', async () => {
      const mockUser = createTestUser({ role: 'SALON_OWNER' });
      const mockSalon = createTestSalon({ ownerId: mockUser.id });
      const updatedSalon = { ...mockSalon, ...updateData };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);
      (prisma.salon.update as jest.Mock).mockResolvedValue(updatedSalon);

      const response = await makeAuthenticatedRequest(app)
        .put('/api/v1/salons/test-salon-id')
        .send(updateData);

      expectSuccessResponse(response);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/v1/salons/test-salon-id')
        .send(updateData);

      expectUnauthorizedResponse(response);
    });

    it('should return 404 for non-existent salon', async () => {
      const mockUser = createTestUser({ role: 'SALON_OWNER' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await makeAuthenticatedRequest(app)
        .put('/api/v1/salons/non-existent')
        .send(updateData);

      expectNotFoundResponse(response);
    });

    it('should allow admin to update any salon', async () => {
      const mockAdmin = createTestUser({ role: 'ADMIN' });
      const mockSalon = createTestSalon({ ownerId: 'different-owner' });
      const updatedSalon = { ...mockSalon, ...updateData };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockAdmin);
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);
      (prisma.salon.update as jest.Mock).mockResolvedValue(updatedSalon);

      const response = await makeAdminRequest(app)
        .put('/api/v1/salons/test-salon-id')
        .send(updateData);

      expectSuccessResponse(response);
    });
  });

  describe('DELETE /api/v1/salons/:id', () => {
    it('should delete salon', async () => {
      const mockUser = createTestUser({ role: 'SALON_OWNER' });
      const mockSalon = createTestSalon({ ownerId: mockUser.id });

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(mockSalon);
      (prisma.salon.delete as jest.Mock).mockResolvedValue(mockSalon);

      const response = await makeAuthenticatedRequest(app)
        .delete('/api/v1/salons/test-salon-id');

      expectSuccessResponse(response);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/v1/salons/test-salon-id');

      expectUnauthorizedResponse(response);
    });

    it('should return 404 for non-existent salon', async () => {
      const mockUser = createTestUser({ role: 'SALON_OWNER' });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.salon.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await makeAuthenticatedRequest(app)
        .delete('/api/v1/salons/non-existent');

      expectNotFoundResponse(response);
    });
  });
});
