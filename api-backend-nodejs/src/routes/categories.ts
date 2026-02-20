import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/simpleAuth';

const router = Router();
const prisma = new PrismaClient();

// GET /api/v1/categories - Get service categories (public endpoint)
router.get('/', async (req: Request, res: Response) => {
  try {
    const { dashboardVisible } = req.query;

    let whereClause: any = {};

    // If dashboardVisible is requested, return all visible categories (global + salon-specific)
    if (dashboardVisible === 'true') {
      whereClause.isDashboardVisible = true;
    } else {
      // Default behavior: only global categories
      whereClause = {
        isGlobal: true,
        salonDisplayId: null
      };
    }

    const categories = await prisma.serviceCategory.findMany({
      where: whereClause,
      orderBy: [
        { dashboardSortOrder: 'asc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: categories,
      message: dashboardVisible === 'true'
        ? 'Dashboard visible categories retrieved successfully'
        : 'Global service categories retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching global service categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch global service categories',
    });
  }
});

// GET /api/v1/categories/all - Get all service categories (global + salon-specific) for admin
router.get('/all', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { search, type } = req.query;

    // Build where clause for filtering
    const whereClause: any = {};

    // Filter by type if specified
    if (type === 'global') {
      whereClause.isGlobal = true;
      whereClause.salonDisplayId = null;
    } else if (type === 'salon') {
      whereClause.isGlobal = false;
      whereClause.salonDisplayId = { not: null };
    }

    // Add search filter if provided - search in category name and salon name
    if (search && typeof search === 'string') {
      whereClause.OR = [
        {
          name: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          salon: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    const categories = await prisma.serviceCategory.findMany({
      where: whereClause,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            displayId: true
          }
        },
        _count: {
          select: {
            services: true
          }
        }
      },
      orderBy: [
        { isGlobal: 'desc' }, // Global categories first
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: categories,
      message: 'All service categories retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching all service categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service categories',
    });
  }
});

// PUT /api/v1/categories/:id/visibility - Update category dashboard visibility
router.put('/:id/visibility', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admin can access this
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { id } = req.params;
    const { isDashboardVisible, dashboardSortOrder } = req.body;

    // Validate input
    if (typeof isDashboardVisible !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isDashboardVisible must be a boolean',
      });
    }

    // Update the category
    const updatedCategory = await prisma.serviceCategory.update({
      where: { id },
      data: {
        isDashboardVisible,
        ...(dashboardSortOrder !== undefined && { dashboardSortOrder })
      }
    });

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Category visibility updated successfully',
    });
  } catch (error) {
    console.error('Error updating category visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category visibility',
    });
  }
});

// PUT /api/v1/categories/bulk-visibility - Update multiple categories visibility
router.put('/bulk-visibility', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Only admin can access this
    if (user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin role required.',
      });
    }

    const { updates } = req.body;

    // Validate input
    if (!Array.isArray(updates)) {
      return res.status(400).json({
        success: false,
        message: 'updates must be an array',
      });
    }

    // Update categories in transaction
    const updatedCategories = await prisma.$transaction(
      updates.map((update: any) =>
        prisma.serviceCategory.update({
          where: { id: update.id },
          data: {
            isDashboardVisible: update.isDashboardVisible,
            ...(update.dashboardSortOrder !== undefined && { dashboardSortOrder: update.dashboardSortOrder })
          }
        })
      )
    );

    res.json({
      success: true,
      data: updatedCategories,
      message: 'Categories visibility updated successfully',
    });
  } catch (error) {
    console.error('Error updating categories visibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update categories visibility',
    });
  }
});

// GET /api/v1/categories/:id - Get category by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.serviceCategory.findUnique({
      where: { id },
      include: {
        services: {
          include: {
            salon: {
              select: {
                id: true,
                name: true,
                rating: true,
                featured: true,
                isOpen: true,
              }
            }
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Service category not found',
      });
    }

    res.json({
      success: true,
      data: category,
      message: 'Service category retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching service category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service category',
    });
  }
});

// POST /api/v1/categories - Create new service category (Admin only)
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  icon: z.string().min(1, 'Icon is required'),
  emoji: z.string().min(1, 'Emoji is required'),
  color: z.string().min(1, 'Color is required'),
  description: z.string().optional(),
});

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validatedData = createCategorySchema.parse(req.body);

    // Check if global category already exists
    const existingCategory = await prisma.serviceCategory.findFirst({
      where: {
        name: validatedData.name,
        isGlobal: true,
        salonDisplayId: null
      }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Global service category already exists',
      });
    }

    const category = await prisma.serviceCategory.create({
      data: {
        ...validatedData,
        isGlobal: true,
        salonDisplayId: null // Ensure it's a global category
      },
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Service category created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating service category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service category',
    });
  }
});

// PUT /api/v1/categories/:id - Update service category (Admin only)
const updateCategorySchema = createCategorySchema.partial();

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateCategorySchema.parse(req.body);

    const category = await prisma.serviceCategory.findFirst({
      where: {
        id,
        isGlobal: true,
        salonDisplayId: null
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Global service category not found',
      });
    }

    const updatedCategory = await prisma.serviceCategory.update({
      where: { id },
      data: validatedData,
    });

    res.json({
      success: true,
      data: updatedCategory,
      message: 'Service category updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating service category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service category',
    });
  }
});

// DELETE /api/v1/categories/:id - Delete service category (Admin only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const category = await prisma.serviceCategory.findFirst({
      where: {
        id,
        isGlobal: true,
        salonDisplayId: null
      },
      include: {
        services: true
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Global service category not found',
      });
    }

    if (category.services.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category with existing services',
      });
    }

    await prisma.serviceCategory.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Service category deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting service category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service category',
    });
  }
});

// GET /api/v1/categories/by-slug/:slug - Get category by slug/name
router.get('/by-slug/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Map common slugs to category names
    const categoryMap: { [key: string]: string } = {
      'hair': 'Hair Care',
      'facial': 'Facial',
      'nails': 'Nail Care',
      'massage': 'Massage',
      'makeup': 'Makeup',
      'skincare': 'Skin Care',
      'waxing': 'Waxing',
      'threading': 'Threading',
      'spa': 'Spa',
      'bridal': 'Bridal'
    };

    const categoryName = categoryMap[slug.toLowerCase()] || slug;

    const category = await prisma.serviceCategory.findFirst({
      where: {
        OR: [
          { name: { equals: categoryName, mode: 'insensitive' } },
          { name: { contains: categoryName, mode: 'insensitive' } },
          { name: { contains: slug, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: {
            services: {
              where: {
                isActive: true,
                salon: {
                  isOpen: true
                }
              }
            }
          }
        }
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: {
        ...category,
        serviceCount: category._count.services
      },
      message: 'Category retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
    });
  }
});



export default router;
