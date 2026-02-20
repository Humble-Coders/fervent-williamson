import { Router } from 'express';
import { logger } from '@/config/logger';
import { validate } from '@/middleware/validation';
import { z } from 'zod';

const router = Router();

// Frontend log entry schema
const frontendLogSchema = z.object({
  timestamp: z.string(),
  level: z.string(),
  message: z.string(),
  metadata: z.any().optional(),
  url: z.string().optional(),
  userAgent: z.string().optional(),
});

/**
 * POST /api/v1/frontend-logs
 * Receive logs from frontend in production
 */
router.post('/', validate({ body: frontendLogSchema }), async (req, res) => {
  try {
    const { timestamp, level, message, metadata, url, userAgent } = req.body;

    // Log the frontend message with additional context
    const logMessage = `[FRONTEND] ${message}`;
    const logMetadata = {
      ...metadata,
      url,
      userAgent,
      originalTimestamp: timestamp,
      receivedAt: new Date().toISOString(),
    };

    // Use appropriate log level
    switch (level.toUpperCase()) {
      case 'ERROR':
        logger.error(logMessage, logMetadata);
        break;
      case 'WARN':
        logger.warn(logMessage, logMetadata);
        break;
      case 'INFO':
        logger.info(logMessage, logMetadata);
        break;
      case 'DEBUG':
        logger.debug(logMessage, logMetadata);
        break;
      default:
        logger.info(logMessage, logMetadata);
    }

    res.status(200).json({ success: true });
  } catch (error) {
    // Don't log errors about logging to avoid infinite loops
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process frontend log' 
    });
  }
});

export default router;
