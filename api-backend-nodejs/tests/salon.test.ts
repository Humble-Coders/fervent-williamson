import request from 'supertest';
import { app } from '../src/app';
import { testPrisma, testData, createTestUser, createTestSalon, cleanupTestData } from './setup';

describe('Salon API', () => {
  let adminToken: string;
  let ownerToken: string;
  let customerToken: string;
  let adminUser: any;
  let ownerUser: any;
  let customerUser: any;

  beforeEach(async () => {
    await cleanupTestData();

    // Create test users
    adminUser = await createTestUser(testData.adminUser);
    ownerUser = await createTestUser(testData.salonOwner);
    customerUser = await createTestUser(testData.customer);

    // Get auth tokens
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.adminUser.email,
        password: testData.adminUser.password,
      });
    adminToken = adminLogin.body.data.accessToken;

    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.salonOwner.email,
        password: testData.salonOwner.password,
      });
    ownerToken = ownerLogin.body.data.accessToken;

    const customerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: testData.customer.email,
        password: testData.customer.password,
      });
    customerToken = customerLogin.body.data.accessToken;
  });

  describe('GET /api/salons', () => {
    beforeEach(async () => {
      // Create test salons
      await createTestSalon(testData.salon, ownerUser.id);
      await createTestSalon({
        ...testData.salon,
        displayId: 2,
        name: 'Another Test Salon',
        email: 'another@test.com',
      }, ownerUser.id);
    });

    it('should return list of salons for public access', async () => {
      const response = await request(app)
        .get('/api/salons')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('salons');
      expect(Array.isArray(response.body.data.salons)).toBe(true);
      expect(response.body.data.salons).toHaveLength(2);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/salons?page=1&limit=1')
        .expect(200);

      expect(response.body.data.salons).toHaveLength(1);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 1);
      expect(response.body.data.pagination).toHaveProperty('total', 2);
    });

    it('should support search by name', async () => {
      const response = await request(app)
        .get('/api/salons?search=Another')
        .expect(200);

      expect(response.body.data.salons).toHaveLength(1);
      expect(response.body.data.salons[0].name).toContain('Another');
    });

    it('should support filtering by location', async () => {
      const response = await request(app)
        .get('/api/salons?city=Test City')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data.salons)).toBe(true);
    });
  });

  describe('GET /api/salons/:id', () => {
    let salon: any;

    beforeEach(async () => {
      salon = await createTestSalon(testData.salon, ownerUser.id);
    });

    it('should return salon details by ID', async () => {
      const response = await request(app)
        .get(`/api/salons/${salon.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('salon');
      expect(response.body.data.salon.id).toBe(salon.id);
      expect(response.body.data.salon.name).toBe(testData.salon.name);
    });

    it('should return salon details by display ID', async () => {
      const response = await request(app)
        .get(`/api/salons/${salon.displayId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.salon.displayId).toBe(salon.displayId);
    });

    it('should return 404 for non-existent salon', async () => {
      const response = await request(app)
        .get('/api/salons/999999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Salon not found');
    });

    it('should include related data (services, stylists)', async () => {
      const response = await request(app)
        .get(`/api/salons/${salon.id}?include=services,stylists`)
        .expect(200);

      expect(response.body.data.salon).toHaveProperty('services');
      expect(response.body.data.salon).toHaveProperty('stylists');
    });
  });

  describe('POST /api/salons', () => {
    it('should create salon as salon owner', async () => {
      const salonData = {
        name: 'New Test Salon',
        description: 'A new test salon',
        address: '456 New Street, New City',
        phone: '+1234567891',
        email: 'newsalon@test.com',
        workingHours: testData.salon.workingHours,
      };

      const response = await request(app)
        .post('/api/salons')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(salonData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Salon created successfully');
      expect(response.body.data).toHaveProperty('salon');
      expect(response.body.data.salon.name).toBe(salonData.name);
      expect(response.body.data.salon.ownerId).toBe(ownerUser.id);

      // Verify salon was created in database
      const salon = await testPrisma.salon.findUnique({
        where: { email: salonData.email },
      });
      expect(salon).toBeTruthy();
    });

    it('should not create salon as customer', async () => {
      const response = await request(app)
        .post('/api/salons')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(testData.salon)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/salons')
        .send(testData.salon)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/salons')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: '', // Empty name
          description: 'Test',
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should not allow duplicate email', async () => {
      await createTestSalon(testData.salon, ownerUser.id);

      const response = await request(app)
        .post('/api/salons')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          ...testData.salon,
          name: 'Different Name',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Salon with this email already exists');
    });
  });

  describe('PUT /api/salons/:id', () => {
    let salon: any;

    beforeEach(async () => {
      salon = await createTestSalon(testData.salon, ownerUser.id);
    });

    it('should update salon as owner', async () => {
      const updateData = {
        name: 'Updated Salon Name',
        description: 'Updated description',
        phone: '+9876543210',
      };

      const response = await request(app)
        .put(`/api/salons/${salon.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Salon updated successfully');
      expect(response.body.data.salon.name).toBe(updateData.name);
      expect(response.body.data.salon.description).toBe(updateData.description);

      // Verify update in database
      const updatedSalon = await testPrisma.salon.findUnique({
        where: { id: salon.id },
      });
      expect(updatedSalon?.name).toBe(updateData.name);
    });

    it('should update salon as admin', async () => {
      const updateData = { name: 'Admin Updated Name' };

      const response = await request(app)
        .put(`/api/salons/${salon.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.salon.name).toBe(updateData.name);
    });

    it('should not update salon as customer', async () => {
      const response = await request(app)
        .put(`/api/salons/${salon.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should not update non-existent salon', async () => {
      const response = await request(app)
        .put('/api/salons/999999')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Salon not found');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/salons/${salon.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          email: 'invalid-email', // Invalid email format
          phone: '123', // Invalid phone format
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /api/salons/:id', () => {
    let salon: any;

    beforeEach(async () => {
      salon = await createTestSalon(testData.salon, ownerUser.id);
    });

    it('should delete salon as admin', async () => {
      const response = await request(app)
        .delete(`/api/salons/${salon.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Salon deleted successfully');

      // Verify deletion in database
      const deletedSalon = await testPrisma.salon.findUnique({
        where: { id: salon.id },
      });
      expect(deletedSalon).toBeNull();
    });

    it('should not delete salon as owner (soft delete only)', async () => {
      const response = await request(app)
        .delete(`/api/salons/${salon.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Salon deactivated successfully');

      // Verify salon still exists but is inactive
      const deactivatedSalon = await testPrisma.salon.findUnique({
        where: { id: salon.id },
      });
      expect(deactivatedSalon).toBeTruthy();
      expect(deactivatedSalon?.isActive).toBe(false);
    });

    it('should not delete salon as customer', async () => {
      const response = await request(app)
        .delete(`/api/salons/${salon.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should not delete non-existent salon', async () => {
      const response = await request(app)
        .delete('/api/salons/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Salon not found');
    });
  });

  describe('GET /api/salons/:id/availability', () => {
    let salon: any;

    beforeEach(async () => {
      salon = await createTestSalon(testData.salon, ownerUser.id);
    });

    it('should return salon availability', async () => {
      const date = '2024-12-01';
      const response = await request(app)
        .get(`/api/salons/${salon.id}/availability?date=${date}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('availability');
      expect(response.body.data).toHaveProperty('date', date);
    });

    it('should require valid date format', async () => {
      const response = await request(app)
        .get(`/api/salons/${salon.id}/availability?date=invalid-date`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid date format');
    });

    it('should return 404 for non-existent salon', async () => {
      const response = await request(app)
        .get('/api/salons/999999/availability?date=2024-12-01')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Salon not found');
    });
  });
});
