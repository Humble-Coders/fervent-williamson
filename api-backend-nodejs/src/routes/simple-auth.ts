import { Router, Request, Response } from 'express';
import { prisma } from '@/config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '@/config/env';

const router = Router();

// Register endpoint
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Name, email, and password are required' }
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: { message: 'User with this email already exists' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        role: 'CUSTOMER'
      }
    });

    // Create loyalty account
    await prisma.loyaltyAccount.create({
      data: {
        userId: user.id,
        points: 0,
        totalSpent: 0,
        level: 'Bronze'
      }
    });

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt.toISOString()
    };

    res.status(201).json({
      success: true,
      data: { user: userData, token },
      message: 'User registered successfully'
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Login endpoint
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, phone, password } = req.body;

    // Basic validation
    if ((!email && !phone) || !password) {
      return res.status(400).json({
        success: false,
        error: { message: 'Email/phone and password are required' }
      });
    }

    // Find user by email or phone
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email: email.toLowerCase() } : {},
          phone ? { phone: phone } : {}
        ].filter(condition => Object.keys(condition).length > 0),
        isActive: true
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' }
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      createdAt: user.createdAt.toISOString()
    };

    res.status(200).json({
      success: true,
      data: { user: userData, token },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get profile endpoint (with simple auth middleware)
router.get('/profile', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { message: 'Access token required' }
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, env.JWT_SECRET) as any;

    const user = await prisma.user.findUnique({
      where: {
        id: decoded.userId,
        isActive: true
      },
      include: {
        ownedSalons: {
          select: {
            id: true,
            displayId: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            isOpen: true,
          }
        },
        loyaltyAccount: true,
        _count: {
          select: {
            bookings: true,
            favorites: true,
            reviews: true,
          }
        }
      }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not found' }
      });
    }

    // Calculate user statistics
    const completedBookings = await prisma.booking.count({
      where: {
        userId: user.id,
        status: 'COMPLETED'
      }
    });

    const totalSpent = await prisma.booking.aggregate({
      where: {
        userId: user.id,
        status: 'COMPLETED'
      },
      _sum: {
        totalPrice: true
      }
    });

    const avgRating = await prisma.review.aggregate({
      where: {
        userId: user.id
      },
      _avg: {
        rating: true
      }
    });

    // Return user data (without password)
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      avatar: user.avatar,
      role: user.role,
      ownedSalons: user.ownedSalons || [],
      createdAt: user.createdAt.toISOString(),
      stats: {
        appointments: completedBookings,
        favorites: user._count.favorites,
        avgRating: avgRating._avg.rating || 0,
        totalSpent: Number(totalSpent._sum.totalPrice) || 0,
        totalBookings: user._count.bookings,
        totalReviews: user._count.reviews,
        level: user.loyaltyAccount?.level || 'Bronze',
        points: user.loyaltyAccount?.points || 0
      }
    };

    res.status(200).json({
      success: true,
      data: userData,
      message: 'Profile retrieved successfully'
    });

  } catch (error) {
    console.error('Profile error:', error);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid or expired token' }
      });
    }
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;
