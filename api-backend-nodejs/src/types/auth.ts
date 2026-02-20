import { Request } from 'express';
import { UserRole } from '@prisma/client';

// Authenticated user interface for type safety
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  avatar?: string | null;
  role: UserRole;
  preferences?: any;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  emailVerified: boolean;
  password?: string | null;
  isSuperAdmin?: boolean;
}

// Request with authenticated user
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

// Request with optional authenticated user
export interface OptionalAuthRequest extends Request {
  user?: AuthenticatedUser;
}
