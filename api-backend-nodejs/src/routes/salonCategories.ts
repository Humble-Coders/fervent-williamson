import express, { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// GET /api/v1/salon/categories - Get all categories available to salon (global + salon-specific)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

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
    const salonDisplayId = salon.displayId; // Display ID for queries

    console.log(`🏪 Salon: ${salon.name} (Display ID: ${salonDisplayId})`);

    // Get global categories and salon-specific categories using Display ID
    const categories = await prisma.serviceCategory.findMany({
      where: {
        OR: [
          { isGlobal: true },
          { salonDisplayId: salonDisplayId }
        ]
      },
      orderBy: [
        { isGlobal: 'desc' }, // Global categories first
        { name: 'asc' }
      ]
    });

    console.log(`📊 Found ${categories.length} categories for salon ${salon.name}`);

    res.json({
      success: true,
      data: categories,
      message: 'Categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching salon categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// GET /api/v1/salon/categories/custom - Get only salon-specific categories
router.get('/custom', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

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
    const salonDisplayId = salon.displayId; // Display ID for queries

    console.log(`🏪 Getting custom categories for salon: ${salon.name} (Display ID: ${salonDisplayId})`);

    // Get only salon-specific categories using Display ID
    const categories = await prisma.serviceCategory.findMany({
      where: {
        salonDisplayId: salonDisplayId,
        isGlobal: false
      },
      orderBy: { name: 'asc' }
    });

    console.log(`📊 Found ${categories.length} custom categories for salon ${salon.name}`);

    res.json({
      success: true,
      data: categories,
      message: 'Salon categories retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching salon categories:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// POST /api/v1/salon/categories - Create new salon-specific category
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1, 'Icon is required'),
  emoji: z.string().min(1, 'Emoji is required'),
  color: z.string().min(1, 'Color is required'),
  description: z.string().optional(),
});

router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const validatedData = createCategorySchema.parse(req.body);

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
    const salonDisplayId = salon.displayId; // Display ID for queries

    console.log(`🏪 Creating category for salon: ${salon.name} (Display ID: ${salonDisplayId})`);

    // Check if category already exists for this salon using Display ID
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        name: validatedData.name,
        salonDisplayId: salonDisplayId
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists for this salon'
      });
    }

    const category = await prisma.serviceCategory.create({
      data: {
        ...validatedData,
        isGlobal: false,
        salonDisplayId: salonDisplayId
      }
    });

    console.log(`✅ Created category: ${category.name} for salon ${salon.name}`);

    res.status(201).json({
      success: true,
      data: category,
      message: 'Salon category created successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }
    console.error('Error creating salon category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// PUT /api/v1/salon/categories/:id - Update salon-specific category
const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  icon: z.string().min(1).optional(),
  emoji: z.string().min(1).optional(),
  color: z.string().min(1).optional(),
  description: z.string().optional(),
});

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

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
    const salonId = salon.id; // UUID for foreign key
    const salonDisplayId = salon.displayId; // Display ID for queries

    // Check if category exists and belongs to this salon using Display ID
    const category = await prisma.serviceCategory.findFirst({
      where: {
        id,
        salonDisplayId: salonDisplayId,
        isGlobal: false
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or not owned by salon'
      });
    }

    const updatedCategory = await prisma.serviceCategory.update({
      where: { id },
      data: validatedData
    });

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Salon category updated successfully'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues
      });
    }
    console.error('Error updating salon category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// DELETE /api/v1/salon/categories/:id - Delete salon-specific category
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

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
    const salonDisplayId = salon.displayId; // Display ID for queries

    // Check if category exists and belongs to this salon using Display ID
    const category = await prisma.serviceCategory.findFirst({
      where: {
        id,
        salonDisplayId: salonDisplayId,
        isGlobal: false
      },
      include: { services: true }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found or not owned by salon'
      });
    }

    if (category.services.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing services'
      });
    }

    await prisma.serviceCategory.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Salon category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting salon category:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

export default router;
