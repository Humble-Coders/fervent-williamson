import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { authenticateToken } from '../middleware/simpleAuth';

import { AdminPasswordResetController } from '../controllers/AdminPasswordResetController';

const router = Router();

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'SALON_OWNER', 'CUSTOMER']).optional(),
  isActive: z.boolean().optional(),
});

// Middleware to check admin role
const requireAdmin = (req: Request, res: Response, next: any) => {
  const user = (req as any).user;
  if (user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin role required.',
    });
  }
  next();
};

// GET /api/v1/admin/users - Get all users (Admin only)
router.get('/users', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, search, role, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (role && role !== 'all') {
      where.role = role;
    }

    if (status && status !== 'all') {
      where.isActive = status === 'active';
    }

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookings: true,
              reviews: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: totalUsers,
          pages: Math.ceil(totalUsers / Number(limit)),
        }
      },
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
    });
  }
});

// GET /api/v1/admin/users/:id - Get user by ID (Admin only)
router.get('/users/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            salon: {
              select: { id: true, name: true }
            },
            service: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reviews: {
          include: {
            salon: {
              select: { id: true, name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        loyaltyAccount: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
          }
        }
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
    });
  }
});



// PUT /api/v1/admin/users/:id - Update user (Admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if email is being updated and is unique
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findFirst({
        where: {
          email: validatedData.email,
          id: { not: id },
        },
      });

      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists',
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
    });
  }
});

// DELETE /api/v1/admin/users/:id - Delete user (Admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUser = (req as any).user;

    // Prevent admin from deleting themselves
    if (id === currentUser.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Soft delete by setting isActive to false
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
});

// GET /api/v1/admin/stats - Get admin dashboard stats
router.get('/stats', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalSalons,
      activeSalons,
      totalBookings,
      totalRevenue,
      recentUsers,
      recentBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.salon.count(),
      prisma.salon.count({ where: { isOpen: true } }),
      prisma.booking.count(),
      prisma.booking.aggregate({
        _sum: { totalPrice: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.booking.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          salon: { select: { name: true } },
          service: { select: { name: true } },
        },
      }),
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          activeUsers,
          totalSalons,
          activeSalons,
          totalBookings,
          totalRevenue: Number(totalRevenue._sum.totalPrice) || 0,
        },
        recentUsers,
        recentBookings,
      },
      message: 'Admin stats retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin stats',
    });
  }
});

export default router;
