import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/simpleAuth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Helper function to create organized folder structure
function createUploadPath(type: string, salonInfo?: { name: string; displayId: number }, entityInfo?: { name: string; displayId: number }) {
  let uploadPath = uploadsDir;

  if (type === 'salon' && salonInfo) {
    // uploads/salons/salon-name-displayId/
    const salonFolder = `${salonInfo.name.replace(/[^a-zA-Z0-9]/g, '-')}-${salonInfo.displayId}`;
    uploadPath = path.join(uploadsDir, 'salons', salonFolder);
  } else if (type === 'service' && salonInfo && entityInfo) {
    // uploads/salons/salon-name-displayId/services/service-name-displayId/
    const salonFolder = `${salonInfo.name.replace(/[^a-zA-Z0-9]/g, '-')}-${salonInfo.displayId}`;
    const serviceFolder = `${entityInfo.name.replace(/[^a-zA-Z0-9]/g, '-')}-${entityInfo.displayId}`;
    uploadPath = path.join(uploadsDir, 'salons', salonFolder, 'services', serviceFolder);
  } else if (type === 'stylist' && salonInfo && entityInfo) {
    // uploads/salons/salon-name-displayId/stylists/stylist-name-displayId/
    const salonFolder = `${salonInfo.name.replace(/[^a-zA-Z0-9]/g, '-')}-${salonInfo.displayId}`;
    const stylistFolder = `${entityInfo.name.replace(/[^a-zA-Z0-9]/g, '-')}-${entityInfo.displayId}`;
    uploadPath = path.join(uploadsDir, 'salons', salonFolder, 'stylists', stylistFolder);
  } else if (type === 'temp') {
    // uploads/temp/ for temporary uploads before entity creation
    uploadPath = path.join(uploadsDir, 'temp');
  }

  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }

  return uploadPath;
}

// Helper function to move files from temp to organized folder
function moveFilesToOrganizedFolder(tempPaths: string[], type: string, salonInfo: { name: string; displayId: number }, entityInfo: { name: string; displayId: number }): string[] {
  const targetPath = createUploadPath(type, salonInfo, entityInfo);
  const newUrls: string[] = [];

  tempPaths.forEach(tempUrl => {
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
        newUrls.push(`/uploads/${relativePath.replace(/\\/g, '/')}`);
      }
    } catch (error) {
      console.error('Error moving file:', error);
    }
  });

  return newUrls;
}

// Configure multer for file uploads with dynamic destination
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { type, salonId, entityId } = req.query;
      console.log('🔄 [BACKEND] Multer destination called with query:', { type, salonId, entityId });
      let uploadPath = uploadsDir; // Default fallback

      if (type === 'temp') {
        // For temporary uploads (new services/stylists before creation)
        uploadPath = createUploadPath('temp');
        console.log('📁 [BACKEND] Using temp upload path:', uploadPath);
      } else if (type && salonId) {
        // Fetch salon info
        const salon = await prisma.salon.findUnique({
          where: { id: salonId as string },
          select: { name: true, displayId: true }
        });

        console.log('🏢 [BACKEND] Salon lookup result:', salon);

        if (salon) {
          if (type === 'salon') {
            uploadPath = createUploadPath('salon', salon);
            console.log('📁 [BACKEND] Using salon upload path:', uploadPath);
          } else if (type === 'service' && entityId) {
            // Fetch service info
            const service = await prisma.service.findUnique({
              where: { id: entityId as string },
              select: { name: true, displayId: true }
            });
            console.log('🛍️ [BACKEND] Service lookup result:', service);
            if (service) {
              uploadPath = createUploadPath('service', salon, service);
              console.log('📁 [BACKEND] Using service upload path:', uploadPath);
            } else {
              // Service not found, use temp
              uploadPath = createUploadPath('temp');
              console.log('📁 [BACKEND] Service not found, using temp path:', uploadPath);
            }
          } else if (type === 'stylist' && entityId) {
            // Fetch stylist info
            const stylist = await prisma.stylist.findUnique({
              where: { id: entityId as string },
              select: { name: true, displayId: true }
            });
            console.log('💇 [BACKEND] Stylist lookup result:', stylist);
            if (stylist) {
              uploadPath = createUploadPath('stylist', salon, stylist);
              console.log('📁 [BACKEND] Using stylist upload path:', uploadPath);
            } else {
              // Stylist not found, use temp
              uploadPath = createUploadPath('temp');
              console.log('📁 [BACKEND] Stylist not found, using temp path:', uploadPath);
            }
          } else {
            // No entityId provided for service/stylist, use temp
            uploadPath = createUploadPath('temp');
            console.log('📁 [BACKEND] No entityId provided, using temp path:', uploadPath);
          }
        } else {
          uploadPath = createUploadPath('temp');
          console.log('📁 [BACKEND] Salon not found, using temp path:', uploadPath);
        }
      } else {
        uploadPath = createUploadPath('temp');
        console.log('📁 [BACKEND] Default case, using temp path:', uploadPath);
      }

      console.log('✅ [BACKEND] Final upload path determined:', uploadPath);
      cb(null, uploadPath);
    } catch (error) {
      console.error('❌ [BACKEND] Error determining upload path:', error);
      cb(null, createUploadPath('temp')); // Fallback to temp
    }
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext)
      .replace(/\s+/g, '_')  // Replace spaces with underscores
      .replace(/[^a-zA-Z0-9_-]/g, ''); // Remove special characters except underscore and dash
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// POST /api/v1/upload/images - Upload multiple images
// Query params: type (salon|service|stylist), salonId, entityId (for service/stylist)
router.post('/images', authenticateToken, upload.array('images', 10) as any, async (req: Request, res: Response) => {
  try {
    console.log('🔄 [BACKEND] /upload/images called with query:', req.query);
    console.log('🔄 [BACKEND] Files received:', req.files ? (req.files as any[]).map(f => ({
      filename: f.filename,
      path: f.path,
      size: f.size
    })) : 'No files');

    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      console.log('❌ [BACKEND] No files uploaded');
      return res.status(400).json({
        success: false,
        message: 'No images uploaded',
      });
    }

    const imageUrls = req.files.map(file => {
      // Get relative path from uploads directory
      const relativePath = path.relative(uploadsDir, file.path);
      const url = `/uploads/${relativePath.replace(/\\/g, '/')}`;
      console.log('📁 [BACKEND] File processed:', {
        originalPath: file.path,
        relativePath,
        finalUrl: url
      });
      return url;
    });

    console.log('✅ [BACKEND] Upload successful, returning URLs:', imageUrls);

    res.json({
      success: true,
      data: {
        images: imageUrls,
        count: imageUrls.length,
      },
      message: 'Images uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload images',
    });
  }
});

// POST /api/v1/upload/image - Upload single image
// Query params: type (salon|service|stylist), salonId, entityId (for service/stylist)
router.post('/image', authenticateToken, upload.single('image') as any, async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded',
      });
    }

    // Get relative path from uploads directory
    const relativePath = path.relative(uploadsDir, req.file.path);
    const imageUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

    res.json({
      success: true,
      data: {
        image: imageUrl,
      },
      message: 'Image uploaded successfully',
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
    });
  }
});

// POST /api/v1/upload/organize - Move temp files to organized folders
// Body: { type: 'service'|'stylist', salonId: string, entityId: string, tempUrls: string[] }
router.post('/organize', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { type, salonId, entityId, tempUrls } = req.body;

    if (!type || !salonId || !entityId || !tempUrls || !Array.isArray(tempUrls)) {
      return res.status(400).json({
        success: false,
        message: 'Missing required parameters: type, salonId, entityId, tempUrls',
      });
    }

    // Fetch salon info
    const salon = await prisma.salon.findUnique({
      where: { id: salonId },
      select: { name: true, displayId: true }
    });

    if (!salon) {
      return res.status(404).json({
        success: false,
        message: 'Salon not found',
      });
    }

    let entityInfo;
    if (type === 'service') {
      entityInfo = await prisma.service.findUnique({
        where: { id: entityId },
        select: { name: true, displayId: true }
      });
    } else if (type === 'stylist') {
      entityInfo = await prisma.stylist.findUnique({
        where: { id: entityId },
        select: { name: true, displayId: true }
      });
    }

    if (!entityInfo) {
      return res.status(404).json({
        success: false,
        message: `${type} not found`,
      });
    }

    // Move files from temp to organized folder
    const organizedUrls = moveFilesToOrganizedFolder(tempUrls, type, salon, entityInfo);

    res.json({
      success: true,
      data: {
        organizedUrls,
        count: organizedUrls.length,
      },
      message: 'Files organized successfully',
    });
  } catch (error) {
    console.error('Error organizing files:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to organize files',
    });
  }
});

// DELETE /api/v1/upload/image/:filename - Delete an image
router.delete('/image/:filename', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Image not found',
      });
    }

    // Delete the file
    fs.unlinkSync(filePath);

    res.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete image',
    });
  }
});

export default router;
