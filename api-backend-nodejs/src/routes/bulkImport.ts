/**
 * Bulk Import Routes
 * Handles CSV/Excel file uploads for bulk creation of services and stylists
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { authenticateToken } from '../middleware/simpleAuth';
import { BulkImportJobs } from '../queues/jobs/BulkImportJobs';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create bulk imports directory
const bulkImportsDir = path.join(process.cwd(), 'uploads', 'bulk-imports');
if (!fs.existsSync(bulkImportsDir)) {
  fs.mkdirSync(bulkImportsDir, { recursive: true });
}

// Configure multer for CSV/Excel uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, bulkImportsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `bulk-import-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    console.log('📁 File upload attempt:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });

    // Check file extension (primary validation)
    const allowedExtensions = /\.(csv|xlsx|xls)$/i;
    const hasValidExtension = allowedExtensions.test(file.originalname);

    // Check MIME type (secondary validation - more permissive)
    const allowedMimeTypes = [
      'text/csv',
      'text/plain', // Some systems send CSV as text/plain
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/octet-stream' // Some browsers send this for CSV
    ];
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype);

    console.log('📁 File validation:', {
      hasValidExtension,
      hasValidMimeType,
      extension: path.extname(file.originalname).toLowerCase()
    });

    if (hasValidExtension) {
      console.log('✅ File accepted based on extension');
      return cb(null, true);
    } else {
      console.log('❌ File rejected - invalid extension');
      cb(new Error('Only CSV and Excel files are allowed (.csv, .xlsx, .xls)'));
    }
  }
});

// POST /api/v1/bulk-import/services - Upload CSV/Excel for bulk service creation
router.post('/services', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user is salon owner
    if (user.role !== 'SALON_OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Salon owner role required.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Get salon ID from user
    const salon = await prisma.salon.findFirst({
      where: { ownerId: user.id },
      select: { id: true, name: true, displayId: true }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found for this user',
      });
    }

    // Determine file type
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const fileType = fileExt === '.csv' ? 'csv' : 'xlsx';

    // Generate job ID
    const jobId = uuidv4();

    // Add job to queue
    const job = await BulkImportJobs.addBulkImportJob({
      filePath: req.file.path,
      fileType,
      importType: 'services',
      salonId: salon.id,
      salonDisplayId: salon.displayId,
      userId: user.id,
      jobId,
      originalFilename: req.file.originalname
    });

    console.log(`📊 Bulk import services job queued: ${jobId}`);

    res.json({
      success: true,
      data: {
        jobId,
        bullJobId: job.id,
        message: 'Bulk import started. Use the jobId to check progress.',
        estimatedTime: '2-5 minutes depending on file size'
      },
      message: 'Bulk import job started successfully',
    });

  } catch (error) {
    console.error('Error starting bulk import services:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start bulk import',
    });
  }
});

// POST /api/v1/bulk-import/stylists - Upload CSV/Excel for bulk stylist creation
router.post('/stylists', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    
    // Check if user is salon owner
    if (user.role !== 'SALON_OWNER') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Salon owner role required.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Get salon ID from user
    const salon = await prisma.salon.findFirst({
      where: { ownerId: user.id },
      select: { id: true, name: true, displayId: true }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found for this user',
      });
    }

    // Determine file type
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const fileType = fileExt === '.csv' ? 'csv' : 'xlsx';

    // Generate job ID
    const jobId = uuidv4();

    // Add job to queue
    const job = await BulkImportJobs.addBulkImportJob({
      filePath: req.file.path,
      fileType,
      importType: 'stylists',
      salonId: salon.id,
      salonDisplayId: salon.displayId,
      userId: user.id,
      jobId,
      originalFilename: req.file.originalname
    });

    console.log(`📊 Bulk import stylists job queued: ${jobId}`);

    res.json({
      success: true,
      data: {
        jobId,
        bullJobId: job.id,
        message: 'Bulk import started. Use the jobId to check progress.',
        estimatedTime: '2-5 minutes depending on file size'
      },
      message: 'Bulk import job started successfully',
    });

  } catch (error) {
    console.error('Error starting bulk import stylists:', error);
    
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start bulk import',
    });
  }
});

// POST /api/v1/bulk-import/service-categories - Upload CSV/Excel for bulk service category creation
router.post('/service-categories', authenticateToken, upload.single('file'), async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    // Check if user is salon owner or admin
    if (user.role !== 'SALON_OWNER' && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Salon owner or admin role required.',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Get salon ID from user (if salon owner)
    let salon = null;
    if (user.role === 'SALON_OWNER') {
      salon = await prisma.salon.findFirst({
        where: { ownerId: user.id },
        select: { id: true, name: true, displayId: true }
      });

      if (!salon) {
        return res.status(404).json({
          success: false,
          message: 'Salon not found for this user',
        });
      }
    }

    // Determine file type
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const fileType = fileExt === '.csv' ? 'csv' : 'xlsx';

    // Generate job ID
    const jobId = uuidv4();

    // Add job to queue
    const job = await BulkImportJobs.addBulkImportJob({
      filePath: req.file.path,
      fileType,
      importType: 'service-categories',
      salonId: salon?.id || null,
      salonDisplayId: salon?.displayId || null,
      userId: user.id,
      jobId,
      originalFilename: req.file.originalname
    });

    console.log(`📊 Bulk import service categories job queued: ${jobId}`);

    res.json({
      success: true,
      data: {
        jobId,
        bullJobId: job.id,
        message: 'Bulk import started. Use the jobId to check progress.',
        estimatedTime: '1-3 minutes depending on file size'
      },
      message: 'Bulk import job started successfully',
    });

  } catch (error) {
    console.error('Error starting bulk import service categories:', error);

    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to start bulk import',
    });
  }
});

// GET /api/v1/bulk-import/progress/:jobId - Check import progress
router.get('/progress/:jobId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const user = (req as any).user;

    // Get progress from job processor
    const progress = BulkImportJobs.getImportProgress(jobId);

    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Import job not found',
      });
    }

    // Calculate estimated time remaining
    let estimatedTimeRemaining;
    if (progress.status === 'processing' && progress.processedRows > 0) {
      const elapsed = progress.startedAt ? Date.now() - progress.startedAt.getTime() : 0;
      const avgTimePerRow = elapsed / progress.processedRows;
      const remainingRows = progress.totalRows - progress.processedRows;
      estimatedTimeRemaining = Math.round((avgTimePerRow * remainingRows) / 1000); // in seconds
    }

    res.json({
      success: true,
      data: {
        ...progress,
        estimatedTimeRemaining,
        progressPercentage: progress.totalRows > 0 
          ? Math.round((progress.processedRows / progress.totalRows) * 100) 
          : 0
      },
      message: 'Import progress retrieved successfully',
    });

  } catch (error) {
    console.error('Error getting import progress:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get import progress',
    });
  }
});

// GET /api/v1/bulk-import/template/services - Download services CSV template
router.get('/template/services', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    console.log('📋 Template download request from user:', user);

    // Check if user is salon owner (temporarily allow all authenticated users for testing)
    if (user.role !== 'SALON_OWNER' && user.role !== 'CUSTOMER' && user.role !== 'ADMIN') {
      console.log('❌ Access denied - user role:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Please log in to download templates.',
      });
    }

    // Log user info for debugging
    console.log('✅ User authorized - role:', user.role, 'id:', user.id);

    // Get template type from query params
    const templateType = (req.query.type as 'name' | 'displayId') || 'name';
    console.log('✅ Template type:', templateType);

    console.log('✅ Generating services template...');
    const csvTemplate = BulkImportJobs.generateServicesTemplate(templateType);

    console.log('📄 Template generated, length:', csvTemplate.length);

    const filename = templateType === 'displayId'
      ? 'services-import-template-displayid.csv'
      : 'services-import-template.csv';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvTemplate);

  } catch (error) {
    console.error('❌ Error generating services template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
    });
  }
});

// GET /api/v1/bulk-import/template/stylists - Download stylists CSV template
router.get('/template/stylists', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    console.log('📋 Stylists template download request from user:', user);

    // Check if user is salon owner (temporarily allow all authenticated users for testing)
    if (user.role !== 'SALON_OWNER' && user.role !== 'CUSTOMER' && user.role !== 'ADMIN') {
      console.log('❌ Access denied - user role:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Please log in to download templates.',
      });
    }

    // Log user info for debugging
    console.log('✅ User authorized - role:', user.role, 'id:', user.id);

    // Get template type from query params
    const templateType = (req.query.type as 'name' | 'displayId') || 'name';
    console.log('✅ Template type:', templateType);

    console.log('✅ Generating stylists template...');
    const csvTemplate = BulkImportJobs.generateStylistsTemplate(templateType);

    console.log('📄 Stylists template generated, length:', csvTemplate.length);

    const filename = templateType === 'displayId'
      ? 'stylists-import-template-displayid.csv'
      : 'stylists-import-template.csv';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvTemplate);

  } catch (error) {
    console.error('❌ Error generating stylists template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
    });
  }
});

// GET /api/v1/bulk-import/template/service-categories-import - Download service categories import template CSV
router.get('/template/service-categories-import', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    console.log('📋 Service categories import template download request from user:', user);

    // Check if user is salon owner or admin
    if (user.role !== 'SALON_OWNER' && user.role !== 'ADMIN') {
      console.log('❌ Access denied - user role:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Salon owner or admin role required.',
      });
    }

    console.log('✅ User authorized - role:', user.role, 'id:', user.id);

    console.log('✅ Generating service categories import template...');
    const csvTemplate = BulkImportJobs.generateServiceCategoriesTemplate();

    console.log('📄 Service categories import template generated, length:', csvTemplate.length);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="service-categories-import-template.csv"');
    res.send(csvTemplate);

  } catch (error) {
    console.error('❌ Error generating service categories import template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
    });
  }
});

// GET /api/v1/bulk-import/template/service-categories - Download service categories reference CSV
router.get('/template/service-categories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    console.log('📋 Service categories reference download request from user:', user);

    // Check if user is salon owner (temporarily allow all authenticated users for testing)
    if (user.role !== 'SALON_OWNER' && user.role !== 'CUSTOMER' && user.role !== 'ADMIN') {
      console.log('❌ Access denied - user role:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Please log in to download templates.',
      });
    }

    // Log user info for debugging
    console.log('✅ User authorized - role:', user.role, 'id:', user.id);

    // Get salon display ID if user is salon owner
    let salonDisplayId: number | undefined;
    if (user.role === 'SALON_OWNER') {
      const userWithSalon = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
          ownedSalons: {
            select: { displayId: true }
          }
        }
      });

      if (userWithSalon?.ownedSalons?.[0]) {
        salonDisplayId = userWithSalon.ownedSalons[0].displayId;
      }
    }

    console.log('✅ Generating service categories reference...');
    const csvTemplate = await BulkImportJobs.generateServiceCategoriesReference(salonDisplayId);

    console.log('📄 Service categories reference generated, length:', csvTemplate.length);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="service-categories-reference.csv"');
    res.send(csvTemplate);

  } catch (error) {
    console.error('❌ Error generating service categories reference:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate service categories reference',
    });
  }
});

// DELETE /api/v1/bulk-import/cleanup/:jobId - Clean up import progress data
router.delete('/cleanup/:jobId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    
    BulkImportJobs.clearImportProgress(jobId);
    
    res.json({
      success: true,
      message: 'Import progress data cleaned up successfully',
    });

  } catch (error) {
    console.error('Error cleaning up import data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clean up import data',
    });
  }
});

// TEST ENDPOINTS - Remove in production
// GET /api/v1/bulk-import/test/template/services - Test template generation without auth
router.get('/test/template/services', async (req: Request, res: Response) => {
  try {
    console.log('🧪 Test template generation...');
    const csvTemplate = BulkImportJobs.generateServicesTemplate();

    console.log('📄 Test template generated, length:', csvTemplate.length);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="test-services-template.csv"');
    res.send(csvTemplate);

  } catch (error) {
    console.error('❌ Error generating test template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test template',
    });
  }
});

// GET /api/v1/bulk-import/test/template/stylists - Test stylists template without auth
router.get('/test/template/stylists', async (req: Request, res: Response) => {
  try {
    const templateType = (req.query.type as 'name' | 'displayId') || 'name';
    console.log('🧪 Test stylists template generation, type:', templateType);
    const csvTemplate = BulkImportJobs.generateStylistsTemplate(templateType);

    console.log('📄 Test stylists template generated, length:', csvTemplate.length);

    const filename = templateType === 'displayId'
      ? 'test-stylists-template-displayid.csv'
      : 'test-stylists-template.csv';

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvTemplate);

  } catch (error) {
    console.error('❌ Error generating test stylists template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate test stylists template',
    });
  }
});

// GET /api/v1/bulk-import/export/services - Export salon services for reference
router.get('/export/services', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    console.log('📋 Services export request from user:', user);

    // Check if user is salon owner
    if (user.role !== 'SALON_OWNER') {
      console.log('❌ Access denied - user role:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Salon owner role required.',
      });
    }

    // Get salon ID from user
    const salon = await prisma.salon.findFirst({
      where: { ownerId: user.id },
      select: { id: true, name: true, displayId: true }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found for this user',
      });
    }

    console.log('✅ User authorized - role:', user.role, 'salon:', salon.name);

    // Get all services for this salon
    const services = await prisma.service.findMany({
      where: { salonId: salon.id },
      select: {
        displayId: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        isActive: true,
        category: {
          select: {
            name: true
          }
        }
      },
      orderBy: { displayId: 'asc' }
    });

    console.log(`📄 Found ${services.length} services for salon: ${salon.name}`);

    // Generate CSV
    const headers = ['Display ID', 'Service Name', 'Category', 'Price', 'Duration (min)', 'Active', 'Description'];
    const data = services.map(service => [
      service.displayId.toString(),
      service.name,
      service.category.name,
      service.price.toString(),
      service.duration.toString(),
      service.isActive ? 'Yes' : 'No',
      service.description
    ]);

    // Helper function to escape CSV fields
    const escapeCSVField = (field: any): string => {
      // Convert to string first
      const fieldStr = String(field || '');
      if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    };

    const csvContent = [headers, ...data]
      .map(row => row.map(escapeCSVField).join(','))
      .join('\n');

    const filename = `${salon.name.replace(/[^a-zA-Z0-9]/g, '_')}_services_export.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('❌ Error exporting services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export services',
    });
  }
});

// GET /api/v1/bulk-import/export/services-and-subservices - Export salon services and sub-services combined for reference
router.get('/export/services-and-subservices', authenticateToken, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;

    console.log('📋 Services and sub-services export request from user:', user);

    // Check if user is salon owner
    if (user.role !== 'SALON_OWNER') {
      console.log('❌ Access denied - user role:', user.role);
      return res.status(403).json({
        success: false,
        message: 'Access denied. Salon owner role required.',
      });
    }

    // Get salon ID from user
    const salon = await prisma.salon.findFirst({
      where: { ownerId: user.id },
      select: { id: true, name: true, displayId: true }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found for this user',
      });
    }

    console.log('✅ User authorized - role:', user.role, 'salon:', salon.name);

    // Get all services with their sub-services for this salon
    const services = await prisma.service.findMany({
      where: { salonId: salon.id },
      select: {
        displayId: true,
        name: true,
        description: true,
        price: true,
        duration: true,
        isActive: true,
        category: {
          select: {
            name: true
          }
        },
        subServices: {
          select: {
            displayId: true,
            name: true,
            description: true,
            price: true,
            duration: true,
            isActive: true
          },
          orderBy: { displayId: 'asc' }
        }
      },
      orderBy: { displayId: 'asc' }
    });

    console.log(`📄 Found ${services.length} services for salon: ${salon.name}`);

    // Generate CSV with services and sub-services (service info repeated for each sub-service)
    const headers = ['Service Display ID', 'Service Name', 'Category', 'Sub-Service Display ID', 'Sub-Service Name', 'Sub-Service Price', 'Sub-Service Duration (min)', 'Sub-Service Active', 'Sub-Service Description'];
    const data: string[][] = [];

    services.forEach(service => {
      if (service.subServices.length > 0) {
        // Add one row for each sub-service (with service info repeated)
        service.subServices.forEach(subService => {
          data.push([
            service.displayId.toString(),
            service.name,
            service.category.name,
            subService.displayId.toString(),
            subService.name,
            subService.price.toString(),
            subService.duration.toString(),
            subService.isActive ? 'Yes' : 'No',
            subService.description
          ]);
        });
      } else {
        // If service has no sub-services, add one row with empty sub-service columns
        data.push([
          service.displayId.toString(),
          service.name,
          service.category.name,
          '', // No sub-service display ID
          '', // No sub-service name
          service.price.toString(), // Use service price
          service.duration.toString(), // Use service duration
          service.isActive ? 'Yes' : 'No', // Use service active status
          service.description // Use service description
        ]);
      }
    });

    console.log(`📄 Generated ${data.length} rows (services + sub-services) for salon: ${salon.name}`);

    // Helper function to escape CSV fields
    const escapeCSVField = (field: any): string => {
      // Convert to string first
      const fieldStr = String(field || '');
      if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
        return `"${fieldStr.replace(/"/g, '""')}"`;
      }
      return fieldStr;
    };

    const csvContent = [headers, ...data]
      .map(row => row.map(escapeCSVField).join(','))
      .join('\n');

    const filename = `${salon.name.replace(/[^a-zA-Z0-9]/g, '_')}_services_and_subservices_reference.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);

  } catch (error) {
    console.error('❌ Error exporting services and sub-services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export services and sub-services',
    });
  }
});

export default router;
