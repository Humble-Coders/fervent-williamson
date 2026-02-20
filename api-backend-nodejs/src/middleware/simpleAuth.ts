import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

// Note: User type is handled by Passport.js

export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔐 Authentication attempt:', {
      url: req.originalUrl,
      method: req.method,
      hasAuthHeader: !!req.headers.authorization,
      authHeader: req.headers.authorization ? req.headers.authorization.substring(0, 20) + '...' : 'none'
    });

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      console.log('❌ No token provided');
      res.status(401).json({
        success: false,
        message: 'Access token is required',
      });
      return;
    }

    console.log('🔑 Token found, length:', token.length);
    console.log('🔑 Token preview:', token.substring(0, 20) + '...');

    // Verify the token
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    console.log('✅ Token decoded successfully:', {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role,
      iat: new Date(decoded.iat * 1000).toISOString(),
      exp: new Date(decoded.exp * 1000).toISOString(),
      isExpired: decoded.exp * 1000 < Date.now()
    });

    // Attach minimal user info to request for simple auth
    (req as any).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    console.log('✅ User authenticated successfully:', decoded.email);
    next();
  } catch (error) {
    console.error('❌ Token verification error:', {
      error: error.message,
      name: error.name,
      url: req.originalUrl,
      method: req.method
    });

    if (error.name === 'TokenExpiredError') {
      console.log('⏰ Token expired at:', error.expiredAt);
      res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
        code: 'TOKEN_EXPIRED'
      });
    } else if (error.name === 'JsonWebTokenError') {
      console.log('🚫 Invalid token format');
      res.status(401).json({
        success: false,
        message: 'Invalid token format. Please log in again.',
        code: 'INVALID_TOKEN'
      });
    } else {
      console.log('🔥 Unknown token error:', error);
      res.status(403).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'AUTH_ERROR'
      });
    }
  }
};

export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if ((req.user as any)?.role !== 'ADMIN') {
    res.status(403).json({
      success: false,
      message: 'Admin access required',
    });
    return;
  }
  next();
};

export const requireSalonOwner = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!['ADMIN', 'SALON_OWNER'].includes((req.user as any)?.role || '')) {
    res.status(403).json({
      success: false,
      message: 'Salon owner access required',
    });
    return;
  }
  next();
};
