import request from 'supertest';
import { app } from '../src/app';
import { testPrisma, testData, createTestUser, cleanupTestData } from './setup';
import bcrypt from 'bcryptjs';

describe('Authentication API', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New User',
        role: 'CUSTOMER',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'User registered successfully');
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

    it('should not register user with existing email', async () => {
      // Create existing user
      await createTestUser(testData.customer);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: testData.customer.email,
          password: 'password123',
          name: 'Another User',
          role: 'CUSTOMER',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'User already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // Too short
          name: '',
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    it('should hash password before storing', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'plainpassword',
        name: 'Test User',
        role: 'CUSTOMER',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      const user = await testPrisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(user?.password).not.toBe(userData.password);
      expect(user?.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser(testData.customer);
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.customer.email,
          password: testData.customer.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: testData.customer.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.customer.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid credentials');
    });

    it('should not login inactive user', async () => {
      // Create inactive user
      const inactiveUser = await createTestUser({
        ...testData.customer,
        email: 'inactive@test.com',
        isActive: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@test.com',
          password: testData.customer.password,
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Account is deactivated');
    });

    it('should create refresh token on login', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.customer.email,
          password: testData.customer.password,
        })
        .expect(200);

      const refreshToken = response.body.data.refreshToken;
      expect(refreshToken).toBeTruthy();

      // Verify refresh token was stored in database
      const storedToken = await testPrisma.refreshToken.findFirst({
        where: { token: refreshToken },
      });
      expect(storedToken).toBeTruthy();
    });
  });

  describe('POST /api/auth/refresh', () => {
    let refreshToken: string;
    let user: any;

    beforeEach(async () => {
      user = await createTestUser(testData.customer);
      
      // Login to get refresh token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.customer.email,
          password: testData.customer.password,
        });
      
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should not refresh with invalid refresh token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid-token' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid refresh token');
    });

    it('should not refresh with expired refresh token', async () => {
      // Create expired refresh token
      const expiredToken = await testPrisma.refreshToken.create({
        data: {
          token: 'expired-token',
          userId: user.id,
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'expired-token' })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Refresh token expired');
    });
  });

  describe('POST /api/auth/logout', () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      await createTestUser(testData.customer);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.customer.email,
          password: testData.customer.password,
        });
      
      accessToken = loginResponse.body.data.accessToken;
      refreshToken = loginResponse.body.data.refreshToken;
    });

    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ refreshToken })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify refresh token was removed from database
      const storedToken = await testPrisma.refreshToken.findFirst({
        where: { token: refreshToken },
      });
      expect(storedToken).toBeNull();
    });

    it('should require authentication for logout', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .send({ refreshToken })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      await createTestUser(testData.customer);
    });

    it('should send password reset email for valid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: testData.customer.email })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Password reset email sent');
    });

    it('should handle non-existent email gracefully', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@test.com' })
        .expect(200);

      // Should return success for security reasons (don't reveal if email exists)
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Password reset email sent');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/auth/me', () => {
    let accessToken: string;
    let user: any;

    beforeEach(async () => {
      user = await createTestUser(testData.customer);
      
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: testData.customer.email,
          password: testData.customer.password,
        });
      
      accessToken = loginResponse.body.data.accessToken;
    });

    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.id).toBe(user.id);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Access token required');
    });

    it('should not accept invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invalid access token');
    });
  });
});
