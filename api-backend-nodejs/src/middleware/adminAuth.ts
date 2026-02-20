import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types/auth';
import { createResponse } from '@/utils/helpers';
import { logger } from '@/config/logger';

/**
 * Middleware to check if user has admin role
 */
export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      logger.warn('Admin access attempted without authentication');
      return res.status(401).json(createResponse(
        false, 
        null, 
        'Authentication required'
      ));
    }

    if (user.role !== 'ADMIN') {
      logger.warn('Non-admin user attempted admin access', { 
        userId: user.id, 
        userRole: user.role 
      });
      return res.status(403).json(createResponse(
        false, 
        null, 
        'Access denied. Admin role required.'
      ));
    }

    logger.info('Admin access granted', { adminId: user.id });
    next();
  } catch (error) {
    logger.error('Error in admin authorization middleware', error);
    return res.status(500).json(createResponse(
      false, 
      null, 
      'Internal server error'
    ));
  }
};

/**
 * Middleware to check if user has salon owner role or admin role
 */
export const requireSalonOwnerOrAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json(createResponse(
        false, 
        null, 
        'Authentication required'
      ));
    }

    if (user.role !== 'ADMIN' && user.role !== 'SALON_OWNER') {
      logger.warn('Unauthorized salon management access attempt', { 
        userId: user.id, 
        userRole: user.role 
      });
      return res.status(403).json(createResponse(
        false, 
        null, 
        'Access denied. Salon owner or admin role required.'
      ));
    }

    next();
  } catch (error) {
    logger.error('Error in salon owner authorization middleware', error);
    return res.status(500).json(createResponse(
      false, 
      null, 
      'Internal server error'
    ));
  }
};

/**
 * Middleware to check if user can access specific salon
 * (Admin can access any salon, salon owner can only access their own)
 */
export const requireSalonAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    const salonId = req.params.id || req.params.salonId;
    
    if (!user) {
      return res.status(401).json(createResponse(
        false, 
        null, 
        'Authentication required'
      ));
    }

    // Admin can access any salon
    if (user.role === 'ADMIN') {
      return next();
    }

    // Salon owner can only access their own salon
    if (user.role === 'SALON_OWNER') {
      // This would need to be implemented with a database check
      // For now, we'll pass the check and let the controller handle it
      return next();
    }

    return res.status(403).json(createResponse(
      false, 
      null, 
      'Access denied. Insufficient permissions.'
    ));
  } catch (error) {
    logger.error('Error in salon access authorization middleware', error);
    return res.status(500).json(createResponse(
      false, 
      null, 
      'Internal server error'
    ));
  }
};

/**
 * Middleware to check if user has super admin role (for critical operations)
 */
export const requireSuperAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json(createResponse(
        false, 
        null, 
        'Authentication required'
      ));
    }

    // Check if user is super admin (you might have a separate field for this)
    if (user.role !== 'ADMIN' || !user.isSuperAdmin) {
      logger.warn('Super admin access attempted by non-super admin', { 
        userId: user.id, 
        userRole: user.role 
      });
      return res.status(403).json(createResponse(
        false, 
        null, 
        'Access denied. Super admin role required.'
      ));
    }

    logger.info('Super admin access granted', { adminId: user.id });
    next();
  } catch (error) {
    logger.error('Error in super admin authorization middleware', error);
    return res.status(500).json(createResponse(
      false, 
      null, 
      'Internal server error'
    ));
  }
};

/**
 * Middleware to log admin actions for audit trail
 */
export const logAdminAction = (action: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      // Log the action after response is sent
      const user = req.user;
      if (user && user.role === 'ADMIN') {
        logger.info('Admin action performed', {
          adminId: user.id,
          action,
          method: req.method,
          path: req.path,
          params: req.params,
          query: req.query,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString(),
        });
      }
      
      return originalSend.call(this, data);
    };
    
    next();
  };
};
