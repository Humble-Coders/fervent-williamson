/**
 * Service Interfaces
 * Define contracts for all services to ensure modularity and testability
 */

// Common types
export interface ServiceResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Authentication Interfaces
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
  role?: string;
}

export interface SocialAuthData {
  provider: 'google' | 'facebook' | 'apple';
  token: string;
  email?: string;
  name?: string;
  avatar?: string;
}

export interface IAuthService {
  register(data: RegisterData): Promise<ServiceResponse<{ user: AuthUser; tokens: AuthTokens }>>;
  login(credentials: LoginCredentials): Promise<ServiceResponse<{ user: AuthUser; tokens: AuthTokens }>>;
  loginWithSocial(data: SocialAuthData): Promise<ServiceResponse<{ user: AuthUser; tokens: AuthTokens }>>;
  refreshToken(refreshToken: string): Promise<ServiceResponse<AuthTokens>>;
  logout(userId: string, refreshToken?: string): Promise<ServiceResponse<void>>;
  verifyToken(token: string): Promise<ServiceResponse<AuthUser>>;
  resetPassword(email: string): Promise<ServiceResponse<void>>;
  changePassword(userId: string, oldPassword: string, newPassword: string): Promise<ServiceResponse<void>>;
}

// OTP Interfaces
export interface OTPData {
  contact: string; // email or phone
  type: 'email' | 'sms';
  purpose: 'verification' | 'login' | 'password_reset';
  otp?: string; // Optional for custom OTP
  expiresIn?: number; // Minutes
}

export interface IOTPService {
  generateOTP(length?: number): string;
  sendOTP(data: OTPData): Promise<ServiceResponse<{ otp?: string; isDevelopmentMode?: boolean }>>;
  verifyOTP(contact: string, otp: string, purpose?: string): Promise<ServiceResponse<boolean>>;
  resendOTP(contact: string, type: 'email' | 'sms', purpose?: string): Promise<ServiceResponse<void>>;
  cleanupExpiredOTPs(): Promise<void>;
}

// Email Interfaces
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface EmailData {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export interface IEmailService {
  sendEmail(data: EmailData): Promise<ServiceResponse<{ messageId: string }>>;
  sendTemplate(templateName: string, to: string, data: Record<string, any>): Promise<ServiceResponse<{ messageId: string }>>;
  verifyConnection(): Promise<ServiceResponse<boolean>>;
}

// SMS Interfaces
export interface SMSData {
  to: string;
  message: string;
  template?: string;
  templateData?: Record<string, any>;
}

export interface ISMSService {
  sendSMS(data: SMSData): Promise<ServiceResponse<{ messageId: string }>>;
  sendTemplate(templateName: string, to: string, data: Record<string, any>): Promise<ServiceResponse<{ messageId: string }>>;
  verifyConnection(): Promise<ServiceResponse<boolean>>;
}

// Storage Interfaces
export interface FileUploadData {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  folder?: string;
}

export interface StoredFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path: string;
  folder?: string;
  createdAt: Date;
}

export interface IStorageService {
  uploadFile(data: FileUploadData): Promise<ServiceResponse<StoredFile>>;
  uploadFiles(files: FileUploadData[]): Promise<ServiceResponse<StoredFile[]>>;
  deleteFile(fileId: string): Promise<ServiceResponse<void>>;
  getFile(fileId: string): Promise<ServiceResponse<StoredFile>>;
  getFileUrl(fileId: string): Promise<ServiceResponse<string>>;
  listFiles(folder?: string, pagination?: PaginationOptions): Promise<ServiceResponse<PaginatedResponse<StoredFile>>>;
}

// Repository Interfaces (for database abstraction)
export interface IRepository<T, CreateData = Partial<T>, UpdateData = Partial<T>> {
  create(data: CreateData): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(criteria: Partial<T>): Promise<T | null>;
  findMany(criteria?: Partial<T>, pagination?: PaginationOptions): Promise<PaginatedResponse<T>>;
  update(id: string, data: UpdateData): Promise<T>;
  delete(id: string): Promise<void>;
  count(criteria?: Partial<T>): Promise<number>;
}

// Logger Interface
export interface ILogger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
  debug(message: string, meta?: any): void;
}
