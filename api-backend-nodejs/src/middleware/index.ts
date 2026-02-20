// Middleware barrel exports
export { authenticate } from './auth';
export { authenticateToken } from './simpleAuth';
export { validate } from './validation';
export { globalErrorHandler as errorHandler } from './errorHandler';
export { requireAdmin, requireSalonOwnerOrAdmin, logAdminAction } from './adminAuth';

// Re-export middleware types
export type { AuthMiddleware, ValidationMiddleware } from '../types';
