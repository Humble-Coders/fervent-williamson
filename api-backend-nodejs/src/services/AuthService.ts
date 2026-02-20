import { prisma } from '@/config/database';
import { AppError } from '@/middleware/errorHandler';
import { 
  hashPassword, 
  comparePassword, 
  generateAccessToken, 
  generateRefreshToken,
  verifyRefreshToken,
  generateSecureToken
} from '@/utils/auth';
import { UserRole } from '@/types';
import { logger } from '@/config/logger';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResult {
  user: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    avatar?: string | null;
    role: string;
    createdAt: string;
  };
  token: string;
  refreshToken?: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<AuthResult> {
    const { name, email, password, phone } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new AppError('User with this email already exists', 409);
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        role: UserRole.CUSTOMER,
      },
    });

    // Create loyalty account for new user
    await prisma.loyaltyAccount.create({
      data: {
        userId: user.id,
        points: 0,
        totalSpent: 0,
        level: 'Bronze',
      },
    });

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenValue = generateSecureToken(64);
    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: refreshTokenValue,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    logger.info('New user registered', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Find user
    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        isActive: true,
      },
      include: {
        loyaltyAccount: true,
      },
    });

    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const refreshTokenValue = generateSecureToken(64);
    const refreshToken = generateRefreshToken({
      userId: user.id,
      tokenId: refreshTokenValue,
    });

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        token: refreshTokenValue,
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    logger.info('User logged in', { userId: user.id, email: user.email });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      token: accessToken,
      refreshToken,
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenValue: string): Promise<{ token: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = verifyRefreshToken(refreshTokenValue);

      // Find refresh token in database
      const storedToken = await prisma.refreshToken.findUnique({
        where: { 
          token: decoded.tokenId,
          expiresAt: { gt: new Date() },
        },
        include: { user: true },
      });

      if (!storedToken || !storedToken.user.isActive) {
        throw new AppError('Invalid or expired refresh token', 401);
      }

      // Generate new tokens
      const newAccessToken = generateAccessToken({
        userId: storedToken.user.id,
        email: storedToken.user.email,
        role: storedToken.user.role,
      });

      const newRefreshTokenValue = generateSecureToken(64);
      const newRefreshToken = generateRefreshToken({
        userId: storedToken.user.id,
        tokenId: newRefreshTokenValue,
      });

      // Replace old refresh token with new one
      await prisma.$transaction([
        prisma.refreshToken.delete({ where: { id: storedToken.id } }),
        prisma.refreshToken.create({
          data: {
            token: newRefreshTokenValue,
            userId: storedToken.user.id,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
          },
        }),
      ]);

      return {
        token: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshTokenValue?: string): Promise<void> {
    if (refreshTokenValue) {
      // Remove specific refresh token
      try {
        const decoded = verifyRefreshToken(refreshTokenValue);
        await prisma.refreshToken.deleteMany({
          where: {
            token: decoded.tokenId,
            userId,
          },
        });
      } catch (error) {
        // Token might be invalid, but we still want to logout
        logger.warn('Invalid refresh token during logout', { userId });
      }
    } else {
      // Remove all refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    logger.info('User logged out', { userId });
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updates: any): Promise<any> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    });

    return user;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
    });
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<any> {
    const user = await prisma.user.findUnique({
      where: { 
        id: userId,
        isActive: true,
      },
      include: {
        loyaltyAccount: true,
        paymentMethods: true,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}
