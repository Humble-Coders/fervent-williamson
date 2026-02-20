// Re-export all types from different modules
export * from './api';
export * from './database';
export * from './utils';

// Express types extensions
import { Request } from 'express';
import { User } from '@prisma/client';

// Create a proper authenticated user type
export interface AuthenticatedUser extends User {
  loyaltyAccount?: any;
  ownedSalons?: any[];
}

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      file?: {
        fieldname: string;
        originalname: string;
        encoding: string;
        mimetype: string;
        size: number;
        destination: string;
        filename: string;
        path: string;
        buffer: Buffer;
      };
      files?: {
        [fieldname: string]: Express.Multer.File[];
      } | Express.Multer.File[];
    }
  }
}

// JWT Payload interface
export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Refresh Token Payload interface
export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
  iat?: number;
  exp?: number;
}

// Service layer interfaces
export interface IUserService {
  findById(id: string): Promise<AuthenticatedUser | null>;
  findByEmail(email: string): Promise<AuthenticatedUser | null>;
  create(data: any): Promise<AuthenticatedUser>;
  update(id: string, data: any): Promise<AuthenticatedUser>;
  delete(id: string): Promise<void>;
  findMany(options: any): Promise<AuthenticatedUser[]>;
}

export interface ICustomerService {
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  findMany(options: any): Promise<any[]>;
}

export interface IStylistService {
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  findMany(options: any): Promise<any[]>;
  assignService(stylistId: string, serviceId: string): Promise<void>;
  removeService(stylistId: string, serviceId: string): Promise<void>;
}

export interface IServiceService {
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  findMany(options: any): Promise<any[]>;
}

export interface IAppointmentService {
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  findMany(options: any): Promise<any[]>;
  cancel(id: string): Promise<any>;
  complete(id: string): Promise<any>;
}

export interface IPaymentService {
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  processPayment(appointmentId: string, data: any): Promise<any>;
  refund(id: string): Promise<any>;
}

export interface IReviewService {
  findById(id: string): Promise<any>;
  create(data: any): Promise<any>;
  update(id: string, data: any): Promise<any>;
  delete(id: string): Promise<void>;
  findMany(options: any): Promise<any[]>;
}

export interface IAuthService {
  login(email: string, password: string): Promise<any>;
  register(data: any): Promise<any>;
  refreshToken(token: string): Promise<any>;
  logout(userId: string, tokenId?: string): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<void>;
}

// Repository layer interfaces
export interface IBaseRepository<T> {
  findById(id: string): Promise<T | null>;
  findMany(options?: any): Promise<T[]>;
  create(data: any): Promise<T>;
  update(id: string, data: any): Promise<T>;
  delete(id: string): Promise<void>;
  count(where?: any): Promise<number>;
}

// Controller response helpers
export interface ControllerResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Middleware interfaces
export interface AuthMiddleware {
  authenticate: (req: Request, res: any, next: any) => Promise<void>;
  authorize: (roles: string[]) => (req: Request, res: any, next: any) => Promise<void>;
}

export interface ValidationMiddleware {
  validate: (schema: any) => (req: Request, res: any, next: any) => void;
}

// Configuration interfaces
export interface DatabaseConfig {
  url: string;
  maxConnections?: number;
  timeout?: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshSecret: string;
  refreshExpiresIn: string;
}

export interface ServerConfig {
  port: number;
  host: string;
  environment: string;
}

export interface CorsConfig {
  origin: string | string[];
  credentials: boolean;
  methods: string[];
  allowedHeaders: string[];
}

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

// Event interfaces
export interface AppEvent {
  type: string;
  payload: any;
  timestamp: Date;
  userId?: string;
}

export interface UserEvent extends AppEvent {
  type: 'user.created' | 'user.updated' | 'user.deleted' | 'user.login' | 'user.logout';
}

export interface AppointmentEvent extends AppEvent {
  type: 'appointment.created' | 'appointment.updated' | 'appointment.cancelled' | 'appointment.completed';
}

export interface PaymentEvent extends AppEvent {
  type: 'payment.created' | 'payment.processed' | 'payment.failed' | 'payment.refunded';
}
