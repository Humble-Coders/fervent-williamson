import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '@/config/database';
import { catchAsync } from '@/middleware/errorHandler';
import { createResponse } from '@/utils/helpers';
import { logger } from '@/config/logger';
import { AuthenticatedRequest } from '@/types/auth';
import path from 'path';
import fs from 'fs';

// Helper function to organize temp images
function organizeImages(tempUrls: string[], type: 'service' | 'stylist', salon: any, entity: any): string[] {
  console.log('🔧 NEW FIXED organizeImages called with:', { tempUrls, type, salonName: salon.name, entityName: entity.name });

  const uploadsDir = path.join(process.cwd(), 'uploads');
  const organizedUrls: string[] = [];

  // Create organized folder path
  const salonFolder = `${salon.name.replace(/[^a-zA-Z0-9]/g, '-')}-${salon.displayId}`;
  const entityFolder = `${entity.name.replace(/[^a-zA-Z0-9]/g, '-')}-${entity.displayId}`;
  const targetPath = path.join(uploadsDir, 'salons', salonFolder, `${type}s`, entityFolder);

  console.log('📁 Target path:', targetPath);

  // Create directory if it doesn't exist
  if (!fs.existsSync(targetPath)) {
    console.log('📁 Creating directory:', targetPath);
    fs.mkdirSync(targetPath, { recursive: true });
  } else {
    console.log('📁 Directory already exists:', targetPath);
  }

  tempUrls.forEach((tempUrl, index) => {
    try {
      console.log(`📁 Processing image ${index + 1}/${tempUrls.length}:`, tempUrl);

      // Extract filename from temp URL and decode it properly
      let filename: string;
      if (tempUrl.startsWith('http')) {
        // Handle absolute URLs - extract just the filename part
        const urlObj = new URL(tempUrl);
        const pathname = urlObj.pathname; // e.g., "/uploads/temp/service%201-1755239555396-97408194.jpeg"
        const encodedFilename = pathname.split('/').pop() || ''; // e.g., "service%201-1755239555396-97408194.jpeg"
        filename = decodeURIComponent(encodedFilename); // e.g., "service 1-1755239555396-97408194.jpeg"
        console.log('📁 [ADMIN] URL pathname:', pathname);
        console.log('📁 [ADMIN] Encoded filename:', encodedFilename);
        console.log('📁 [ADMIN] Decoded filename:', filename);
      } else {
        // Handle relative URLs
        const urlPath = tempUrl.replace(/^.*\/uploads\//, '');
        const decodedPath = decodeURIComponent(urlPath);
        filename = path.basename(decodedPath);
        console.log('📁 [ADMIN] Relative URL processing - filename:', filename);
      }
      const tempFilePath = path.join(uploadsDir, 'temp', filename);
      const targetFilePath = path.join(targetPath, filename);

      console.log('📁 [ADMIN] Processing temp URL:', tempUrl);
      console.log('📁 [ADMIN] Final decoded filename:', filename);
      console.log('📁 [ADMIN] Temp file path:', tempFilePath);
      console.log('📁 [ADMIN] Target file path:', targetFilePath);
      console.log('📁 [ADMIN] Temp file exists:', fs.existsSync(tempFilePath));

      // List temp directory contents for debugging
      try {
        const tempFiles = fs.readdirSync(path.join(uploadsDir, 'temp'));
        console.log('📁 [ADMIN] Temp directory contents:', tempFiles);
        console.log('📁 [ADMIN] Looking for file:', filename);
        console.log('📁 [ADMIN] File found in temp dir:', tempFiles.includes(filename));
      } catch (e) {
        console.log('📁 [ADMIN] Could not read temp directory:', e);
      }

      // Move file if it exists
      if (fs.existsSync(tempFilePath)) {
        fs.renameSync(tempFilePath, targetFilePath);
        // Create new URL with organized path
        const relativePath = path.relative(uploadsDir, targetFilePath);
        organizedUrls.push(`/uploads/${relativePath.replace(/\\/g, '/')}`);
        console.log('✅ Successfully moved file to:', targetFilePath);
      } else {
        // If file doesn't exist in temp, it might already be organized
        console.log('❌ File not found in temp, keeping original URL:', tempUrl);
        organizedUrls.push(tempUrl);
      }
    } catch (error) {
      console.error('❌ Error moving file:', error);
      // Keep original URL if move fails
      organizedUrls.push(tempUrl);
    }
  });

  console.log('📁 Final organized URLs:', organizedUrls);
  return organizedUrls;
}

// Validation schemas
const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  role: z.enum(['ADMIN', 'SALON_OWNER', 'CUSTOMER']).optional(),
  isActive: z.boolean().optional(),
});

const updateSalonSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  specialties: z.array(z.string()).optional(),
  amenities: z.array(z.string()).optional(),
  images: z.array(z.string()).optional(),
  workingHours: z.record(z.string(), z.any()).optional(),
  featured: z.boolean().optional(),
  isOpen: z.boolean().optional(),
  mapsLink: z.string().optional(),
  services: z.array(z.object({
    name: z.string(),
    description: z.string(),
    duration: z.number(),
    price: z.number(),
    category: z.string(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional(),
    isActive: z.boolean(),
    images: z.array(z.string()).optional(),
    id: z.string().optional(), // For temporary IDs from frontend
  })).optional(),
  stylists: z.array(z.object({
    name: z.string(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    avatar: z.preprocess((val) => val === null ? undefined : val, z.string().optional()),
    specialties: z.array(z.string()).optional(),
    experience: z.number().optional(),
    isActive: z.boolean().optional(),
    services: z.array(z.string()).optional(),
  })).optional(),
});

export class AdminController {
  /**
   * Get all users with pagination and filtering
   */
  getUsers = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
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

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          isActive: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              bookings: true,
              reviews: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    logger.info('Admin fetched users', { 
      adminId: req.user.id, 
      page, 
      limit, 
      total 
    });

    return res.json(createResponse(true, {
      users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    }, 'Users retrieved successfully'));
  });

  /**
   * Get user by ID
   */
  getUserById = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        bookings: {
          include: {
            salon: { select: { name: true } },
            service: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        reviews: {
          include: {
            salon: { select: { name: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            bookings: true,
            reviews: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json(createResponse(false, null, 'User not found'));
    }

    logger.info('Admin fetched user details', { 
      adminId: req.user.id, 
      targetUserId: id 
    });

    return res.json(createResponse(true, user, 'User details retrieved successfully'));
  });

  /**
   * Update user
   */
  updateUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json(createResponse(false, null, 'User not found'));
    }

    // Check if email is already taken by another user
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });

      if (emailExists) {
        return res.status(400).json(createResponse(false, null, 'Email already exists'));
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
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info('Admin updated user', { 
      adminId: req.user.id, 
      targetUserId: id,
      changes: validatedData 
    });

    return res.json(createResponse(true, updatedUser, 'User updated successfully'));
  });

  /**
   * Delete user
   */
  deleteUser = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return res.status(404).json(createResponse(false, null, 'User not found'));
    }

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json(createResponse(false, null, 'Cannot delete your own account'));
    }

    // Soft delete by deactivating the user
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    logger.warn('Admin deleted user', { 
      adminId: req.user.id, 
      targetUserId: id,
      targetUserEmail: user.email 
    });

    return res.json(createResponse(true, null, 'User deleted successfully'));
  });

  /**
   * Get all salons with pagination and filtering
   */
  getSalons = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { page = 1, limit = 10, search, status, featured } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { address: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'all') {
      where.isOpen = status === 'open';
    }

    if (featured && featured !== 'all') {
      where.featured = featured === 'true';
    }

    const [salons, total] = await Promise.all([
      prisma.salon.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' },
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
              services: true,
            },
          },
        },
      }),
      prisma.salon.count({ where }),
    ]);

    const totalPages = Math.ceil(total / Number(limit));

    logger.info('Admin fetched salons', { 
      adminId: req.user.id, 
      page, 
      limit, 
      total 
    });

    return res.json(createResponse(true, {
      salons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
      },
    }, 'Salons retrieved successfully'));
  });

  /**
   * Update salon
   */
  updateSalon = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    logger.error('🚀🚀🚀 ADMIN CONTROLLER UPDATE SALON METHOD CALLED! 🚀🚀🚀');
    logger.error('🔗 Request URL:', req.url);
    logger.error('🔗 Request path:', req.path);
    logger.error('🔗 Request originalUrl:', req.originalUrl);
    logger.error('🆔 Salon ID:', id);
    logger.error('🧪 Raw request body:', JSON.stringify(req.body, null, 2));
    logger.error('🧪 Request body keys:', Object.keys(req.body));
    logger.error('🧪 Stylists field exists:', 'stylists' in req.body);
    logger.error('🧪 Stylists field value:', req.body.stylists);

    // Preprocess the request body to handle null avatar values
    const preprocessedBody = { ...req.body };
    if (preprocessedBody.stylists && Array.isArray(preprocessedBody.stylists)) {
      preprocessedBody.stylists = preprocessedBody.stylists.map((stylist: any) => {
        const processedStylist = { ...stylist };
        // Remove avatar field if it's null
        if (processedStylist.avatar === null) {
          delete processedStylist.avatar;
        }
        return processedStylist;
      });
    }

    const validatedData = updateSalonSchema.parse(preprocessedBody);

    logger.error('🧪 VALIDATION COMPLETED');
    logger.error('🧪 Validated data keys:', Object.keys(validatedData));
    console.error('🧪 Validated stylists field exists:', 'stylists' in validatedData);
    console.error('🧪 Validated stylists field value:', validatedData.stylists);

    // Check if id is a number (displayId) or UUID
    const isDisplayId = /^\d+$/.test(id);

    // Check if salon exists
    const existingSalon = await prisma.salon.findUnique({
      where: isDisplayId ? { displayId: parseInt(id) } : { id },
    });

    if (!existingSalon) {
      return res.status(404).json(createResponse(false, null, 'Salon not found'));
    }

    // Extract services and stylists from validated data for special handling
    const { services, stylists, ...salonData } = validatedData;

    // Update salon basic data first
    await prisma.salon.update({
      where: { id: existingSalon.id },
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
        console.log('🔧 Processing services:', services.length);
        await Promise.all(
          services.map(async (service: any) => {
            console.log('🔧 Creating service:', service.name, 'with images:', service.images);

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
                gender: service.gender,
                isActive: service.isActive,
                images: [], // Will be updated after organizing temp images
                salonId: existingSalon.id,
                categoryId: category.id,
              }
            });

            console.log('✅ Created service:', newService.id, newService.name, 'displayId:', newService.displayId);

            // Organize temp images if any
            if (service.images && service.images.length > 0) {
              console.log('🔄 [BACKEND] AdminController - Organizing images for service:', {
                serviceName: service.name,
                serviceId: newService.id,
                imageCount: service.images.length,
                images: service.images
              });
              try {
                const organizedUrls = organizeImages(service.images, 'service', existingSalon, newService);
                console.log('✅ [BACKEND] AdminController - Organized URLs:', organizedUrls);

                // Update service with organized image URLs
                await prisma.service.update({
                  where: { id: newService.id },
                  data: { images: organizedUrls }
                });
                console.log('✅ [BACKEND] AdminController - Updated service with organized images');
              } catch (error) {
                console.error('❌ [BACKEND] AdminController - Error organizing service images:', error);
              }
            } else {
              console.log('⚠️ [BACKEND] AdminController - No images to organize for service:', service.name);
            }
          })
        );
      }
    }

    // Handle stylists update if provided
    if (stylists !== undefined) {
      console.log('🧪 Processing stylists update:', stylists);

      // Delete existing stylists
      await prisma.stylist.deleteMany({
        where: { salonId: existingSalon.id }
      });

      // Create new stylists
      if (stylists.length > 0) {
        console.log(`🧪 Creating ${stylists.length} stylists...`);

        const createdStylists = await Promise.all(
          stylists.map(async (stylistMember: any) => {
            console.log('🧪 Creating stylist:', stylistMember);

            const newStylist = await prisma.stylist.create({
              data: {
                name: stylistMember.name,
                email: stylistMember.email || `${stylistMember.name.toLowerCase().replace(' ', '.')}@salon.com`,
                phone: stylistMember.phone || '0000000000',
                avatar: null, // Will be updated after organizing temp avatar
                specialties: stylistMember.specialties || [],
                experience: stylistMember.experience || 0,
                isActive: stylistMember.isActive !== false,
                salonId: existingSalon.id,
                services: stylistMember.services || [],
              }
            });

            // Organize temp avatar if provided
            if (stylistMember.avatar) {
              try {
                const organizedUrls = organizeImages([stylistMember.avatar], 'stylist', existingSalon, newStylist);
                if (organizedUrls.length > 0) {
                  // Update stylist with organized avatar URL
                  await prisma.stylist.update({
                    where: { id: newStylist.id },
                    data: { avatar: organizedUrls[0] }
                  });
                  newStylist.avatar = organizedUrls[0]; // Update local object
                }
              } catch (error) {
                console.error('Error organizing stylist avatar:', error);
              }
            }

            console.log('✅ Created stylist:', newStylist.id, newStylist.name);
            return newStylist;
          })
        );

        console.log(`✅ Successfully created ${createdStylists.length} stylists`);
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
        _count: {
          select: {
            bookings: true,
            reviews: true,
            services: true,
          },
        },
      },
    });

    logger.error('🔥🔥🔥 JUST BEFORE LOGGER.INFO STATEMENT! 🔥🔥🔥');
    logger.info('🚀🚀🚀 MODIFIED ADMIN UPDATED SALON LOG! 🚀🚀🚀', {
      adminId: req.user.id,
      salonId: id,
      changes: Object.keys(validatedData)
    });

    return res.json(createResponse(true, finalSalon, 'Salon updated successfully'));
  });

  /**
   * Delete salon
   */
  deleteSalon = catchAsync(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Check if salon exists
    const salon = await prisma.salon.findUnique({
      where: { id },
    });

    if (!salon) {
      return res.status(404).json(createResponse(false, null, 'Business not found'));
    }

    // Check for active bookings
    const activeBookings = await prisma.booking.count({
      where: {
        salonId: id,
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json(createResponse(
        false, 
        null, 
        'Cannot delete business with active bookings'
      ));
    }

    await prisma.salon.delete({
      where: { id },
    });

    logger.warn('Admin deleted salon', { 
      adminId: req.user.id, 
      salonId: id,
      salonName: salon.name 
    });

    return res.json(createResponse(true, null, 'Salon deleted successfully'));
  });
}
