import { apiClient, TokenManager } from './api';
import { logger } from '@/config/logger';
import { BaseService } from './BaseService';
import {
  User,
  LoginCredentials,
  RegisterData,
  AuthResponse,
  OTPRequest,
  OTPVerification,
  PasswordResetRequest,
  PasswordReset
} from '../types';
import { ApiResponse } from '../types/api';

/**
 * Authentication service with comprehensive auth operations
 */
class AuthService extends BaseService<User> {
  constructor() {
    super('/auth');
  }

  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);

    if (response.success && response.data) {
      TokenManager.setToken((response.data as any).token);
      if ((response.data as any).refreshToken) {
        TokenManager.setRefreshToken((response.data as any).refreshToken);
      }
    }

    return response.data!;
  }

  /**
   * Register new user
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);

    if (response.success && response.data) {
      TokenManager.setToken((response.data as any).token);
      if ((response.data as any).refreshToken) {
        TokenManager.setRefreshToken((response.data as any).refreshToken);
      }
    }

    return response.data!;
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      logger.warn('Logout API call failed:', error);
    } finally {
      TokenManager.clearTokens();
    }
  }

  /**
   * Get current user profile
   */
  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get<User>('/auth/me');
    return response.data!;
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<User>): Promise<User> {
    const response = await apiClient.patch<User>('/auth/profile', updates);
    return response.data!;
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(): Promise<{ token: string; refreshToken: string }> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await apiClient.post<{ token: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    });

    if (response.success && response.data) {
      TokenManager.setToken((response.data as any).token);
      TokenManager.setRefreshToken((response.data as any).refreshToken);
    }

    return response.data!;
  }

  /**
   * Send OTP for verification
   */
  async sendOTP(request: OTPRequest): Promise<void> {
    await apiClient.post('/auth/send-otp', request);
  }

  /**
   * Verify OTP
   */
  async verifyOTP(verification: OTPVerification): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/verify-otp', verification);

    if (response.success && response.data) {
      TokenManager.setToken((response.data as any).token);
      if ((response.data as any).refreshToken) {
        TokenManager.setRefreshToken((response.data as any).refreshToken);
      }
    }

    return response.data!;
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(request: PasswordResetRequest): Promise<void> {
    await apiClient.post('/auth/forgot-password', request);
  }

  /**
   * Reset password with token
   */
  async resetPassword(reset: PasswordReset): Promise<void> {
    await apiClient.post('/auth/reset-password', reset);
  }

  /**
   * Get user profile
   */
  async getProfile(): Promise<User> {
    const response = await apiClient.get<User>('/auth/profile');
    return response.data!;
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await apiClient.post('/auth/change-password', data);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!TokenManager.getToken();
  }

  /**
   * Get current auth token
   */
  getToken(): string | null {
    return TokenManager.getToken();
  }

  /**
   * Social login (Google, Facebook, etc.)
   */
  async socialLogin(provider: string, token: string): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`/auth/social/${provider}`, {
      token,
    });

    if (response.success && response.data) {
      TokenManager.setToken((response.data as any).token);
      if ((response.data as any).refreshToken) {
        TokenManager.setRefreshToken((response.data as any).refreshToken);
      }
    }

    return response.data!;
  }
}

// Create and export the service instance
export const authService = new AuthService();
export default authService;