import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';
import { authenticateToken } from '../middleware/simpleAuth';
import { env } from '../config/env';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Helper function to organize temp images for salon
function organizeSalonImages(tempUrls: string[], salon: any): string[] {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const organizedUrls: string[] = [];

  // Create organized folder path
  const salonFolder = `${salon.name.replace(/[^a-zA-Z0-9]/g, '-')}-${salon.displayId}`;
  const targetPath = path.join(uploadsDir, 'salons', salonFolder);

  // Create directory if it doesn't exist
  if (!fs.existsSync(targetPath)) {
    fs.mkdirSync(targetPath, { recursive: true });
  }

  tempUrls.forEach(tempUrl => {
    try {
      // Extract filename from temp URL and decode it (FIXED!)
      const urlPath = tempUrl.replace(/^.*\/uploads\//, '');
      const decodedPath = decodeURIComponent(urlPath);
      const filename = path.basename(decodedPath);
      const tempFilePath = path.join(uploadsDir, 'temp', filename);
      const targetFilePath = path.join(targetPath, filename);

      console.log('🔧 SALON: Processing temp URL:', tempUrl);
      console.log('🔧 SALON: Decoded filename:', filename);
      console.log('🔧 SALON: Temp file exists:', fs.existsSync(tempFilePath));

      // Move file if it exists
      if (fs.existsSync(tempFilePath)) {
        fs.renameSync(tempFilePath, targetFilePath);
        // Create new URL with organized path
        const relativePath = path.relative(uploadsDir, targetFilePath);
        organizedUrls.push(`/uploads/${relativePath.replace(/\\/g, '/')}`);
        console.log('✅ SALON: Successfully moved file to:', targetFilePath);
      } else {
        // If file doesn't exist in temp, it might already be organized
        console.log('❌ SALON: File not found in temp, keeping original URL:', tempUrl);
        organizedUrls.push(tempUrl);
      }
    } catch (error) {
      console.error('❌ SALON: Error moving salon image file:', error);
      // Keep original URL if move fails
      organizedUrls.push(tempUrl);
    }
  });

  return organizedUrls;
}

// Helper function to organize temp images for services/stylists
function organizeImages(tempUrls: string[], type: 'service' | 'stylist', salon: any, entity: any): string[] {
  console.log('🔄 [BACKEND] organizeImages called with:', {
    tempUrls,
    type,
    salonName: salon.name,
    salonDisplayId: salon.displayId,
    entityName: entity.name,
    entityDisplayId: entity.displayId
  });

  const uploadsDir = path.join(process.cwd(), 'uploads');
  const organizedUrls: string[] = [];

  // Create organized folder path
  const salonFolder = `${salon.name.replace(/[^a-zA-Z0-9]/g, '-')}-${salon.displayId}`;
  const entityFolder = `${entity.name.replace(/[^a-zA-Z0-9]/g, '-')}-${entity.displayId}`;
  const targetPath = path.join(uploadsDir, 'salons', salonFolder, `${type}s`, entityFolder);

  console.log('📁 [BACKEND] Target path calculated:', targetPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(targetPath)) {
    console.log('📁 [BACKEND] Creating directory:', targetPath);
    fs.mkdirSync(targetPath, { recursive: true });
  } else {
    console.log('📁 [BACKEND] Directory already exists:', targetPath);
  }

  tempUrls.forEach(tempUrl => {
    try {
      console.log('🔄 [BACKEND] Processing temp URL:', tempUrl);

      // Extract filename from temp URL and decode it properly
      let filename: string;
      if (tempUrl.startsWith('http')) {
        // Handle absolute URLs - extract just the filename part
        const urlObj = new URL(tempUrl);
        const pathname = urlObj.pathname; // e.g., "/uploads/temp/service%201-1755239555396-97408194.jpeg"
        const encodedFilename = pathname.split('/').pop() || ''; // e.g., "service%201-1755239555396-97408194.jpeg"
        filename = decodeURIComponent(encodedFilename); // e.g., "service 1-1755239555396-97408194.jpeg"
        console.log('📁 [BACKEND] URL pathname:', pathname);
        console.log('📁 [BACKEND] Encoded filename:', encodedFilename);
        console.log('📁 [BACKEND] Decoded filename:', filename);
      } else {
        // Handle relative URLs
        const urlPath = tempUrl.replace(/^.*\/uploads\//, '');
        const decodedPath = decodeURIComponent(urlPath);
        filename = path.basename(decodedPath);
        console.log('📁 [BACKEND] Relative URL processing - filename:', filename);
      }
      const tempFilePath = path.join(uploadsDir, 'temp', filename);
      const targetFilePath = path.join(targetPath, filename);

      console.log('📁 [BACKEND] Final filename:', filename);
      console.log('📁 [BACKEND] Temp file path:', tempFilePath);
      console.log('📁 [BACKEND] Target file path:', targetFilePath);
      console.log('📁 [BACKEND] Temp file exists:', fs.existsSync(tempFilePath));

      // List temp directory contents for debugging
      try {
        const tempFiles = fs.readdirSync(path.join(uploadsDir, 'temp'));
        console.log('📁 [BACKEND] Temp directory contents:', tempFiles);
      } catch (e) {
        console.log('📁 [BACKEND] Could not read temp directory:', e);
      }

      // Move file if it exists
      if (fs.existsSync(tempFilePath)) {
        console.log('✅ [BACKEND] Moving file from temp to organized folder...');
        fs.renameSync(tempFilePath, targetFilePath);
        // Create new URL with organized path
        const relativePath = path.relative(uploadsDir, targetFilePath);
        const finalUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;
        organizedUrls.push(finalUrl);
        console.log('✅ [BACKEND] Successfully moved file to:', targetFilePath);
        console.log('✅ [BACKEND] Final URL:', finalUrl);
      } else {
        // If file doesn't exist in temp, it might already be organized
        console.log('❌ [BACKEND] File not found in temp, keeping original URL:', tempUrl);
        organizedUrls.push(tempUrl);
      }
    } catch (error) {
      console.error('❌ [BACKEND] Error moving file:', error);
      // Keep original URL if move fails
      organizedUrls.push(tempUrl);
    }
  });

  return organizedUrls;
}

// Validation schemas
const serviceSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Service name is required'),
  description: z.string().min(1, 'Service description is required'),
  duration: z.number().min(15, 'Duration must be at least 15 minutes'),
  price: z.number().min(0, 'Price must be non-negative'),
  category: z.string().min(1, 'Category is required'),
  gender: z.enum(['MALE', 'FEMALE', 'UNISEX']).default('UNISEX'),
  isActive: z.boolean().default(true),
  images: z.array(z.string()).default([]),
});

const stylistSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Stylist name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().min(1, 'Phone number is required'),
  avatar: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
  specialties: z.array(z.string()).default([]),
  services: z.array(z.string()).default([]),
  experience: z.number().min(0, 'Experience must be non-negative'),
  isActive: z.boolean().default(true),
  images: z.array(z.string()).default([]),
});

const createSalonSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  description: z.string().min(1, 'Description is required'),
  address: z.string().min(1, 'Address is required'),
  phone: z.string().min(1, 'Phone number is required'),
  email: z.string().email('Valid email is required'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  mapsLink: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  certifications: z.array(z.string()).default([]),
  images: z.array(z.string()).default([]),
  yearsInBusiness: z.number().min(0).default(1),
  rating: z.number().min(0).max(5).default(4.5),
  workingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }).optional(),
    friday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string(), isOpen: z.boolean() }).optional(),
  }).default({}),
  slotDuration: z.number().optional(),
  breakDuration: z.number().optional(),
  advanceBookingDays: z.number().optional(),
  minimumNoticeHours: z.number().optional(), // Accepts decimals
  bufferTime: z.number().optional(),
  maxBookingsPerDay: z.number().optional().nullable(),
  allowSameDayBooking: z.boolean().optional(),
  enabledPaymentMethods: z.array(z.string()).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  reminderHours: z.number().optional(),
  ownerId: z.string().optional(),
  featured: z.boolean().default(false),
  isOpen: z.boolean().default(true),
  services: z.array(serviceSchema).optional(),
  stylists: z.array(stylistSchema).optional(),
});

const updateSalonSchema = createSalonSchema.partial();

// Helper function to create a default salon owner user
async function createSalonOwnerUser(email: string, salonName: string) {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      // If user exists but is not a salon owner, update their role
      if (existingUser.role !== 'SALON_OWNER') {
        const updatedUser = await prisma.user.update({
          where: { id: existingUser.id },
          data: { role: 'SALON_OWNER' }
        });
        return updatedUser;
      }
      return existingUser;
    }

    // Create new salon owner user
    const hashedPassword = await bcrypt.hash(env.DEFAULT_SALON_OWNER_PASSWORD, 12);

    const newUser = await prisma.user.create({
      data: {
        name: `${salonName} Owner`,
        email: email,
        password: hashedPassword,
        role: 'SALON_OWNER',
        emailVerified: true, // Auto-verify salon owner accounts
      }
    });

    return newUser;
  } catch (error) {
    console.error('Error creating salon owner user:', error);
    throw error;
  }
}

// GET /api/v1/salons - Get all salons
router.get('/', async (req: Request, res: Response) => {
  try {
    const salons = await prisma.salon.findMany({
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json({
      success: true,
      data: salons,
    });
  } catch (error) {
    console.error('Error fetching salons:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch salons',
    });
  }
});

// GET /api/v1/salons/by-name/:salonName/:id - Get salon by name and displayId (SEO-friendly)
router.get('/by-name/:salonName/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    const salon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(id) } : { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          where: {
            isActive: true, // Only show active services to customers
          },
        },
        stylists: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    res.json({
      success: true,
      data: salon,
    });
  } catch (error) {
    console.error('Error fetching salon by name:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business',
    });
  }
});

// GET /api/v1/salons/:id - Get salon by ID (supports both UUID and displayId)
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    const salon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(id) } : { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          where: {
            isActive: true, // Only show active services to customers
          },
        },
        stylists: true,
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    res.json({
      success: true,
      data: salon,
    });
  } catch (error) {
    console.error('Error fetching salon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch business',
    });
  }
});

// GET /api/v1/salons/:id/complete - Get salon with all images and complete data
router.get('/:id/complete', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    const salon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(id) } : { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: {
          where: {
            isActive: true, // Only show active services to customers
          },
          include: {
            category: true,
            subServices: {
              where: {
                isActive: true, // Only show active sub-services to customers
              },
            },
          },
        },
        stylists: true,
      },
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Business not found',
      });
    }

    // Convert relative image URLs to absolute URLs
    const backendBaseUrl = process.env.BACKEND_URL || 'http://localhost:3002';

    const salonWithAbsoluteUrls = {
      ...salon,
      images: salon.images?.map(url => url.startsWith('http') ? url : `${backendBaseUrl}${url}`) || [],
      services: salon.services.map(service => ({
        ...service,
        images: service.images?.map(url => url.startsWith('http') ? url : `${backendBaseUrl}${url}`) || [],
        subServices: service.subServices?.map(subService => ({
          ...subService,
          images: subService.images?.map(url => url.startsWith('http') ? url : `${backendBaseUrl}${url}`) || []
        })) || []
      })),
      stylists: salon.stylists.map(stylist => ({
        ...stylist,
        images: stylist.images?.map(url => url.startsWith('http') ? url : `${backendBaseUrl}${url}`) || [],
        avatar: stylist.avatar && !stylist.avatar.startsWith('http') ? `${backendBaseUrl}${stylist.avatar}` : stylist.avatar
      }))
    };

    res.json({
      success: true,
      data: salonWithAbsoluteUrls,
      message: 'Business with complete data retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching complete salon data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch complete business data',
    });
  }
});

// POST /api/v1/salons - Create new salon (Admin only)
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // Check if user is admin
    if ((req.user as any)?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can create businesses',
      });
    }

    const validatedData = createSalonSchema.parse(req.body);

    let ownerId = validatedData.ownerId;

    // If ownerId is provided, verify the user exists and is a salon owner
    if (ownerId) {
      const owner = await prisma.user.findUnique({
        where: { id: ownerId },
      });

      if (!owner) {
        return res.status(400).json({
          success: false,
          message: 'Owner user not found',
        });
      }

      if (owner.role !== 'SALON_OWNER') {
        return res.status(400).json({
          success: false,
          message: 'Owner must have SALON_OWNER role',
        });
      }
    } else {
      // Create a default salon owner user using the salon's email
      try {
        const salonOwner = await createSalonOwnerUser(validatedData.email, validatedData.name);
        ownerId = salonOwner.id;
      } catch (error) {
        console.error('Failed to create salon owner user:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create salon owner user',
        });
      }
    }

    // Extract services and stylists from validated data
    const { services, stylists, ...salonData } = validatedData;

    // Create salon first
    const salon = await prisma.salon.create({
      data: {
        ...salonData,
        ownerId: ownerId, // Use the determined ownerId
        workingHours: salonData.workingHours as any, // Prisma Json type
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Organize salon images from temp to proper folder
    if (salonData.images && salonData.images.length > 0) {
      try {
        const organizedUrls = organizeSalonImages(salonData.images, salon);
        // Update salon with organized image URLs
        await prisma.salon.update({
          where: { id: salon.id },
          data: { images: organizedUrls }
        });
      } catch (error) {
        console.error('Error organizing salon images:', error);
      }
    }

    // Create services if provided
    if (services && services.length > 0) {
      await Promise.all(
        services.map(async (service) => {
          // Find or create service category
          let category = await prisma.serviceCategory.findFirst({
            where: { name: service.category }
          });

          if (!category) {
            category = await prisma.serviceCategory.create({
              data: {
                name: service.category,
                icon: '✂️', // Default icon
                color: '#6366f1', // Default color
                emoji: '✂️', // Default emoji
              }
            });
          }

          // Create service
          const newService = await prisma.service.create({
            data: {
              name: service.name,
              description: service.description,
              duration: service.duration,
              price: service.price,
              emoji: category.emoji || '✂️',
              isActive: service.isActive,
              salonId: salon.id,
              categoryId: category.id,
            }
          });

          // Organize service images if any
          if (service.images && service.images.length > 0) {
            console.log('🔄 [BACKEND] Organizing images for service during salon creation:', {
              serviceName: service.name,
              serviceId: newService.id,
              imageCount: service.images.length,
              images: service.images
            });
            try {
              const organizedUrls = organizeImages(service.images, 'service', salon, newService);
              console.log('✅ [BACKEND] Images organized, updating service with URLs:', organizedUrls);
              // Update service with organized image URLs
              await prisma.service.update({
                where: { id: newService.id },
                data: { images: organizedUrls }
              });
              console.log('✅ [BACKEND] Service updated with organized images');
            } catch (error) {
              console.error('❌ [BACKEND] Error organizing service images:', error);
            }
          } else {
            console.log('⚠️ [BACKEND] No images to organize for service:', service.name);
          }
        })
      );
    }

    // Create stylists if provided
    if (stylists && stylists.length > 0) {
      await Promise.all(
        stylists.map(async (stylistMember) => {
          const newStylist = await prisma.stylist.create({
            data: {
              name: stylistMember.name,
              email: stylistMember.email,
              phone: stylistMember.phone,
              specialties: stylistMember.specialties,
              experience: stylistMember.experience,
              isActive: stylistMember.isActive,
              salonId: salon.id,
              // Store services as JSON for now
              services: stylistMember.services as any,
            }
          });

          // Organize stylist images if any
          if (stylistMember.images && stylistMember.images.length > 0) {
            try {
              const organizedUrls = organizeImages(stylistMember.images, 'stylist', salon, newStylist);
              // Update stylist with organized image URLs
              await prisma.stylist.update({
                where: { id: newStylist.id },
                data: { images: organizedUrls }
              });
            } catch (error) {
              console.error('Error organizing stylist images:', error);
            }
          }
        })
      );
    }

    // Get the created salon owner details for the response
    const salonOwner = await prisma.user.findUnique({
      where: { id: ownerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      }
    });

    res.status(201).json({
      success: true,
      data: {
        salon,
        salonOwner: salonOwner,
        ownerCredentials: validatedData.ownerId ? null : {
          email: validatedData.email,
          password: env.DEFAULT_SALON_OWNER_PASSWORD,
          message: 'Default salon owner account created. Please share these credentials with the salon owner.'
        }
      },
      message: 'Salon created successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating salon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create salon',
    });
  }
});

// PUT /api/v1/salons/:id - Update salon (Admin or Owner) - Also handles partial updates
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    // Use partial validation to allow partial updates
    const validatedData = updateSalonSchema.parse(req.body);

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    // Check if salon exists
    const existingSalon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(id) } : { id },
    });

    if (!existingSalon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Check permissions: Admin can edit any salon, salon owner can edit their own
    if ((req.user as any)?.role !== 'ADMIN' && existingSalon.ownerId !== (req.user as any)?.userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own salon',
      });
    }

    // Extract services and stylists from validated data
    const { services, stylists, ...salonData } = validatedData;

    // Update salon basic data
    const updatedSalon = await prisma.salon.update({
      where: { id: existingSalon.id },
      data: {
        ...salonData,
        workingHours: salonData.workingHours as any,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update services if provided
    if (services !== undefined) {
      // Delete existing services
      await prisma.service.deleteMany({
        where: { salonId: existingSalon.id }
      });

      // Create new services
      if (services.length > 0) {
        await Promise.all(
          services.map(async (service) => {
            // Find or create service category
            let category = await prisma.serviceCategory.findFirst({
              where: { name: service.category }
            });

            if (!category) {
              category = await prisma.serviceCategory.create({
                data: {
                  name: service.category,
                  icon: '✂️',
                  color: '#6366f1',
                  emoji: '✂️',
                }
              });
            }

            // Create service
            const newService = await prisma.service.create({
              data: {
                name: service.name,
                description: service.description,
                duration: service.duration,
                price: service.price,
                emoji: category.emoji || '✂️',
                isActive: service.isActive,
                images: [], // Will be updated after organizing temp images
                salonId: existingSalon.id,
                categoryId: category.id,
              }
            });

            // Organize service images if any
            if (service.images && service.images.length > 0) {
              try {
                const organizedUrls = organizeImages(service.images, 'service', existingSalon, newService);
                // Update service with organized image URLs
                await prisma.service.update({
                  where: { id: newService.id },
                  data: { images: organizedUrls }
                });
              } catch (error) {
                console.error('Error organizing service images:', error);
              }
            }
          })
        );
      }
    }

    // Update stylists if provided
    if (stylists !== undefined) {
      // Delete existing stylists
      await prisma.stylist.deleteMany({
        where: { salonId: existingSalon.id }
      });

      // Create new stylists
      if (stylists.length > 0) {
        await Promise.all(
          stylists.map(async (stylistMember) => {
            await prisma.stylist.create({
              data: {
                name: stylistMember.name,
                email: stylistMember.email,
                phone: stylistMember.phone,
                specialties: stylistMember.specialties,
                experience: stylistMember.experience,
                isActive: stylistMember.isActive,
                salonId: existingSalon.id,
                services: stylistMember.services as any,
              }
            });
          })
        );
      }
    }

    res.json({
      success: true,
      data: updatedSalon,
      message: 'Salon updated successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error updating salon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update salon',
    });
  }
});

// PATCH /api/v1/salons/:id - Partially update salon (Admin or Owner)
router.patch('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    console.error('🏪🏪🏪 SALON ROUTE PATCH METHOD CALLED! 🏪🏪🏪');
    console.error('🔗 Request URL:', req.url);
    console.error('🔗 Request path:', req.path);
    console.error('🔗 Request originalUrl:', req.originalUrl);
    const { id } = req.params;
    console.error('🆔 Salon ID from params:', id);

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    // Check if salon exists
    const existingSalon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(id) } : { id },
    });

    if (!existingSalon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    // Check permissions: Admin can edit any salon, salon owner can edit their own
    console.error('🔐 Permission check:', {
      userRole: (req.user as any)?.role,
      userId: (req.user as any)?.id,
      salonOwnerId: existingSalon.ownerId,
      isAdmin: (req.user as any)?.role === 'ADMIN',
      isOwner: existingSalon.ownerId === (req.user as any)?.id
    });

    if ((req.user as any)?.role !== 'ADMIN' && existingSalon.ownerId !== (req.user as any)?.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit your own salon',
      });
    }

    // Extract services and stylists from request body for special handling
    const { services, stylists, startTime, endTime, ...salonData } = req.body;

    // Update salon basic data first
    await prisma.salon.update({
      where: isDisplayId ? { displayId: parseInt(id) } : { id },
      data: {
        ...salonData,
        workingHours: salonData.workingHours ? salonData.workingHours as any : undefined,
      },
    });

    // Handle services update if provided
    if (services !== undefined) {
      // Delete existing services
      await prisma.service.deleteMany({
        where: { salonId: existingSalon.id }
      });

      // Create new services
      if (services.length > 0) {
        await Promise.all(
          services.map(async (service: any) => {
            // Find or create service category
            let category = await prisma.serviceCategory.findFirst({
              where: { name: service.category }
            });

            if (!category) {
              category = await prisma.serviceCategory.create({
                data: {
                  name: service.category,
                  icon: '✂️',
                  color: '#6366f1',
                  emoji: '✂️',
                }
              });
            }

            // Create service
            const newService = await prisma.service.create({
              data: {
                name: service.name,
                description: service.description,
                duration: service.duration,
                price: service.price,
                emoji: category.emoji || '✂️',
                isActive: service.isActive,
                images: [], // Will be updated after organizing temp images
                salonId: existingSalon.id,
                categoryId: category.id,
              }
            });

            // Organize service images if any
            if (service.images && service.images.length > 0) {
              try {
                const organizedUrls = organizeImages(service.images, 'service', existingSalon, newService);
                // Update service with organized image URLs
                await prisma.service.update({
                  where: { id: newService.id },
                  data: { images: organizedUrls }
                });
              } catch (error) {
                console.error('Error organizing service images:', error);
              }
            }
          })
        );
      }
    }

    // Handle stylists update if provided
    if (stylists !== undefined) {
      // Delete existing stylists
      await prisma.stylist.deleteMany({
        where: { salonId: existingSalon.id }
      });

      // Create new stylists
      if (stylists.length > 0) {
        await Promise.all(
          stylists.map(async (stylistMember: any) => {
            await prisma.stylist.create({
              data: {
                name: stylistMember.name,
                email: stylistMember.email,
                phone: stylistMember.phone,
                specialties: stylistMember.specialties,
                experience: stylistMember.experience,
                isActive: stylistMember.isActive,
                salonId: existingSalon.id,
                services: stylistMember.services as any,
              }
            });
          })
        );
      }
    }

    // Get the final updated salon with all relations
    const finalSalon = await prisma.salon.findUnique({
      where: { id: existingSalon.id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        services: true,
        stylists: true,
      },
    });

    res.json({
      success: true,
      data: finalSalon,
      message: 'Salon updated successfully',
    });
  } catch (error) {
    console.error('Error updating salon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update salon',
    });
  }
});

// DELETE /api/v1/salons/:id - Delete salon (Admin only)
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    if ((req.user as any)?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can delete salons',
      });
    }

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    // Check if salon exists
    const existingSalon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(id) } : { id },
    });

    if (!existingSalon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    await prisma.salon.delete({
      where: { id: existingSalon.id },
    });

    res.json({
      success: true,
      message: 'Salon deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting salon:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete salon',
    });
  }
});

export default router;
