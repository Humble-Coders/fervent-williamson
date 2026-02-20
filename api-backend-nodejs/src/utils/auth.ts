import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '@/config/env';
import { JwtPayload, RefreshTokenPayload } from '@/types';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare a password with its hash
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (payload: {
  userId: string;
  email: string;
  role: string;
}): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '7d', // Fixed value instead of env variable
    issuer: 'salon-api',
    audience: 'salon-app',
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (payload: {
  userId: string;
  tokenId: string;
}): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '30d', // Fixed value instead of env variable
    issuer: 'salon-api',
    audience: 'salon-app',
  });
};

/**
 * Verify JWT access token
 */
export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
};

/**
 * Verify JWT refresh token
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    } else if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    } else {
      throw new Error('Refresh token verification failed');
    }
  }
};

/**
 * Extract token from Authorization header
 */
export const extractTokenFromHeader = (authHeader?: string): string | null => {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }
  
  return parts[1];
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Generate password reset token
 */
export const generatePasswordResetToken = (): string => {
  return generateSecureToken(64);
};

/**
 * Generate email verification token
 */
export const generateEmailVerificationToken = (): string => {
  return generateSecureToken(32);
};

/**
 * Check if user has required role
 */
export const hasRole = (userRole: string, requiredRoles: string[]): boolean => {
  return requiredRoles.includes(userRole);
};

/**
 * Check if user has permission for resource
 */
export const hasPermission = (
  userRole: string,
  userId: string,
  resourceUserId?: string
): boolean => {
  // Admin and Manager can access all resources
  if (['ADMIN', 'MANAGER'].includes(userRole)) {
    return true;
  }
  
  // Staff can access their own resources
  if (userRole === 'STAFF' && userId === resourceUserId) {
    return true;
  }
  
  // Customer can access their own resources
  if (userRole === 'CUSTOMER' && userId === resourceUserId) {
    return true;
  }
  
  return false;
};

/**
 * Get token expiration date
 */
export const getTokenExpiration = (token: string): Date | null => {
  try {
    const decoded = jwt.decode(token) as any;
    if (decoded && decoded.exp) {
      return new Date(decoded.exp * 1000);
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Check if token is expired
 */
export const isTokenExpired = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  
  return expiration < new Date();
};

/**
 * Get time until token expires (in seconds)
 */
export const getTimeUntilExpiration = (token: string): number => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return 0;
  
  const now = new Date();
  const timeUntilExpiration = Math.floor((expiration.getTime() - now.getTime()) / 1000);
  
  return Math.max(0, timeUntilExpiration);
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length >= 8) {
    score += 1;
  } else {
    feedback.push('Password should be at least 8 characters long');
  }
  
  // Uppercase check
  if (/[A-Z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one uppercase letter');
  }
  
  // Lowercase check
  if (/[a-z]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one lowercase letter');
  }
  
  // Number check
  if (/\d/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one number');
  }
  
  // Special character check
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    score += 1;
  } else {
    feedback.push('Password should contain at least one special character');
  }
  
  // Length bonus
  if (password.length >= 12) {
    score += 1;
  }
  
  return {
    isValid: score >= 4,
    score,
    feedback,
  };
};

/**
 * Generate API key
 */
export const generateApiKey = (): string => {
  const prefix = 'sk_';
  const randomPart = generateSecureToken(48);
  return prefix + randomPart;
};

/**
 * Mask sensitive data
 */
export const maskEmail = (email: string): string => {
  const [username, domain] = email.split('@');
  const maskedUsername = username.charAt(0) + '*'.repeat(username.length - 2) + username.charAt(username.length - 1);
  return `${maskedUsername}@${domain}`;
};

/**
 * Mask phone number
 */
export const maskPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length >= 10) {
    return cleaned.replace(/(\d{3})\d{3}(\d{4})/, '$1***$2');
  }
  return phone;
};
