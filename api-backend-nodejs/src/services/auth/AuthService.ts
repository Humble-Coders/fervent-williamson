/**
 * Modular Authentication Service
 * Provider-agnostic authentication with support for multiple auth methods
 */

import { BaseService } from '../../core/BaseService';
import {
  IAuthService,
  AuthUser,
  AuthTokens,
  LoginCredentials,
  RegisterData,
  SocialAuthData,
  ServiceResponse,
  IRepository,
  IOTPService
} from '../../interfaces/services';
import { getService } from '../../core/container';
import { appConfig } from '../../config/configLoader';
import { 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken,
  generateSecureToken
} from '../../utils/auth';

export class AuthService extends BaseService implements IAuthService {
  private userRepository: IRepository<any>;

  constructor() {
    super();
    this.userRepository = getService('userRepository');
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<ServiceResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      // Validate input
      const validation = this.validateRegisterData(data);
      if (!validation.isValid) {
        return this.error(validation.message!);
      }

      const { name, email, password, phone, role = 'CUSTOMER' } = data;

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({ 
        email: email.toLowerCase() 
      });

      if (existingUser) {
        return this.error('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const userData = {
        name: this.sanitizeString(name),
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone ? this.sanitizeString(phone) : undefined,
        role,
        isActive: true
      };

      const user = await this.userRepository.create(userData);

      // Create business-specific data if enabled
      await this.createBusinessSpecificData(user);

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logOperation('User registered', { userId: user.id, email: user.email });

      return this.success({
        user: this.mapToAuthUser(user),
        tokens
      });

    } catch (error) {
      this.logError('Register user', error);
      return this.error('Failed to register user');
    }
  }

  /**
   * Login user with email/password
   */
  async login(credentials: LoginCredentials): Promise<ServiceResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      const { email, password } = credentials;

      // Validate input
      if (!email || !password) {
        return this.error('Email and password are required');
      }

      if (!this.isValidEmail(email)) {
        return this.error('Invalid email format');
      }

      // Find user
      const user = await this.userRepository.findOne({
        email: email.toLowerCase(),
        isActive: true
      });

      if (!user) {
        return this.error('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return this.error('Invalid email or password');
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      this.logOperation('User logged in', { userId: user.id, email: user.email });

      return this.success({
        user: this.mapToAuthUser(user),
        tokens
      });

    } catch (error) {
      this.logError('Login user', error);
      return this.error('Failed to login user');
    }
  }

  /**
   * Login with social provider
   */
  async loginWithSocial(data: SocialAuthData): Promise<ServiceResponse<{ user: AuthUser; tokens: AuthTokens }>> {
    try {
      const { provider, token, email, name, avatar } = data;

      if (!appConfig.features.socialAuth) {
        return this.error('Social authentication is disabled');
      }

      // Verify social token (implementation depends on provider)
      const socialUser = await this.verifySocialToken(provider, token);
      if (!socialUser) {
        return this.error('Invalid social authentication token');
      }

      const userEmail = email || socialUser.email;
      const userName = name || socialUser.name;

      if (!userEmail) {
        return this.error('Email is required for social authentication');
      }

      // Find or create user
      let user = await this.userRepository.findOne({
        email: userEmail.toLowerCase()
      });

      if (!user) {
        // Create new user
        const userData = {
          name: userName || userEmail.split('@')[0],
          email: userEmail.toLowerCase(),
          password: generateSecureToken(32), // Random password for social users
          avatar: avatar || socialUser.avatar,
          role: 'CUSTOMER',
          isActive: true,
          socialProvider: provider,
          socialId: socialUser.id
        };

        user = await this.userRepository.create(userData);
        await this.createBusinessSpecificData(user);

        this.logOperation('Social user created', { userId: user.id, provider });
      } else {
        // Update social info if needed
        if (!user.socialProvider || !user.socialId) {
          await this.userRepository.update(user.id, {
            socialProvider: provider,
            socialId: socialUser.id,
            avatar: avatar || socialUser.avatar || user.avatar
          });
        }

        this.logOperation('Social user logged in', { userId: user.id, provider });
      }

      // Generate tokens
      const tokens = await this.generateTokens(user);

      return this.success({
        user: this.mapToAuthUser(user),
        tokens
      });

    } catch (error) {
      this.logError('Social login', error);
      return this.error('Failed to authenticate with social provider');
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ServiceResponse<AuthTokens>> {
    try {
      if (!refreshToken) {
        return this.error('Refresh token is required');
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      if (!decoded) {
        return this.error('Invalid refresh token');
      }

      // Find user
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        return this.error('User not found or inactive');
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user);

      this.logOperation('Token refreshed', { userId: user.id });

      return this.success(tokens);

    } catch (error) {
      this.logError('Refresh token', error);
      return this.error('Failed to refresh token');
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshToken?: string): Promise<ServiceResponse<void>> {
    try {
      // In a production system, you would invalidate the refresh token
      // For now, we'll just log the logout
      this.logOperation('User logged out', { userId });

      return this.success(undefined, 'Logged out successfully');

    } catch (error) {
      this.logError('Logout user', error);
      return this.error('Failed to logout user');
    }
  }

  /**
   * Verify access token
   */
  async verifyToken(token: string): Promise<ServiceResponse<AuthUser>> {
    try {
      // This would typically be handled by middleware
      // Implementation depends on your token verification logic
      return this.error('Token verification should be handled by middleware');

    } catch (error) {
      this.logError('Verify token', error);
      return this.error('Failed to verify token');
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<ServiceResponse<void>> {
    try {
      if (!this.isValidEmail(email)) {
        return this.error('Invalid email format');
      }

      const user = await this.userRepository.findOne({
        email: email.toLowerCase(),
        isActive: true
      });

      if (!user) {
        // Don't reveal if user exists or not
        return this.success(undefined, 'If the email exists, a reset code has been sent');
      }

      // Send reset code via OTP service
      const otpService = getService<IOTPService>('otpService');
      const result = await otpService.sendOTP({
        contact: email,
        type: 'email',
        purpose: 'password_reset'
      });

      if (!result.success) {
        return this.error('Failed to send reset code');
      }

      this.logOperation('Password reset requested', { userId: user.id });

      return this.success(undefined, 'Reset code sent to your email');

    } catch (error) {
      this.logError('Reset password', error);
      return this.error('Failed to process password reset');
    }
  }

  /**
   * Change password
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<ServiceResponse<void>> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return this.error('User not found');
      }

      // Verify old password
      const isOldPasswordValid = await comparePassword(oldPassword, user.password);
      if (!isOldPasswordValid) {
        return this.error('Current password is incorrect');
      }

      // Validate new password
      if (newPassword.length < 6) {
        return this.error('New password must be at least 6 characters long');
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await this.userRepository.update(userId, {
        password: hashedPassword
      });

      this.logOperation('Password changed', { userId });

      return this.success(undefined, 'Password changed successfully');

    } catch (error) {
      this.logError('Change password', error);
      return this.error('Failed to change password');
    }
  }

  // Private methods

  private validateRegisterData(data: RegisterData): { isValid: boolean; message?: string } {
    const { name, email, password } = data;

    if (!name || !email || !password) {
      return { isValid: false, message: 'Name, email, and password are required' };
    }

    if (!this.isValidEmail(email)) {
      return { isValid: false, message: 'Invalid email format' };
    }

    if (password.length < 6) {
      return { isValid: false, message: 'Password must be at least 6 characters long' };
    }

    return { isValid: true };
  }

  private async generateTokens(user: any): Promise<AuthTokens> {
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    const refreshTokenValue = generateSecureToken(64);
    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: refreshTokenValue
    });

    // Store refresh token (in production, store in database)
    // For now, we'll just return the tokens

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60 // 15 minutes
    };
  }

  private mapToAuthUser(user: any): AuthUser {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  private async createBusinessSpecificData(user: any): Promise<void> {
    // Only create business-specific data if features are enabled
    if (appConfig.business?.loyaltyProgram) {
      // Create loyalty account
      // Implementation depends on your business logic
    }

    if (appConfig.business?.multiTenant) {
      // Handle multi-tenant setup
      // Implementation depends on your business logic
    }
  }

  private async verifySocialToken(provider: string, token: string): Promise<any> {
    // Implementation depends on the social provider
    // This is a placeholder - you would implement actual verification
    switch (provider) {
      case 'google':
        return this.verifyGoogleToken(token);
      case 'facebook':
        return this.verifyFacebookToken(token);
      case 'apple':
        return this.verifyAppleToken(token);
      default:
        return null;
    }
  }

  private async verifyGoogleToken(token: string): Promise<any> {
    // Implement Google token verification
    // Use Google's token verification API
    return null;
  }

  private async verifyFacebookToken(token: string): Promise<any> {
    // Implement Facebook token verification
    // Use Facebook's token verification API
    return null;
  }

  private async verifyAppleToken(token: string): Promise<any> {
    // Implement Apple token verification
    // Use Apple's token verification API
    return null;
  }
}
