import request from 'supertest';
import { app } from '../src/app';
import { 
  testPrisma, 
  testData, 
  createTestUser, 
  createTestSalon, 
  createTestService,
  createTestStylist,
  createTestServiceCategory,
  createTestBooking,
  cleanupTestData 
} from './setup';

describe('Booking API', () => {
  let adminToken: string;
  let ownerToken: string;
  let customerToken: string;
  let adminUser: any;
  let ownerUser: any;
  let customerUser: any;
  let salon: any;
  let service: any;
  let stylist: any;
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
    service = await createTestService(testData.service, salon.id, serviceCategory.id);
    stylist = await createTestStylist(testData.stylist, salon.id);
  });

  describe('POST /api/bookings', () => {
    it('should create booking as customer', async () => {
      const bookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
        notes: 'Test booking',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Booking created successfully');
      expect(response.body.data).toHaveProperty('booking');
      expect(response.body.data.booking.customerId).toBe(customerUser.id);
      expect(response.body.data.booking.salonId).toBe(salon.id);
      expect(response.body.data.booking.status).toBe('PENDING');

      // Verify booking was created in database
      const booking = await testPrisma.booking.findFirst({
        where: { customerId: customerUser.id },
      });
      expect(booking).toBeTruthy();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .send({
          salonId: salon.id,
          serviceId: service.id,
          stylistId: stylist.id,
          date: '2024-12-01',
          startTime: '10:00',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon.id,
          // Missing required fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate date format', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon.id,
          serviceId: service.id,
          stylistId: stylist.id,
          date: 'invalid-date',
          startTime: '10:00',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should validate time format', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon.id,
          serviceId: service.id,
          stylistId: stylist.id,
          date: '2024-12-01',
          startTime: 'invalid-time',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should not allow booking in the past', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon.id,
          serviceId: service.id,
          stylistId: stylist.id,
          date: pastDate.toISOString().split('T')[0],
          startTime: '10:00',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Cannot book appointments in the past');
    });

    it('should check stylist availability', async () => {
      // Create existing booking
      await createTestBooking(
        {
          ...testData.booking,
          date: new Date('2024-12-01'),
          startTime: '10:00',
          endTime: '11:00',
        },
        customerUser.id,
        salon.id,
        service.id,
        stylist.id
      );

      // Try to book same time slot
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon.id,
          serviceId: service.id,
          stylistId: stylist.id,
          date: '2024-12-01',
          startTime: '10:00',
          endTime: '11:00',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Stylist not available at this time');
    });

    it('should calculate total amount from service price', async () => {
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon.id,
          serviceId: service.id,
          stylistId: stylist.id,
          date: '2024-12-01',
          startTime: '10:00',
          endTime: '11:00',
        })
        .expect(201);

      expect(response.body.data.booking.totalAmount).toBe(testData.service.price);
    });
  });

  describe('GET /api/bookings', () => {
    beforeEach(async () => {
      // Create test bookings
      await createTestBooking(
        testData.booking,
        customerUser.id,
        salon.id,
        service.id,
        stylist.id
      );
    });

    it('should return customer bookings', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
      expect(response.body.data.bookings).toHaveLength(1);
      expect(response.body.data.bookings[0].customerId).toBe(customerUser.id);
    });

    it('should return salon bookings for owner', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });

    it('should return all bookings for admin', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('bookings');
      expect(Array.isArray(response.body.data.bookings)).toBe(true);
    });

    it('should support filtering by status', async () => {
      const response = await request(app)
        .get('/api/bookings?status=CONFIRMED')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('bookings');
    });

    it('should support filtering by date range', async () => {
      const response = await request(app)
        .get('/api/bookings?startDate=2024-12-01&endDate=2024-12-31')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('bookings');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/bookings?page=1&limit=10')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 10);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/bookings')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('GET /api/bookings/:id', () => {
    let booking: any;

    beforeEach(async () => {
      booking = await createTestBooking(
        testData.booking,
        customerUser.id,
        salon.id,
        service.id,
        stylist.id
      );
    });

    it('should return booking details for customer', async () => {
      const response = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('booking');
      expect(response.body.data.booking.id).toBe(booking.id);
      expect(response.body.data.booking.customerId).toBe(customerUser.id);
    });

    it('should return booking details for salon owner', async () => {
      const response = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.booking.id).toBe(booking.id);
    });

    it('should return booking details for admin', async () => {
      const response = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.booking.id).toBe(booking.id);
    });

    it('should not return booking for unauthorized user', async () => {
      const anotherCustomer = await createTestUser({
        ...testData.customer,
        email: 'another@test.com',
      });

      const anotherLogin = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'another@test.com',
          password: testData.customer.password,
        });

      const response = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${anotherLogin.body.data.accessToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied');
    });

    it('should return 404 for non-existent booking', async () => {
      const response = await request(app)
        .get('/api/bookings/999999')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Booking not found');
    });
  });

  describe('PUT /api/bookings/:id', () => {
    let booking: any;

    beforeEach(async () => {
      booking = await createTestBooking(
        testData.booking,
        customerUser.id,
        salon.id,
        service.id,
        stylist.id
      );
    });

    it('should update booking as customer', async () => {
      const updateData = {
        date: '2024-12-02',
        startTime: '14:00',
        endTime: '15:00',
        notes: 'Updated notes',
      };

      const response = await request(app)
        .put(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Booking updated successfully');
      expect(response.body.data.booking.notes).toBe(updateData.notes);

      // Verify update in database
      const updatedBooking = await testPrisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(updatedBooking?.notes).toBe(updateData.notes);
    });

    it('should update booking status as salon owner', async () => {
      const response = await request(app)
        .put(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(response.body.data.booking.status).toBe('CONFIRMED');
    });

    it('should not allow customer to change status', async () => {
      const response = await request(app)
        .put(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Customers cannot change booking status');
    });

    it('should not update booking in the past', async () => {
      const pastBooking = await createTestBooking(
        {
          ...testData.booking,
          date: new Date('2020-01-01'),
        },
        customerUser.id,
        salon.id,
        service.id,
        stylist.id
      );

      const response = await request(app)
        .put(`/api/bookings/${pastBooking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ notes: 'Updated notes' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Cannot modify past bookings');
    });
  });

  describe('DELETE /api/bookings/:id', () => {
    let booking: any;

    beforeEach(async () => {
      booking = await createTestBooking(
        testData.booking,
        customerUser.id,
        salon.id,
        service.id,
        stylist.id
      );
    });

    it('should cancel booking as customer', async () => {
      const response = await request(app)
        .delete(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Booking cancelled successfully');

      // Verify booking status changed to CANCELLED
      const cancelledBooking = await testPrisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(cancelledBooking?.status).toBe('CANCELLED');
    });

    it('should delete booking as admin', async () => {
      const response = await request(app)
        .delete(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Booking deleted successfully');

      // Verify booking was deleted
      const deletedBooking = await testPrisma.booking.findUnique({
        where: { id: booking.id },
      });
      expect(deletedBooking).toBeNull();
    });

    it('should not cancel booking too close to appointment time', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const nearBooking = await createTestBooking(
        {
          ...testData.booking,
          date: tomorrow,
        },
        customerUser.id,
        salon.id,
        service.id,
        stylist.id
      );

      const response = await request(app)
        .delete(`/api/bookings/${nearBooking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Cannot cancel booking within 24 hours of appointment');
    });
  });
});
