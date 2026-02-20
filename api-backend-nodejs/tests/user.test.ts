import request from 'supertest';
import { app } from '../src/app';
import { testPrisma, testData, createTestUser, cleanupTestData } from './setup';
import bcrypt from 'bcryptjs';

describe('User API', () => {
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

  describe('GET /api/users', () => {
    it('should return all users for admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('users');
      expect(Array.isArray(response.body.data.users)).toBe(true);
      expect(response.body.data.users).toHaveLength(3);

      // Check that passwords are not included
      response.body.data.users.forEach((user: any) => {
        expect(user).not.toHaveProperty('password');
      });
    });

    it('should not allow non-admin users to access user list', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/users?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users).toHaveLength(2);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('page', 1);
      expect(response.body.data.pagination).toHaveProperty('limit', 2);
      expect(response.body.data.pagination).toHaveProperty('total', 3);
    });

    it('should support filtering by role', async () => {
      const response = await request(app)
        .get('/api/users?role=CUSTOMER')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].role).toBe('CUSTOMER');
    });

    it('should support search by name or email', async () => {
      const response = await request(app)
        .get('/api/users?search=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users).toHaveLength(1);
      expect(response.body.data.users[0].email).toContain('admin');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user details for admin', async () => {
      const response = await request(app)
        .get(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.id).toBe(customerUser.id);
      expect(response.body.data.user.email).toBe(customerUser.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should allow users to view their own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.user.id).toBe(customerUser.id);
    });

    it('should not allow users to view other users profiles', async () => {
      const response = await request(app)
        .get(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should include related data when requested', async () => {
      const response = await request(app)
        .get(`/api/users/${ownerUser.id}?include=ownedSalons`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.user).toHaveProperty('ownedSalons');
    });
  });

  describe('POST /api/users', () => {
    it('should create user as admin', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        role: 'CUSTOMER',
        phone: '+1234567890',
      };

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User created successfully');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe(userData.email);
      expect(response.body.data.user).not.toHaveProperty('password');

      // Verify user was created in database
      const user = await testPrisma.user.findUnique({
        where: { email: userData.email },
      });
      expect(user).toBeTruthy();
      expect(user?.name).toBe(userData.name);
    });

    it('should not allow non-admin to create users', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          email: 'test@test.com',
          password: 'password123',
          name: 'Test User',
          role: 'CUSTOMER',
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          name: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should not create user with existing email', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: customerUser.email,
          password: 'password123',
          name: 'Another User',
          role: 'CUSTOMER',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User with this email already exists');
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'hashtest@test.com',
        password: 'plainpassword',
        name: 'Hash Test User',
        role: 'CUSTOMER',
      };

      await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(userData)
        .expect(201);

      const user = await testPrisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user as admin', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+9876543210',
        isActive: false,
      };

      const response = await request(app)
        .put(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User updated successfully');
      expect(response.body.data.user.name).toBe(updateData.name);
      expect(response.body.data.user.phone).toBe(updateData.phone);
      expect(response.body.data.user.isActive).toBe(updateData.isActive);

      // Verify update in database
      const updatedUser = await testPrisma.user.findUnique({
        where: { id: customerUser.id },
      });
      expect(updatedUser?.name).toBe(updateData.name);
    });

    it('should allow users to update their own profile', async () => {
      const updateData = {
        name: 'Self Updated Name',
        phone: '+1111111111',
      };

      const response = await request(app)
        .put(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.data.user.name).toBe(updateData.name);
    });

    it('should not allow users to update sensitive fields', async () => {
      const response = await request(app)
        .put(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          role: 'ADMIN', // Should not be allowed
          isActive: false, // Should not be allowed
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Cannot modify restricted fields');
    });

    it('should not allow users to update other users', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'Unauthorized Update' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access denied');
    });

    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          phone: '123',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should update password with proper hashing', async () => {
      const newPassword = 'newpassword123';

      const response = await request(app)
        .put(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ password: newPassword })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify password was hashed
      const updatedUser = await testPrisma.user.findUnique({
        where: { id: customerUser.id },
      });

      expect(updatedUser?.password).not.toBe(newPassword);
      expect(updatedUser?.password).toMatch(/^\$2[aby]\$\d+\$/);

      // Verify new password works for login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: customerUser.email,
          password: newPassword,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('success', true);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user as admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User deleted successfully');

      // Verify user was deleted
      const deletedUser = await testPrisma.user.findUnique({
        where: { id: customerUser.id },
      });
      expect(deletedUser).toBeNull();
    });

    it('should not allow non-admin to delete users', async () => {
      const response = await request(app)
        .delete(`/api/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should not allow users to delete themselves', async () => {
      const response = await request(app)
        .delete(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Cannot delete your own account');
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .delete('/api/users/999999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User not found');
    });

    it('should handle cascade deletion of related data', async () => {
      // Create related data for the user
      await testPrisma.refreshToken.create({
        data: {
          token: 'test-refresh-token',
          userId: customerUser.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });

      const response = await request(app)
        .delete(`/api/users/${customerUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify related data was also deleted
      const refreshTokens = await testPrisma.refreshToken.findMany({
        where: { userId: customerUser.id },
      });
      expect(refreshTokens).toHaveLength(0);
    });
  });

  describe('PUT /api/users/:id/status', () => {
    it('should activate/deactivate user as admin', async () => {
      const response = await request(app)
        .put(`/api/users/${customerUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User status updated successfully');
      expect(response.body.data.user.isActive).toBe(false);

      // Verify user cannot login when deactivated
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: customerUser.email,
          password: testData.customer.password,
        })
        .expect(401);

      expect(loginResponse.body).toHaveProperty('message', 'Account is deactivated');
    });

    it('should not allow non-admin to change user status', async () => {
      const response = await request(app)
        .put(`/api/users/${adminUser.id}/status`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ isActive: false })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Insufficient permissions');
    });

    it('should validate status data', async () => {
      const response = await request(app)
        .put(`/api/users/${customerUser.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: 'invalid' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });
});
