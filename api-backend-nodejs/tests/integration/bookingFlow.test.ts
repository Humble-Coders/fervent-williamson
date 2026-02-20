import request from 'supertest';
import { app } from '../../src/app';
import { 
  testPrisma, 
  testData, 
  createTestUser, 
  createTestSalon, 
  createTestService,
  createTestStylist,
  createTestServiceCategory,
  cleanupTestData 
} from '../setup';

describe('Booking Flow Integration', () => {
  let customerToken: string;
  let ownerToken: string;
  let customerUser: any;
  let ownerUser: any;
  let salon: any;
  let service: any;
  let stylist: any;
  let serviceCategory: any;

  beforeEach(async () => {
    await cleanupTestData();

    // Create test users
    ownerUser = await createTestUser(testData.salonOwner);
    customerUser = await createTestUser(testData.customer);

    // Get auth tokens
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

  describe('Complete Booking Flow', () => {
    it('should complete full booking flow from discovery to confirmation', async () => {
      // Step 1: Customer discovers salons
      const salonsResponse = await request(app)
        .get('/api/salons')
        .expect(200);

      expect(salonsResponse.body.data.salons).toHaveLength(1);
      const discoveredSalon = salonsResponse.body.data.salons[0];

      // Step 2: Customer views salon details
      const salonDetailsResponse = await request(app)
        .get(`/api/salons/${discoveredSalon.id}?include=services,stylists`)
        .expect(200);

      expect(salonDetailsResponse.body.data.salon).toHaveProperty('services');
      expect(salonDetailsResponse.body.data.salon).toHaveProperty('stylists');

      // Step 3: Customer checks availability
      const availabilityResponse = await request(app)
        .get(`/api/salons/${discoveredSalon.id}/availability?date=2024-12-01`)
        .expect(200);

      expect(availabilityResponse.body.data).toHaveProperty('availability');

      // Step 4: Customer creates booking
      const bookingData = {
        salonId: discoveredSalon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
        notes: 'First time customer',
      };

      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(201);

      const booking = bookingResponse.body.data.booking;
      expect(booking.status).toBe('PENDING');
      expect(booking.customerId).toBe(customerUser.id);

      // Step 5: Salon owner views pending bookings
      const ownerBookingsResponse = await request(app)
        .get('/api/bookings?status=PENDING')
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      expect(ownerBookingsResponse.body.data.bookings).toHaveLength(1);
      expect(ownerBookingsResponse.body.data.bookings[0].id).toBe(booking.id);

      // Step 6: Salon owner confirms booking
      const confirmResponse = await request(app)
        .put(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      expect(confirmResponse.body.data.booking.status).toBe('CONFIRMED');

      // Step 7: Customer views confirmed booking
      const customerBookingResponse = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(customerBookingResponse.body.data.booking.status).toBe('CONFIRMED');

      // Step 8: Verify booking appears in customer's booking list
      const customerBookingsResponse = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(customerBookingsResponse.body.data.bookings).toHaveLength(1);
      expect(customerBookingsResponse.body.data.bookings[0].status).toBe('CONFIRMED');
    });

    it('should handle booking conflicts correctly', async () => {
      // Create first booking
      const firstBookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
        notes: 'First booking',
      };

      const firstBookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(firstBookingData)
        .expect(201);

      // Confirm first booking
      await request(app)
        .put(`/api/bookings/${firstBookingResponse.body.data.booking.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      // Try to create conflicting booking
      const conflictingBookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-01',
        startTime: '10:30', // Overlaps with first booking
        endTime: '11:30',
        notes: 'Conflicting booking',
      };

      const conflictResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(conflictingBookingData)
        .expect(400);

      expect(conflictResponse.body).toHaveProperty('success', false);
      expect(conflictResponse.body).toHaveProperty('message', 'Stylist not available at this time');
    });

    it('should handle booking cancellation flow', async () => {
      // Create booking
      const bookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-15', // Future date to allow cancellation
        startTime: '14:00',
        endTime: '15:00',
        notes: 'To be cancelled',
      };

      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(201);

      const booking = bookingResponse.body.data.booking;

      // Confirm booking
      await request(app)
        .put(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'CONFIRMED' })
        .expect(200);

      // Customer cancels booking
      const cancelResponse = await request(app)
        .delete(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(cancelResponse.body).toHaveProperty('success', true);
      expect(cancelResponse.body).toHaveProperty('message', 'Booking cancelled successfully');

      // Verify booking status changed to CANCELLED
      const cancelledBookingResponse = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(cancelledBookingResponse.body.data.booking.status).toBe('CANCELLED');

      // Verify time slot is now available again
      const newBookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-15',
        startTime: '14:00',
        endTime: '15:00',
        notes: 'New booking in previously cancelled slot',
      };

      const newBookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(newBookingData)
        .expect(201);

      expect(newBookingResponse.body).toHaveProperty('success', true);
    });

    it('should handle booking modification flow', async () => {
      // Create booking
      const bookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-10',
        startTime: '09:00',
        endTime: '10:00',
        notes: 'Original booking',
      };

      const bookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(201);

      const booking = bookingResponse.body.data.booking;

      // Customer modifies booking
      const modificationData = {
        date: '2024-12-10',
        startTime: '11:00',
        endTime: '12:00',
        notes: 'Modified booking time',
      };

      const modifyResponse = await request(app)
        .put(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(modificationData)
        .expect(200);

      expect(modifyResponse.body.data.booking.startTime).toBe(modificationData.startTime);
      expect(modifyResponse.body.data.booking.notes).toBe(modificationData.notes);

      // Verify original time slot is now available
      const originalSlotBookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-10',
        startTime: '09:00',
        endTime: '10:00',
        notes: 'Booking in original slot',
      };

      const originalSlotResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(originalSlotBookingData)
        .expect(201);

      expect(originalSlotResponse.body).toHaveProperty('success', true);
    });
  });

  describe('Multi-Service Booking Flow', () => {
    let secondService: any;

    beforeEach(async () => {
      // Create second service
      secondService = await createTestService({
        ...testData.service,
        displayId: 2,
        name: 'Hair Coloring',
        price: 120.00,
        duration: 120,
      }, salon.id, serviceCategory.id);
    });

    it('should handle multiple service bookings', async () => {
      // Book first service
      const firstBookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-05',
        startTime: '10:00',
        endTime: '11:00',
        notes: 'Hair cut',
      };

      const firstBookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(firstBookingData)
        .expect(201);

      // Book second service (consecutive time slot)
      const secondBookingData = {
        salonId: salon.id,
        serviceId: secondService.id,
        stylistId: stylist.id,
        date: '2024-12-05',
        startTime: '11:00',
        endTime: '13:00',
        notes: 'Hair coloring',
      };

      const secondBookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(secondBookingData)
        .expect(201);

      // Verify both bookings were created
      const customerBookingsResponse = await request(app)
        .get('/api/bookings?date=2024-12-05')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(customerBookingsResponse.body.data.bookings).toHaveLength(2);

      // Calculate total cost
      const totalCost = customerBookingsResponse.body.data.bookings.reduce(
        (sum: number, booking: any) => sum + booking.totalAmount,
        0
      );

      expect(totalCost).toBe(testData.service.price + secondService.price);
    });
  });

  describe('Error Handling in Booking Flow', () => {
    it('should handle invalid salon ID gracefully', async () => {
      const bookingData = {
        salonId: '999999',
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid salon, service, or stylist');
    });

    it('should handle mismatched service and salon', async () => {
      // Create another salon
      const anotherSalon = await createTestSalon({
        ...testData.salon,
        displayId: 2,
        name: 'Another Salon',
        email: 'another@salon.com',
      }, ownerUser.id);

      const bookingData = {
        salonId: anotherSalon.id,
        serviceId: service.id, // Service belongs to first salon
        stylistId: stylist.id,
        date: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Service does not belong to the specified salon');
    });

    it('should handle booking outside business hours', async () => {
      const bookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-01',
        startTime: '06:00', // Before business hours
        endTime: '07:00',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Booking time is outside business hours');
    });

    it('should handle booking on closed days', async () => {
      // Assuming Sunday is closed based on test data
      const bookingData = {
        salonId: salon.id,
        serviceId: service.id,
        stylistId: stylist.id,
        date: '2024-12-08', // Sunday
        startTime: '10:00',
        endTime: '11:00',
      };

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(bookingData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Salon is closed on this day');
    });
  });
});
