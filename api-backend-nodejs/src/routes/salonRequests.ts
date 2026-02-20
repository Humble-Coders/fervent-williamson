import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/simpleAuth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createSalonRequestSchema = z.object({
  salonName: z.string().min(1, 'Salon name is required').max(100),
  ownerName: z.string().min(1, 'Owner name is required').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits').max(15),
  address: z.string().optional(),
  description: z.string().optional(),
});

const updateSalonRequestSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  adminNotes: z.string().optional(),
});

// POST /api/v1/salon-requests - Create new salon request (Public)
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = createSalonRequestSchema.parse(req.body);

    // Check if email already exists in salon requests
    const existingRequest = await prisma.salonRequest.findFirst({
      where: {
        email: validatedData.email,
        status: { in: ['PENDING', 'APPROVED'] }
      }
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'A salon request with this email already exists',
      });
    }

    // Check if email already exists in salons
    const existingSalon = await prisma.salon.findFirst({
      where: { email: validatedData.email }
    });

    if (existingSalon) {
      return res.status(409).json({
        success: false,
        message: 'A salon with this email already exists',
      });
    }

    const salonRequest = await prisma.salonRequest.create({
      data: {
        salonName: validatedData.salonName,
        ownerName: validatedData.ownerName,
        email: validatedData.email,
        phone: validatedData.phone,
        address: validatedData.address,
        description: validatedData.description,
        status: 'PENDING',
      },
    });

    res.status(201).json({
      success: true,
      data: salonRequest,
      message: 'Salon request submitted successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating salon request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit salon request',
    });
  }
});

// GET /api/v1/salon-requests - Get all salon requests (Admin only)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admin can access salon requests
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { salonName: { contains: search as string, mode: 'insensitive' } },
        { ownerName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [salonRequests, total] = await Promise.all([
      prisma.salonRequest.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.salonRequest.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        salonRequests,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / Number(limit)),
        },
      },
      message: 'Salon requests retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching salon requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salon requests',
    });
  }
});

// GET /api/v1/salon-requests/:id - Get salon request by ID (Admin only)
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only admin can access salon requests
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const salonRequest = await prisma.salonRequest.findUnique({
      where: { id },
    });

    if (!salonRequest) {
      return res.status(404).json({
        success: false,
        message: 'Salon request not found',
      });
    }

    res.json({
      success: true,
      data: salonRequest,
      message: 'Salon request retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching salon request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salon request',
    });
  }
});

// PUT /api/v1/salon-requests/:id - Update salon request status (Admin only)
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only admin can update salon requests
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const validatedData = updateSalonRequestSchema.parse(req.body);

    // Check if salon request exists
    const existingRequest = await prisma.salonRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Salon request not found',
      });
    }

    const updatedRequest = await prisma.salonRequest.update({
      where: { id },
      data: {
        status: validatedData.status,
        adminNotes: validatedData.adminNotes,
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });

    res.json({
      success: true,
      data: updatedRequest,
      message: 'Salon request updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating salon request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update salon request',
    });
  }
});

// DELETE /api/v1/salon-requests/:id - Delete salon request (Admin only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only admin can delete salon requests
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    // Check if salon request exists
    const existingRequest = await prisma.salonRequest.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        message: 'Salon request not found',
      });
    }

    await prisma.salonRequest.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Salon request deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting salon request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete salon request',
    });
  }
});

export default router;
