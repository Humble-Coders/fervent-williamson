import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { AppError } from './errorHandler';

export interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export const validate = (schemas: ValidationSchemas) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }

      // Validate query parameters
      if (schemas.query) {
        const validatedQuery = schemas.query.parse(req.query);
        req.query = validatedQuery as typeof req.query;
      }

      // Validate route parameters
      if (schemas.params) {
        const validatedParams = schemas.params.parse(req.params);
        req.params = validatedParams as typeof req.params;
      }

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(error);
      } else {
        next(new AppError('Validation failed', 400));
      }
    }
  };
};

// Common validation schemas
export const commonSchemas = {
  id: z.object({
    id: z.string().uuid('Invalid ID format'),
  }),

  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val, 10) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val, 10) : 10),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  }),

  search: z.object({
    q: z.string().optional(),
  }),
};

// Email validation
export const emailSchema = z.string().email('Invalid email format');

// Password validation
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 
    'Password must contain at least one lowercase letter, one uppercase letter, and one number');

// Phone validation
export const phoneSchema = z
  .string()
  .regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');

// Date validation
export const dateSchema = z.string().datetime('Invalid date format');

// File validation
export const fileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string(),
  size: z.number(),
  destination: z.string().optional(),
  filename: z.string().optional(),
  path: z.string().optional(),
  buffer: z.instanceof(Buffer).optional(),
});
