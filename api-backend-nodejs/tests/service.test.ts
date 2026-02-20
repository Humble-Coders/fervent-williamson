import request from 'supertest';
import { app } from '../src/app';
import { 
  testPrisma, 
  testData, 
  createTestUser, 
  createTestSalon, 
  createTestService,
  createTestServiceCategory,
  cleanupTestData 
} from './setup';

describe('Service API', () => {
  let adminToken: string;
  let ownerToken: string;
  let customerToken: string;
  let adminUser: any;
  let ownerUser: any;
  let customerUser: any;
  let salon: any;
  let serviceCategory: any;

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

    // Create test data
    salon = await createTestSalon(testData.salon, ownerUser.id);
    serviceCategory = await createTestServiceCategory();
  });

  describe('GET /api/services', () => {
    beforeEach(async () => {
      // Create test services
      await createTestService(testData.service, salon.id, serviceCategory.id);
      await createTestService({
        ...testData.service,
        displayId: 2,
        name: 'Another Service',
        price: 75.00,
      }, salon.id, serviceCategory.id);
    });

    it('should return list of services for public access', async () => {
      const response = await request(app)
        .get('/api/services')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('services');
      expect(Array.isArray(response.body.data.services)).toBe(true);
      expect(response.body.data.services).toHaveLength(2);
    });

    it('should support filtering by salon', async () => {
      const response = await request(app)
        .get(`/api/services?salonId=${salon.id}`)
        .expect(200);

      expect(response.body.data.services).toHaveLength(2);
      response.body.data.services.forEach((service: any) => {
        expect(service.salonId).toBe(salon.id);
      });
    });

    it('should support filtering by category', async () => {
      const response = await request(app)
        .get(`/api/services?categoryId=${serviceCategory.id}`)
        .expect(200);

      expect(response.body.data.services).toHaveLength(2);
      response.body.data.services.forEach((service: any) => {
        expect(service.categoryId).toBe(serviceCategory.id);
      });
    });

    it('should support search by name', async () => {
      const response = await request(app)
        .get('/api/services?search=Another')
        .expect(200);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].name).toContain('Another');
    });

    it('should support price range filtering', async () => {
      const response = await request(app)
        .get('/api/services?minPrice=60&maxPrice=80')
        .expect(200);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data.services[0].price).toBe(75);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/services?page=1&limit=1')
        .expect(200);

      expect(response.body.data.services).toHaveLength(1);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 1);
      expect(response.body.data.pagination).toHaveProperty('total', 2);
    });

    it('should only return active services', async () => {
      // Create inactive service
      await createTestService({
        ...testData.service,
        displayId: 3,
        name: 'Inactive Service',
        isActive: false,
      }, salon.id, serviceCategory.id);

      const response = await request(app)
        .get('/api/services')
        .expect(200);

      expect(response.body.data.services).toHaveLength(2);
      response.body.data.services.forEach((service: any) => {
        expect(service.isActive).toBe(true);
      });
    });
  });

  describe('GET /api/services/:id', () => {
    let service: any;

    beforeEach(async () => {
      service = await createTestService(testData.service, salon.id, serviceCategory.id);
    });

    it('should return service details by ID', async () => {
      const response = await request(app)
        .get(`/api/services/${service.id}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data.service.id).toBe(service.id);
      expect(response.body.data.service.name).toBe(testData.service.name);
    });

    it('should return service details by display ID', async () => {
      const response = await request(app)
        .get(`/api/services/${service.displayId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.service.displayId).toBe(service.displayId);
    });

    it('should return 404 for non-existent service', async () => {
      const response = await request(app)
        .get('/api/services/999999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Service not found');
    });

    it('should include related data when requested', async () => {
      const response = await request(app)
        .get(`/api/services/${service.id}?include=salon,category`)
        .expect(200);

      expect(response.body.data.service).toHaveProperty('salon');
      expect(response.body.data.service).toHaveProperty('category');
    });

    it('should not return inactive services', async () => {
      // Deactivate service
      await testPrisma.service.update({
        where: { id: service.id },
        data: { isActive: false },
      });

      const response = await request(app)
        .get(`/api/services/${service.id}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Service not found');
    });
  });

  describe('POST /api/services', () => {
    it('should create service as salon owner', async () => {
      const serviceData = {
        name: 'New Test Service',
        description: 'A new test service',
        price: 60.00,
        duration: 45,
        emoji: '💅',
        categoryId: serviceCategory.id,
        salonId: salon.id,
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(serviceData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Service created successfully');
      expect(response.body.data).toHaveProperty('service');
      expect(response.body.data.service.name).toBe(serviceData.name);
      expect(response.body.data.service.price).toBe(serviceData.price);

      // Verify service was created in database
      const service = await testPrisma.service.findFirst({
        where: { name: serviceData.name },
      });
      expect(service).toBeTruthy();
    });

    it('should create service as admin', async () => {
      const serviceData = {
        name: 'Admin Created Service',
        description: 'Service created by admin',
        price: 80.00,
        duration: 90,
        emoji: '✨',
        categoryId: serviceCategory.id,
        salonId: salon.id,
      };

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(serviceData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.service.name).toBe(serviceData.name);
    });

    it('should not create service as customer', async () => {
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Unauthorized Service',
          description: 'Should not be created',
          price: 50.00,
          duration: 30,
          categoryId: serviceCategory.id,
          salonId: salon.id,
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/services')
        .send({
          name: 'Test Service',
          description: 'Test',
          price: 50.00,
          duration: 30,
          categoryId: serviceCategory.id,
          salonId: salon.id,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/services')
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

    it('should validate price format', async () => {
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Service',
          description: 'Test',
          price: 'invalid-price',
          duration: 30,
          categoryId: serviceCategory.id,
          salonId: salon.id,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate duration', async () => {
      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          name: 'Test Service',
          description: 'Test',
          price: 50.00,
          duration: -10, // Invalid duration
          categoryId: serviceCategory.id,
          salonId: salon.id,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate salon ownership', async () => {
      // Create another salon owner
      const anotherOwner = await createTestUser({
        ...testData.salonOwner,
        email: 'another@owner.com',
      });

      const anotherLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'another@owner.com',
          password: testData.salonOwner.password,
        });

      const response = await request(app)
        .post('/api/services')
        .set('Authorization', `Bearer ${anotherLogin.body.data.accessToken}`)
        .send({
          name: 'Unauthorized Service',
          description: 'Should not be created',
          price: 50.00,
          duration: 30,
          categoryId: serviceCategory.id,
          salonId: salon.id, // Not owned by this user
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Cannot create service for salon you do not own');
    });
  });

  describe('PUT /api/services/:id', () => {
    let service: any;

    beforeEach(async () => {
      service = await createTestService(testData.service, salon.id, serviceCategory.id);
    });

    it('should update service as salon owner', async () => {
      const updateData = {
        name: 'Updated Service Name',
        description: 'Updated description',
        price: 65.00,
        duration: 75,
      };

      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Service updated successfully');
      expect(response.body.data.service.name).toBe(updateData.name);
      expect(response.body.data.service.price).toBe(updateData.price);

      // Verify update in database
      const updatedService = await testPrisma.service.findUnique({
        where: { id: service.id },
      });
      expect(updatedService?.name).toBe(updateData.name);
    });

    it('should update service as admin', async () => {
      const updateData = { name: 'Admin Updated Service' };

      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.service.name).toBe(updateData.name);
    });

    it('should not update service as customer', async () => {
      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should not update non-existent service', async () => {
      const response = await request(app)
        .put('/api/services/999999')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Service not found');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          price: 'invalid-price',
          duration: -5,
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /api/services/:id', () => {
    let service: any;

    beforeEach(async () => {
      service = await createTestService(testData.service, salon.id, serviceCategory.id);
    });

    it('should delete service as admin', async () => {
      const response = await request(app)
        .delete(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Service deleted successfully');

      // Verify deletion in database
      const deletedService = await testPrisma.service.findUnique({
        where: { id: service.id },
      });
      expect(deletedService).toBeNull();
    });

    it('should deactivate service as salon owner', async () => {
      const response = await request(app)
        .delete(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Service deactivated successfully');

      // Verify service still exists but is inactive
      const deactivatedService = await testPrisma.service.findUnique({
        where: { id: service.id },
      });
      expect(deactivatedService).toBeTruthy();
      expect(deactivatedService?.isActive).toBe(false);
    });

    it('should not delete service as customer', async () => {
      const response = await request(app)
        .delete(`/api/services/${service.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should not delete non-existent service', async () => {
      const response = await request(app)
        .delete('/api/services/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Service not found');
    });
  });
});
