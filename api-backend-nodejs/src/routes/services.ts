import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken } from '../middleware/simpleAuth';
import path from 'path';
import fs from 'fs';

const router = express.Router();
const prisma = new PrismaClient();

// Helper function to organize temp images for services
function organizeImages(tempUrls: string[], salon: any, service: any): string[] {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const organizedUrls: string[] = [];

  // Create organized folder path
  const salonFolder = `${salon.name.replace(/[^a-zA-Z0-9]/g, '-')}-${salon.displayId}`;
  const serviceFolder = `${service.name.replace(/[^a-zA-Z0-9]/g, '-')}-${service.displayId}`;
  const targetPath = path.join(uploadsDir, 'salons', salonFolder, 'services', serviceFolder);

  // Create directory if it doesn't exist
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  tempUrls.forEach(tempUrl => {
    try {
      // Extract filename from temp URL and decode it
      let filename: string;
      if (tempUrl.startsWith('http')) {
        // Handle absolute URLs
        const urlObj = new URL(tempUrl);
        const decodedPath = decodeURIComponent(urlObj.pathname);
        filename = path.basename(decodedPath);
      } else {
        // Handle relative URLs
        const decodedPath = decodeURIComponent(tempUrl);
        filename = path.basename(decodedPath);
      }

      const tempFilePath = path.join(uploadsDir, 'temp', filename);
      const targetFilePath = path.join(targetPath, filename);

      // Move file if it exists
      if (fs.existsSync(tempFilePath)) {
        fs.renameSync(tempFilePath, targetFilePath);
        // Create new URL with organized path
        const relativePath = path.relative(uploadsDir, targetFilePath);
        organizedUrls.push(`/uploads/${relativePath.replace(/\\/g, '/')}`);
        console.log('✅ Successfully moved service file to:', targetFilePath);
      } else {
        // If file doesn't exist in temp, it might already be organized
        console.log('❌ Service file not found in temp, keeping original URL:', tempUrl);
        organizedUrls.push(tempUrl);
      }
    } catch (error) {
      console.error('Error moving service file:', error);
      // Keep original URL if move fails
      organizedUrls.push(tempUrl);
    }
  });

  return organizedUrls;
}

// Validation schemas
const createServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(1, 'Description is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  price: z.number().min(0, 'Price must be non-negative'),
  priceCanVary: z.boolean().default(false),
  timeCanVary: z.boolean().default(false),
  popular: z.boolean().default(false),
  emoji: z.string().optional(), // Made optional - will use default if not provided
  gender: z.enum(['MALE', 'FEMALE', 'UNISEX']).optional(),
  salonId: z.string().optional(), // Made optional - will get from authenticated user
  categoryId: z.string().min(1, 'Category ID is required'),
  isActive: z.boolean().default(true),
  images: z.array(z.string()).default([]),
});

const updateServiceSchema = createServiceSchema.partial();

// GET /api/v1/services - Get all services with filters
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { salonId, categoryId, isActive, popular } = req.query;
    const user = (req as any).user;

    const where: any = {};

    // Handle salon filtering with proper isolation
    if (salonId) {
      // If salonId is provided, verify the user has access to this salon
      if (user && user.role === 'SALON_OWNER') {
        const userWithSalons = await prisma.user.findUnique({
          where: { id: user.id },
          include: { ownedSalons: true }
        });

        const ownedSalonIds = userWithSalons?.ownedSalons?.map(salon => salon.id) || [];

        if (!ownedSalonIds.includes(salonId as string)) {
          return res.status(403).json({
            success: false,
            message: 'Access denied: You can only view services from your own salons',
          });
        }
      }
      where.salonId = salonId;
    } else if (user && user.role === 'SALON_OWNER') {
      // For salon owners, automatically filter by their owned salons
      const userWithSalons = await prisma.user.findUnique({
        where: { id: user.id },
        include: { ownedSalons: true }
      });

      if (userWithSalons && userWithSalons.ownedSalons && userWithSalons.ownedSalons.length > 0) {
        // Filter services to only show from owned salons
        const ownedSalonIds = userWithSalons.ownedSalons.map(salon => salon.id);
        where.salonId = { in: ownedSalonIds };
        console.log('🏢 Filtering services for salon owner:', user.email, 'Salon IDs:', ownedSalonIds);
      } else {
        // Salon owner has no salons, return empty result
        return res.json({
          success: true,
          data: [],
          message: 'No salons found for this user',
        });
      }
    }
    // For other roles (ADMIN, CUSTOMER), show all services (existing behavior)

    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive === 'true';
    if (popular !== undefined) where.popular = popular === 'true';

    const services = await prisma.service.findMany({
      where,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            rating: true,
            featured: true,
            isOpen: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            emoji: true,
            color: true,
          }
        },
        subServices: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            priceCanVary: true,
            timeCanVary: true,
            images: true,
            isActive: true,
            displayId: true,
          }
        },
        _count: {
          select: {
            bookings: true,
          }
        }
      },
      orderBy: [
        { popular: 'desc' },
        { name: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: services,
      message: 'Services retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
    });
  }
});

// GET /api/v1/services/:id - Get service by ID (supports both UUID and displayId)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    const service = await prisma.service.findUnique({
      where: isDisplayId ? { displayId: parseInt(id) } : { id },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            rating: true,
            featured: true,
            isOpen: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            emoji: true,
            color: true,
            description: true,
          }
        },
        subServices: {
          select: {
            id: true,
            name: true,
            description: true,
            duration: true,
            price: true,
            priceCanVary: true,
            timeCanVary: true,
            images: true,
            isActive: true,
            displayId: true,
            createdAt: true,
            updatedAt: true,
          }
        },
        _count: {
          select: {
            bookings: true,
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.json({
      success: true,
      data: service,
      message: 'Service retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
    });
  }
});

// POST /api/v1/services - Create a new service
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const validatedData = createServiceSchema.parse(req.body);
    const user = req.user as any; // Get authenticated user

    // Get salon ID from authenticated user if not provided
    let salonId = validatedData.salonId;
    if (!salonId) {
      if (user.role === 'SALON_OWNER') {
        // Fetch user's owned salons from database
        const userWithSalons = await prisma.user.findUnique({
          where: { id: user.id },
          include: { ownedSalons: true }
        });

        if (userWithSalons && userWithSalons.ownedSalons && userWithSalons.ownedSalons.length > 0) {
          salonId = userWithSalons.ownedSalons[0].id; // Use first owned salon
          console.log('🏢 Using salon ID from authenticated user:', salonId);
        } else {
          return res.status(400).json({
            success: false,
            message: 'User does not own any salons. Please contact admin to create a salon first.',
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Salon ID is required or user must be a salon owner',
        });
      }
    }

    // Verify salon exists
    const salon = await prisma.salon.findUnique({
      where: { id: salonId }
    });

    if (!salon) {
      return res.status(400).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Verify category exists
    const category = await prisma.serviceCategory.findUnique({
      where: { id: validatedData.categoryId }
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Service category not found',
      });
    }

    // Set default emoji if not provided
    const emoji = validatedData.emoji || '✂️'; // Default salon service emoji

    const service = await prisma.service.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        duration: validatedData.duration,
        price: validatedData.price,
        priceCanVary: validatedData.priceCanVary || false,
        timeCanVary: validatedData.timeCanVary || false,
        popular: validatedData.popular || false,
        emoji: emoji,
        gender: validatedData.gender || 'UNISEX',
        salonId: salonId, // Use the resolved salon ID
        categoryId: validatedData.categoryId,
        isActive: validatedData.isActive !== undefined ? validatedData.isActive : true,
        images: [], // Will be updated after organizing temp images
      },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            displayId: true,
            rating: true,
            featured: true,
            isOpen: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            emoji: true,
            color: true,
          }
        }
      }
    });

    console.log('✅ Created service:', service.id, service.name, 'displayId:', service.displayId);

    // Organize temp images if any
    if (validatedData.images && validatedData.images.length > 0) {
      console.log('📁 Organizing images for service:', service.name, 'images:', validatedData.images);
      try {
        const organizedUrls = organizeImages(validatedData.images, service.salon, service);
        console.log('📁 Organized URLs:', organizedUrls);

        // Update service with organized image URLs
        const updatedService = await prisma.service.update({
          where: { id: service.id },
          data: { images: organizedUrls },
          include: {
            salon: {
              select: {
                id: true,
                name: true,
                displayId: true,
                rating: true,
                featured: true,
                isOpen: true,
              }
            },
            category: {
              select: {
                id: true,
                name: true,
                icon: true,
                emoji: true,
                color: true,
              }
            }
          }
        });
        console.log('✅ Updated service with organized images');

        res.status(201).json({
          success: true,
          data: updatedService,
          message: 'Service created successfully',
        });
      } catch (error) {
        console.error('❌ Error organizing service images:', error);
        // Return service without organized images if organization fails
        res.status(201).json({
          success: true,
          data: service,
          message: 'Service created successfully (image organization failed)',
        });
      }
    } else {
      console.log('⚠️ No images to organize for service:', service.name);
      res.status(201).json({
        success: true,
        data: service,
        message: 'Service created successfully',
      });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create service',
    });
  }
});

// PUT /api/v1/services/:id - Update service
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateServiceSchema.parse(req.body);

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Verify salon exists if salonId is being updated
    if (validatedData.salonId) {
      const salon = await prisma.salon.findUnique({
        where: { id: validatedData.salonId }
      });

      if (!salon) {
        return res.status(400).json({
          success: false,
          message: 'Salon not found',
        });
      }
    }

    // Verify category exists if categoryId is being updated
    if (validatedData.categoryId) {
      const category = await prisma.serviceCategory.findUnique({
        where: { id: validatedData.categoryId }
      });

      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Service category not found',
        });
      }
    }

    const updateData: any = {};
    if (validatedData.name !== undefined) updateData.name = validatedData.name;
    if (validatedData.description !== undefined) updateData.description = validatedData.description;
    if (validatedData.duration !== undefined) updateData.duration = validatedData.duration;
    if (validatedData.price !== undefined) updateData.price = validatedData.price;
    if (validatedData.priceCanVary !== undefined) updateData.priceCanVary = validatedData.priceCanVary;
    if (validatedData.timeCanVary !== undefined) updateData.timeCanVary = validatedData.timeCanVary;
    if (validatedData.popular !== undefined) updateData.popular = validatedData.popular;
    if (validatedData.emoji !== undefined) updateData.emoji = validatedData.emoji;
    if (validatedData.gender !== undefined) updateData.gender = validatedData.gender;
    if (validatedData.categoryId !== undefined) updateData.categoryId = validatedData.categoryId;
    if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
    if (validatedData.images !== undefined) updateData.images = validatedData.images;

    const service = await prisma.service.update({
      where: { id },
      data: updateData,
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            rating: true,
            featured: true,
            isOpen: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            emoji: true,
            color: true,
          }
        }
      }
    });

    res.json({
      success: true,
      data: service,
      message: 'Service updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update service',
    });
  }
});

// DELETE /api/v1/services/:id - Delete service
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if service exists
    const existingService = await prisma.service.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            bookings: true,
          }
        }
      }
    });

    if (!existingService) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    // Check if service has bookings
    if (existingService._count.bookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete service with existing bookings. Deactivate it instead.',
      });
    }

    await prisma.service.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
    });
  }
});

// GET /api/v1/services/category/:categorySlug/:serviceId - Get specific service by category and serviceId
router.get('/category/:categorySlug/:serviceId', async (req: Request, res: Response) => {
  try {
    const { categorySlug, serviceId } = req.params;

    // Check if serviceId is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(serviceId);

    // First, find the category by slug
    const category = await prisma.serviceCategory.findFirst({
      where: {
        OR: [
          { name: { equals: categorySlug, mode: 'insensitive' } },
          { name: { contains: categorySlug, mode: 'insensitive' } }
        ]
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Find the specific service
    const service = await prisma.service.findFirst({
      where: {
        AND: [
          isDisplayId ? { displayId: parseInt(serviceId) } : { id: serviceId },
          { categoryId: category.id },
          { isActive: true }
        ]
      },
      include: {
        salon: {
          select: {
            id: true,
            displayId: true,
            name: true,
            address: true,
            phone: true,
            email: true,
            rating: true,
            featured: true,
            isOpen: true,
            images: true,
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            icon: true,
            emoji: true,
            color: true,
            description: true,
          }
        },
        _count: {
          select: {
            bookings: true,
          }
        }
      }
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found in this category',
      });
    }

    // Transform service data
    const transformedService = {
      ...service,
      salon: {
        ...service.salon,
        image: service.salon.images?.[0] || null,
        distance: `${(Math.random() * 3 + 0.5).toFixed(1)} mi`,
      }
    };

    res.json({
      success: true,
      data: transformedService,
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        emoji: category.emoji,
        icon: category.icon,
      },
      message: 'Service retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching service by category and ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
    });
  }
});

// GET /api/v1/services/category/:categorySlug - Get services by category slug
router.get('/category/:categorySlug', async (req: Request, res: Response) => {
  try {
    const { categorySlug } = req.params;
    const { page = 1, limit = 20, search, minPrice, maxPrice, sortBy = 'popular' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // First, find the category by slug
    const category = await prisma.serviceCategory.findFirst({
      where: {
        OR: [
          { name: { equals: categorySlug, mode: 'insensitive' } },
          { name: { contains: categorySlug, mode: 'insensitive' } }
        ]
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Build where clause for services
    const where: any = {
      categoryId: category.id,
      isActive: true,
      salon: {
        isOpen: true
      }
    };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
        { salon: { name: { contains: search as string, mode: 'insensitive' } } }
      ];
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    // Build order by clause
    let orderBy: any = { popular: 'desc' }; // default
    switch (sortBy) {
      case 'price-low':
        orderBy = { price: 'asc' };
        break;
      case 'price-high':
        orderBy = { price: 'desc' };
        break;
      case 'rating':
        orderBy = { salon: { rating: 'desc' } };
        break;
      case 'duration':
        orderBy = { duration: 'asc' };
        break;
      case 'name':
        orderBy = { name: 'asc' };
        break;
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        include: {
          salon: {
            select: {
              id: true,
              displayId: true,
              name: true,
              address: true,
              rating: true,
              reviewCount: true,
              images: true,
              distance: true,
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              emoji: true,
              icon: true,
            }
          }
        },
        orderBy,
        skip,
        take: Number(limit),
      }),
      prisma.service.count({ where }),
    ]);

    // Transform services data
    const transformedServices = services.map(service => ({
      ...service,
      salon: {
        ...service.salon,
        image: service.salon.images?.[0] || null,
        distance: service.salon.distance || `${(Math.random() * 3 + 0.5).toFixed(1)} mi`,
      }
    }));

    res.json({
      success: true,
      data: transformedServices,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
      category: {
        id: category.id,
        name: category.name,
        description: category.description,
        emoji: category.emoji,
        icon: category.icon,
      },
      message: 'Services retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
    });
  }
});

export default router;
