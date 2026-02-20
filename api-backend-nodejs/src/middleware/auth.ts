import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';
import { AppError } from './errorHandler';
import { 
  extractTokenFromHeader, 
  verifyAccessToken, 
  hasRole, 
  hasPermission 
} from '@/utils/auth';
import { UserRole } from '@/types';
import { AuthenticatedRequest, OptionalAuthRequest, AuthenticatedUser } from '@/types/auth';

/**
 * Authentication middleware - verifies JWT token and attaches user to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    console.log('🔐 Authentication attempt:', {
      authorization: req.headers.authorization,
      url: req.originalUrl,
      method: req.method
    });

    // Extract token from Authorization header
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      console.log('❌ No token found in request');
      throw new AppError('Access token is required', 401);
    }

    console.log('🔑 Token extracted:', token.substring(0, 20) + '...');

    // Verify the token
    const decoded = verifyAccessToken(token);
    console.log('✅ Token decoded:', decoded);
    
    // Find the user in the database
    console.log('🔍 Looking for user:', decoded.userId);
    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        isActive: true,
      },
      include: {
        loyaltyAccount: true,
        ownedSalons: true,
      },
    });

    console.log('👤 User found:', user ? { id: user.id, email: user.email, isActive: user.isActive } : 'null');

    if (!user) {
      console.log('❌ User not found or inactive for ID:', decoded.userId);
      throw new AppError('User not found or inactive', 401);
    }

    // Attach user to request object
    req.user = user;
    
    logger.debug('User authenticated', {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      logger.warn('Authentication failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ip: req.ip,
        userAgent: req.get('User-Agent'),
      });
      
      next(new AppError('Invalid or expired token', 401));
    }
  }
};

/**
 * Optional authentication middleware - doesn't throw error if no token
 */
export const optionalAuthenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const decoded = verifyAccessToken(token);
      
      const user = await prisma.user.findUnique({
        where: { 
          id: decoded.userId,
          isActive: true,
        },
        include: {
          loyaltyAccount: true,
          ownedSalons: true,
        },
      });

      if (user) {
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Silently continue without authentication
    next();
  }
};

/**
 * Authorization middleware factory - checks if user has required roles
 */
export const authorize = (requiredRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const authenticatedUser = req.user as AuthenticatedRequest['user'];
    const userRole = authenticatedUser.role;
    
    if (!hasRole(userRole, requiredRoles)) {
      logger.warn('Authorization failed', {
        userId: authenticatedUser.id,
        userRole,
        requiredRoles,
        resource: req.originalUrl,
      });
      
      return next(new AppError('Insufficient permissions', 403));
    }

    logger.debug('User authorized', {
      userId: authenticatedUser.id,
      userRole,
      resource: req.originalUrl,
    });

    next();
  };
};

/**
 * Resource ownership middleware - checks if user owns the resource
 */
export const authorizeResourceOwnership = (resourceUserIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401));
    }

    const authenticatedUser = req.user as AuthenticatedRequest['user'];
    const userRole = authenticatedUser.role;
    const userId = authenticatedUser.id;
    const resourceUserId = req.params[resourceUserIdParam];

    if (!hasPermission(userRole, userId, resourceUserId)) {
      logger.warn('Resource access denied', {
        userId,
        userRole,
        resourceUserId,
        resource: req.originalUrl,
      });
      
      return next(new AppError('Access denied to this resource', 403));
    }

    next();
  };
};

/**
 * Admin only middleware
 */
export const adminOnly = authorize([UserRole.ADMIN]);

/**
 * Manager and above middleware
 */
export const managerAndAbove = authorize([UserRole.ADMIN, UserRole.MANAGER]);

/**
 * Staff and above middleware
 */
export const staffAndAbove = authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]);

/**
 * Customer access middleware
 */
export const customerAccess = authorize([UserRole.ADMIN, UserRole.MANAGER, UserRole.CUSTOMER]);

/**
 * Self or admin middleware - allows access to own resources or admin access
 */
export const selfOrAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const authenticatedUser = req.user as AuthenticatedRequest['user'];
  const userRole = authenticatedUser.role;
  const userId = authenticatedUser.id;
  const targetUserId = req.params.id || req.params.userId;

  // Admin can access everything
  if (userRole === UserRole.ADMIN) {
    return next();
  }

  // User can access their own resources
  if (userId === targetUserId) {
    return next();
  }

  logger.warn('Self or admin access denied', {
    userId,
    userRole,
    targetUserId,
    resource: req.originalUrl,
  });

  return next(new AppError('Access denied', 403));
};

/**
 * Customer profile access middleware
 */
export const customerProfileAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const authenticatedUser = req.user as AuthenticatedRequest['user'];
  const userRole = authenticatedUser.role;
  const userId = authenticatedUser.id;
  const customerId = req.params.customerId || req.params.id;

  // Admin and Manager can access all customer profiles
  if (([UserRole.ADMIN, UserRole.MANAGER] as UserRole[]).includes(userRole)) {
    return next();
  }

  // Staff can access customer profiles for their bookings
  if (userRole === UserRole.STAFF) {
    try {
      const booking = await prisma.booking.findFirst({
        where: {
          userId: customerId,
          // Note: In the current schema, there's no direct staff assignment
          // This would need to be implemented based on salon ownership or service assignment
        },
      });

      if (booking) {
        return next();
      }
    } catch (error) {
      logger.error('Error checking staff booking access', error);
    }
  }

  // Customer can access their own profile
  if (userRole === UserRole.CUSTOMER && userId === customerId) {
    return next();
  }

  return next(new AppError('Access denied to customer profile', 403));
};

/**
 * Staff profile access middleware
 */
export const staffProfileAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const authenticatedUser = req.user as AuthenticatedRequest['user'];
  const userRole = authenticatedUser.role;
  const userId = authenticatedUser.id;
  const staffId = req.params.staffId || req.params.id;

  // Admin and Manager can access all staff profiles
  if (([UserRole.ADMIN, UserRole.MANAGER] as UserRole[]).includes(userRole)) {
    return next();
  }

  // Staff can access their own profile
  if (userRole === UserRole.STAFF && userId === staffId) {
    return next();
  }

  return next(new AppError('Access denied to staff profile', 403));
};

/**
 * Booking access middleware
 */
export const bookingAccess = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  const authenticatedUser = req.user as AuthenticatedRequest['user'];
  const userRole = authenticatedUser.role;
  const bookingId = req.params.bookingId || req.params.id;

  // Admin and Manager can access all bookings
  if (([UserRole.ADMIN, UserRole.MANAGER] as UserRole[]).includes(userRole)) {
    return next();
  }

  try {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
        stylist: true,
      },
    });

    if (!booking) {
      return next(new AppError('Booking not found', 404));
    }

    // Staff can access bookings for their services (if they are the assigned stylist)
    // Note: This would need proper implementation based on how staff/stylist relationship is managed
    if (userRole === UserRole.STAFF) {
      // For now, allow staff to access bookings - this should be refined based on business logic
      return next();
    }

    // Customer can access their own bookings
    if (userRole === UserRole.CUSTOMER && booking.user.id === authenticatedUser.id) {
      return next();
    }

    return next(new AppError('Access denied to booking', 403));
  } catch (error) {
    logger.error('Error checking booking access', error);
    return next(new AppError('Error checking booking access', 500));
  }
};

// Keep the old name for backward compatibility
export const appointmentAccess = bookingAccess;
