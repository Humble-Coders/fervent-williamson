// Integration tests for auth routes
import request from 'supertest';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../../app';
import {
  expectSuccessResponse,
  expectErrorResponse,
  expectValidationError,
  createTestUser,
} from '../utils/testHelpers';

describe('Auth Routes', () => {
  let app: Express;
  let prisma: PrismaClient;

  beforeAll(async () => {
    app = createApp();
    prisma = new PrismaClient();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    const validRegistrationData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      phone: '+1234567890',
    };

    it('should register a new user successfully', async () => {
      const mockUser = createTestUser(validRegistrationData);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistrationData);

      expectSuccessResponse(response);
      expect(response.body.data.user).toMatchObject({
        name: validRegistrationData.name,
        email: validRegistrationData.email,
      });
      expect(response.body.data.token).toBeDefined();
    });

    it('should return error for existing email', async () => {
      const existingUser = createTestUser();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(validRegistrationData);

      expectErrorResponse(response, 400, 'already exists');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({});

      expectValidationError(response);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validRegistrationData,
          email: 'invalid-email',
        });

      expectValidationError(response, 'email');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validRegistrationData,
          password: '123',
        });

      expectValidationError(response, 'password');
    });

    it('should validate phone number format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          ...validRegistrationData,
          phone: 'invalid-phone',
        });

      expectValidationError(response, 'phone');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const validLoginData = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should login with valid credentials', async () => {
      const mockUser = createTestUser({
        email: validLoginData.email,
        password: 'hashed-password',
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validLoginData);

      expectSuccessResponse(response);
      expect(response.body.data.user.email).toBe(validLoginData.email);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validLoginData);

      expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should return error for incorrect password', async () => {
      const mockUser = createTestUser({
        email: validLoginData.email,
        password: 'different-hashed-password',
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validLoginData);

      expectErrorResponse(response, 401, 'Invalid credentials');
    });

    it('should return error for inactive user', async () => {
      const mockUser = createTestUser({
        email: validLoginData.email,
        isActive: false,
      });
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send(validLoginData);

      expectErrorResponse(response, 401, 'Account is deactivated');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({});

      expectValidationError(response);
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ field: 'email' }),
          expect.objectContaining({ field: 'password' }),
        ])
      );
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const mockRefreshToken = {
        id: 'refresh-token-id',
        token: 'valid-refresh-token',
        userId: 'test-user-id',
        expiresAt: new Date(Date.now() + 86400000), // 24 hours from now
        isRevoked: false,
      };
      const mockUser = createTestUser();

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockRefreshToken);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });

      expectSuccessResponse(response);
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });

    it('should return error for invalid refresh token', async () => {
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'invalid-refresh-token' });

      expectErrorResponse(response, 401, 'Invalid refresh token');
    });

    it('should return error for expired refresh token', async () => {
      const expiredRefreshToken = {
        id: 'refresh-token-id',
        token: 'expired-refresh-token',
        userId: 'test-user-id',
        expiresAt: new Date(Date.now() - 86400000), // 24 hours ago
        isRevoked: false,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(expiredRefreshToken);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'expired-refresh-token' });

      expectErrorResponse(response, 401, 'Refresh token expired');
    });

    it('should return error for revoked refresh token', async () => {
      const revokedRefreshToken = {
        id: 'refresh-token-id',
        token: 'revoked-refresh-token',
        userId: 'test-user-id',
        expiresAt: new Date(Date.now() + 86400000),
        isRevoked: true,
      };

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(revokedRefreshToken);

      const response = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'revoked-refresh-token' });

      expectErrorResponse(response, 401, 'Refresh token revoked');
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('should logout successfully with valid token', async () => {
      const mockUser = createTestUser();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      const response = await request(app)
        .post('/api/v1/auth/logout')
        .set('Authorization', 'Bearer valid-token');

      expectSuccessResponse(response);
      expect(response.body.message).toContain('Logged out successfully');
    });

    it('should return error without authentication', async () => {
      const response = await request(app)
        .post('/api/v1/auth/logout');

      expectErrorResponse(response, 401, 'No token provided');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should send reset email for existing user', async () => {
      const mockUser = createTestUser();
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expectSuccessResponse(response);
      expect(response.body.message).toContain('reset email sent');
    });

    it('should return success even for non-existent user (security)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expectSuccessResponse(response);
      expect(response.body.message).toContain('reset email sent');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expectValidationError(response, 'email');
    });
  });
});
