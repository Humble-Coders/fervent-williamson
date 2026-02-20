// Unit tests for auth utilities
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generateToken, verifyToken, hashPassword, comparePassword } from '../../utils/auth';
import { env } from '../../config/env';

describe('Auth Utils', () => {
  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const payload = { userId: 'test-id', email: 'test@example.com' };
      const token = generateToken(payload);
      
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include the payload in the token', () => {
      const payload = { userId: 'test-id', email: 'test@example.com' };
      const token = generateToken(payload);
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
    });

    it('should set expiration time', () => {
      const payload = { userId: 'test-id' };
      const token = generateToken(payload, '1h');
      const decoded = jwt.verify(token, env.JWT_SECRET) as any;
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
      expect(decoded.exp - decoded.iat).toBe(3600); // 1 hour in seconds
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const payload = { userId: 'test-id', email: 'test@example.com' };
      const token = jwt.sign(payload, env.JWT_SECRET);
      
      const result = verifyToken(token);
      
      expect(result.success).toBe(true);
      expect(result.payload?.userId).toBe(payload.userId);
      expect(result.payload?.email).toBe(payload.email);
    });

    it('should reject an invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      const result = verifyToken(invalidToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject an expired token', () => {
      const payload = { userId: 'test-id' };
      const expiredToken = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '-1h' });
      
      const result = verifyToken(expiredToken);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('should reject a token with wrong secret', () => {
      const payload = { userId: 'test-id' };
      const token = jwt.sign(payload, 'wrong-secret');
      
      const result = verifyToken(token);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testpassword123';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testpassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testpassword123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await comparePassword(password, hashedPassword);
      
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testpassword123';
      const wrongPassword = 'wrongpassword';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const result = await comparePassword(wrongPassword, hashedPassword);
      
      expect(result).toBe(false);
    });

    it('should handle empty passwords', async () => {
      const hashedPassword = await bcrypt.hash('', 10);
      
      const result = await comparePassword('', hashedPassword);
      
      expect(result).toBe(true);
    });

    it('should return false for invalid hash', async () => {
      const password = 'testpassword123';
      const invalidHash = 'invalid-hash';
      
      const result = await comparePassword(password, invalidHash);
      
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hashedPassword = await hashPassword(longPassword);
      const result = await comparePassword(longPassword, hashedPassword);
      
      expect(result).toBe(true);
    });

    it('should handle special characters in passwords', async () => {
      const specialPassword = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hashedPassword = await hashPassword(specialPassword);
      const result = await comparePassword(specialPassword, hashedPassword);
      
      expect(result).toBe(true);
    });

    it('should handle unicode characters in passwords', async () => {
      const unicodePassword = '测试密码🔒';
      const hashedPassword = await hashPassword(unicodePassword);
      const result = await comparePassword(unicodePassword, hashedPassword);
      
      expect(result).toBe(true);
    });
  });
});
