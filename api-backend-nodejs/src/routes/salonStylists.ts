import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticateToken } from '../middleware/simpleAuth';

const router = express.Router();

// Validation schemas
const createStylistSchema = z.object({
  name: z.string().min(1, 'Stylist name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  specialties: z.array(z.string()).default([]),
  serviceIds: z.array(z.string()).default([]),
  canDoAllServices: z.boolean().default(false),
  avatar: z.string().optional(),
  images: z.array(z.string()).default([]),
  experience: z.number().min(0, 'Experience must be non-negative').default(0),
  isActive: z.boolean().default(true),
});

const updateStylistSchema = z.object({
  name: z.string().min(1, 'Stylist name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
  specialties: z.array(z.string()).optional(),
  serviceIds: z.array(z.string()).optional(),
  canDoAllServices: z.boolean().optional(),
  avatar: z.string().optional(),
  images: z.array(z.string()).optional(),
  experience: z.number().min(0, 'Experience must be non-negative').optional(),
  isActive: z.boolean().optional(),
});

// GET /api/v1/salon/stylists - Get all stylists for the authenticated salon owner
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    console.log('🔄 Fetching stylists for user:', user.id, user.role);

    // Get user's salon
    const userWithSalon = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ownedSalons: true }
    });

    if (!userWithSalon?.ownedSalons || userWithSalon.ownedSalons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No salon found for user'
      });
    }

    const salon = userWithSalon.ownedSalons[0];

    // Get stylists for this salon
    const stylists = await prisma.stylist.findMany({
      where: { salonId: salon.id },
      orderBy: { createdAt: 'desc' }
    });

    console.log('📋 Found stylists:', stylists.length);

    res.json({
      success: true,
      data: stylists,
      message: 'Stylists retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching stylists:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stylists'
    });
  }
});

// GET /api/v1/salon/stylists/:id - Get specific stylist
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    console.log('🔄 Fetching stylist:', id, 'for user:', user.id);

    // Get user's salon
    const userWithSalon = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ownedSalons: true }
    });

    if (!userWithSalon?.ownedSalons || userWithSalon.ownedSalons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No salon found for user'
      });
    }

    const salon = userWithSalon.ownedSalons[0];

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    const stylist = await prisma.stylist.findFirst({
      where: {
        AND: [
          isDisplayId ? { displayId: parseInt(id) } : { id },
          { salonId: salon.id }
        ]
      }
    });

    if (!stylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    console.log('👤 Found stylist:', stylist.name);

    res.json({
      success: true,
      data: stylist,
      message: 'Stylist retrieved successfully'
    });

  } catch (error) {
    console.error('❌ Error fetching stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stylist'
    });
  }
});

// POST /api/v1/salon/stylists - Create new stylist
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    console.log('🔄 Creating stylist for user:', user.id);

    // Validate request data
    const validatedData = createStylistSchema.parse(req.body);

    // Get user's salon
    const userWithSalon = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ownedSalons: true }
    });

    if (!userWithSalon?.ownedSalons || userWithSalon.ownedSalons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No salon found for user'
      });
    }

    const salon = userWithSalon.ownedSalons[0];

    // Check if stylist with same email or phone already exists in this salon
    const existingStylist = await prisma.stylist.findFirst({
      where: {
        AND: [
          { salonId: salon.id },
          {
            OR: [
              { email: validatedData.email },
              { phone: validatedData.phone }
            ]
          }
        ]
      }
    });

    if (existingStylist) {
      return res.status(400).json({
        success: false,
        message: 'Stylist with this email or phone already exists'
      });
    }

    // Prepare services data
    let services: any = {};
    if (validatedData.canDoAllServices) {
      // Get all services for this salon and mark them as true
      const salonServices = await prisma.service.findMany({
        where: { salonId: salon.id },
        select: { id: true }
      });
      
      services = salonServices.reduce((acc, service) => {
        acc[service.id] = true;
        return acc;
      }, {} as any);
    } else if (validatedData.serviceIds && validatedData.serviceIds.length > 0) {
      // Mark specific services as true
      services = validatedData.serviceIds.reduce((acc, serviceId) => {
        acc[serviceId] = true;
        return acc;
      }, {} as any);
    }

    // Create stylist
    const stylist = await prisma.stylist.create({
      data: {
        name: validatedData.name,
        email: validatedData.email.toLowerCase(),
        phone: validatedData.phone,
        specialties: validatedData.specialties,
        experience: validatedData.experience,
        isActive: validatedData.isActive,
        salonId: salon.id,
        services: services,
        images: validatedData.images || [],
        avatar: validatedData.avatar
      }
    });

    console.log('✅ Stylist created:', stylist.name, stylist.id);

    res.status(201).json({
      success: true,
      data: stylist,
      message: 'Stylist created successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }

    console.error('❌ Error creating stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create stylist'
    });
  }
});

// PUT /api/v1/salon/stylists/:id - Update stylist
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    console.log('🔄 Updating stylist:', id, 'for user:', user.id);

    // Validate request data
    const validatedData = updateStylistSchema.parse(req.body);

    // Get user's salon
    const userWithSalon = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ownedSalons: true }
    });

    if (!userWithSalon?.ownedSalons || userWithSalon.ownedSalons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No salon found for user'
      });
    }

    const salon = userWithSalon.ownedSalons[0];

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    // Check if stylist exists and belongs to this salon
    const existingStylist = await prisma.stylist.findFirst({
      where: {
        AND: [
          isDisplayId ? { displayId: parseInt(id) } : { id },
          { salonId: salon.id }
        ]
      }
    });

    if (!existingStylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Check for email/phone conflicts if they're being updated
    if (validatedData.email || validatedData.phone) {
      const conflictingStylist = await prisma.stylist.findFirst({
        where: {
          AND: [
            { salonId: salon.id },
            { id: { not: existingStylist.id } },
            {
              OR: [
                ...(validatedData.email ? [{ email: validatedData.email }] : []),
                ...(validatedData.phone ? [{ phone: validatedData.phone }] : [])
              ]
            }
          ]
        }
      });

      if (conflictingStylist) {
        return res.status(400).json({
          success: false,
          message: 'Another stylist with this email or phone already exists'
        });
      }
    }

    // Prepare update data
    const updateData: any = {};
    
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.email !== undefined) updateData.email = validatedData.email.toLowerCase();
    if (validatedData.phone !== undefined) updateData.phone = validatedData.phone;
    if (validatedData.specialties !== undefined) updateData.specialties = validatedData.specialties;
    if (validatedData.experience !== undefined) updateData.experience = validatedData.experience;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.images !== undefined) updateData.images = validatedData.images;
    if (validatedData.avatar !== undefined) updateData.avatar = validatedData.avatar;

    // Handle services update
    if (validatedData.serviceIds !== undefined || validatedData.canDoAllServices !== undefined) {
      let services: any = {};
      
      if (validatedData.canDoAllServices) {
        // Get all services for this salon and mark them as true
        const salonServices = await prisma.service.findMany({
          where: { salonId: salon.id },
          select: { id: true }
        });
        
        services = salonServices.reduce((acc, service) => {
          acc[service.id] = true;
          return acc;
        }, {} as any);
      } else if (validatedData.serviceIds && validatedData.serviceIds.length > 0) {
        // Mark specific services as true
        services = validatedData.serviceIds.reduce((acc, serviceId) => {
          acc[serviceId] = true;
          return acc;
        }, {} as any);
      }
      
      updateData.services = services;
    }

    // Update stylist
    const updatedStylist = await prisma.stylist.update({
      where: { id: existingStylist.id },
      data: updateData
    });

    console.log('✅ Stylist updated:', updatedStylist.name, updatedStylist.id);

    res.json({
      success: true,
      data: updatedStylist,
      message: 'Stylist updated successfully'
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }

    console.error('❌ Error updating stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stylist'
    });
  }
});

// DELETE /api/v1/salon/stylists/:id - Delete stylist
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    console.log('🔄 Deleting stylist:', id, 'for user:', user.id);

    // Get user's salon
    const userWithSalon = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ownedSalons: true }
    });

    if (!userWithSalon?.ownedSalons || userWithSalon.ownedSalons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No salon found for user'
      });
    }

    const salon = userWithSalon.ownedSalons[0];

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    // Check if stylist exists and belongs to this salon
    const existingStylist = await prisma.stylist.findFirst({
      where: {
        AND: [
          isDisplayId ? { displayId: parseInt(id) } : { id },
          { salonId: salon.id }
        ]
      }
    });

    if (!existingStylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Check if stylist has any bookings
    const bookingCount = await prisma.booking.count({
      where: { stylistId: existingStylist.id }
    });

    if (bookingCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete stylist. They have ${bookingCount} booking(s). Consider deactivating instead.`
      });
    }

    // Delete stylist
    await prisma.stylist.delete({
      where: { id: existingStylist.id }
    });

    console.log('✅ Stylist deleted:', existingStylist.name, existingStylist.id);

    res.json({
      success: true,
      message: 'Stylist deleted successfully'
    });

  } catch (error) {
    console.error('❌ Error deleting stylist:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stylist'
    });
  }
});

// PATCH /api/v1/salon/stylists/:id/status - Toggle stylist active status
router.patch('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const { isActive } = req.body;

    console.log('🔄 Toggling stylist status:', id, 'to:', isActive, 'for user:', user.id);

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isActive must be a boolean value'
      });
    }

    // Get user's salon
    const userWithSalon = await prisma.user.findUnique({
      where: { id: user.id },
      include: { ownedSalons: true }
    });

    if (!userWithSalon?.ownedSalons || userWithSalon.ownedSalons.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No salon found for user'
      });
    }

    const salon = userWithSalon.ownedSalons[0];

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    // Check if stylist exists and belongs to this salon
    const existingStylist = await prisma.stylist.findFirst({
      where: {
        AND: [
          isDisplayId ? { displayId: parseInt(id) } : { id },
          { salonId: salon.id }
        ]
      }
    });

    if (!existingStylist) {
      return res.status(404).json({
        success: false,
        message: 'Stylist not found'
      });
    }

    // Update stylist status
    const updatedStylist = await prisma.stylist.update({
      where: { id: existingStylist.id },
      data: { isActive }
    });

    console.log('✅ Stylist status updated:', updatedStylist.name, 'isActive:', updatedStylist.isActive);

    res.json({
      success: true,
      data: updatedStylist,
      message: `Stylist ${isActive ? 'activated' : 'deactivated'} successfully`
    });

  } catch (error) {
    console.error('❌ Error toggling stylist status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stylist status'
    });
  }
});

export default router;
