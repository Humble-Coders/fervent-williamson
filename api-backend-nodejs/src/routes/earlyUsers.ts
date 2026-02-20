import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { AsyncAnalyticsService } from '../services/asyncAnalyticsService';
import { AnalyticsEventType } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Validation schema
const earlyUserSchema = z.object({
  contact: z.string().min(1, 'Contact is required'),
  type: z.enum(['email', 'phone']),
});

// POST /api/v1/early-users - Register early user
router.post('/', async (req: Request, res: Response) => {
  try {
    const validatedData = earlyUserSchema.parse(req.body);
    const { contact, type } = validatedData;

    // Check if user already exists
    const existingUser = await prisma.earlyUser.findFirst({
      where: type === 'email'
        ? { email: contact }
        : { phone: contact }
    });

    if (existingUser) {
      // Track returning user attempt
      try {
        await AsyncAnalyticsService.trackAction({
          sessionId: req.headers['x-session-id'] as string || `early_user_${Date.now()}`,
          page: '/coming-soon',
          action: 'early_user_duplicate_signup',
          metadata: {
            contactType: type,
            position: existingUser.position,
            isReturningUser: true,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
            referrer: req.headers.referer
          }
        });
      } catch (analyticsError) {
        console.error('Analytics tracking error:', analyticsError);
      }

      return res.json({
        success: true,
        message: 'You are already on the waitlist!',
        data: {
          position: existingUser.position,
          totalUsers: await prisma.earlyUser.count(),
          alreadyRegistered: true
        }
      });
    }

    // Create new early user
    const userData = type === 'email'
      ? { email: contact, type }
      : { phone: contact, type };

    const newUser = await prisma.earlyUser.create({
      data: userData,
    });

    // Get total count
    const totalUsers = await prisma.earlyUser.count();

    // Track conversion event
    try {
      await AsyncAnalyticsService.trackConversion({
        sessionId: req.headers['x-session-id'] as string || `early_user_${Date.now()}`,
        page: '/coming-soon',
        action: 'early_user_signup',
        metadata: {
          contactType: type,
          position: newUser.position,
          totalUsers,
          isNewUser: true,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip,
          referrer: req.headers.referer
        }
      });
    } catch (analyticsError) {
      console.error('Analytics tracking error:', analyticsError);
    }

    // Send confirmation email if email provided
    if (type === 'email') {
      try {
        // For now, just log the welcome email - can implement proper email service later
        console.log(`Welcome email would be sent to ${contact}: You're #${newUser.position} in line for early access!`);
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail the request if email fails
      }
    }

    res.json({
      success: true,
      message: 'Successfully joined the waitlist!',
      data: {
        position: newUser.position,
        totalUsers,
        alreadyRegistered: false
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.issues,
      });
    }

    console.error('Error creating early user:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to join waitlist',
    });
  }
});

// GET /api/v1/early-users/stats - Get waitlist stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalUsers = await prisma.earlyUser.count();
    const emailUsers = await prisma.earlyUser.count({
      where: { type: 'email' }
    });
    const phoneUsers = await prisma.earlyUser.count({
      where: { type: 'phone' }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        emailUsers,
        phoneUsers,
        recentSignups: await prisma.earlyUser.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
            }
          }
        })
      }
    });

  } catch (error) {
    console.error('Error getting early user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get stats',
    });
  }
});

// GET /api/v1/early-users/position/:contact - Get user position
router.get('/position/:contact', async (req: Request, res: Response) => {
  try {
    const { contact } = req.params;
    const { type } = req.query;

    if (!type || (type !== 'email' && type !== 'phone')) {
      return res.status(400).json({
        success: false,
        message: 'Type query parameter is required (email or phone)'
      });
    }

    const user = await prisma.earlyUser.findFirst({
      where: type === 'email'
        ? { email: contact }
        : { phone: contact }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found in waitlist'
      });
    }

    const totalUsers = await prisma.earlyUser.count();

    res.json({
      success: true,
      data: {
        position: user.position,
        totalUsers,
        joinedAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting user position:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get position',
    });
  }
});

// Helper function to generate welcome email HTML
function generateWelcomeEmail(position: number, email: string): string {
  const getBadgeInfo = (pos: number) => {
    if (pos <= 10) return { badge: '👑 VIP Early Bird', color: '#FFD700' };
    if (pos <= 50) return { badge: '🏆 Super Early', color: '#9333EA' };
    if (pos <= 100) return { badge: '⭐ Early Bird', color: '#3B82F6' };
    return { badge: '✨ Early Supporter', color: '#10B981' };
  };

  const { badge, color } = getBadgeInfo(position);

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to CutQ!</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #00C6A1; font-size: 2.5em; margin-bottom: 10px;">🎉 Welcome to CutQ!</h1>
        <div style="background: ${color}; color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-weight: bold; margin-bottom: 20px;">
          ${badge}
        </div>
      </div>
      
      <div style="background: linear-gradient(135deg, #f0fdfa, #f0fdf4); padding: 30px; border-radius: 15px; margin-bottom: 30px; text-align: center;">
        <h2 style="color: #1a1a1a; margin-bottom: 15px;">You're #${position} in line! 🚀</h2>
        <p style="font-size: 1.1em; color: #4a5568; margin-bottom: 20px;">
          Thank you for joining our exclusive early access waitlist. You're among the first to experience the future of beauty booking!
        </p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #00C6A1; margin-bottom: 15px;">🎁 Your Early Bird Rewards:</h3>
        <ul style="list-style: none; padding: 0;">
          <li style="padding: 8px 0; border-left: 4px solid #00C6A1; padding-left: 15px; margin-bottom: 10px;">
            🚀 Priority access to new features
          </li>
          <li style="padding: 8px 0; border-left: 4px solid #00C6A1; padding-left: 15px; margin-bottom: 10px;">
            💰 Exclusive early bird discounts
          </li>
          <li style="padding: 8px 0; border-left: 4px solid #00C6A1; padding-left: 15px; margin-bottom: 10px;">
            🎯 Special rewards and bonuses
          </li>
          <li style="padding: 8px 0; border-left: 4px solid #00C6A1; padding-left: 15px; margin-bottom: 10px;">
            📞 Direct line to our support team
          </li>
        </ul>
      </div>

      <div style="background: #f7fafc; padding: 25px; border-radius: 10px; margin-bottom: 30px; text-align: center;">
        <h3 style="color: #1a1a1a; margin-bottom: 15px;">📅 Launch Date: Monday, November 13th</h3>
        <p style="color: #4a5568; margin-bottom: 15px;">
          We're putting the finishing touches on CutQ to make sure you have the best beauty booking experience possible.
        </p>
        <p style="color: #4a5568; font-weight: bold;">
          We'll send you a notification as soon as we go live!
        </p>
      </div>

      <div style="text-align: center; margin-bottom: 30px;">
        <p style="color: #718096; font-size: 0.9em;">
          Questions? Reply to this email or contact us at support@cutq.com
        </p>
      </div>

      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #a0aec0; font-size: 0.8em;">
        <p>© 2024 CutQ. Making beauty accessible to everyone.</p>
        <p>You're receiving this because you signed up for early access with ${email}</p>
      </div>
    </body>
    </html>
  `;
}

// POST /api/v1/early-users/track - Track page visits and interactions
router.post('/track', async (req: Request, res: Response) => {
  try {
    const { eventType, action, sessionId, metadata } = req.body;

    // Validate required fields
    if (!eventType || !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'eventType and sessionId are required'
      });
    }

    // Track the event based on type
    switch (eventType) {
      case 'page_view':
        await AsyncAnalyticsService.trackPageView({
          sessionId,
          page: '/coming-soon',
          metadata: {
            ...metadata,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
            referrer: req.headers.referer
          }
        });
        break;

      case 'action':
        await AsyncAnalyticsService.trackAction({
          sessionId,
          page: '/coming-soon',
          action: action || 'unknown_action',
          metadata: {
            ...metadata,
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip,
            referrer: req.headers.referer
          }
        });
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid eventType. Use "page_view" or "action"'
        });
    }

    res.json({
      success: true,
      message: 'Event tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track event'
    });
  }
});

// GET /api/v1/early-users/analytics - Get coming soon page analytics
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { startDate, endDate } = req.query;

    // Default to last 30 days if no date range provided
    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Get analytics data from the database
    const [
      totalPageViews,
      uniqueVisitors,
      totalSignups,
      loveClicks
    ] = await Promise.all([
      // Total page views
      prisma.analyticsEvent.count({
        where: {
          page: '/coming-soon',
          eventType: AnalyticsEventType.PAGE_VIEW,
          createdAt: { gte: start, lte: end }
        }
      }),

      // Unique visitors (unique sessions)
      prisma.analyticsEvent.findMany({
        where: {
          page: '/coming-soon',
          eventType: AnalyticsEventType.PAGE_VIEW,
          createdAt: { gte: start, lte: end }
        },
        select: { sessionId: true },
        distinct: ['sessionId']
      }).then(results => results.length),

      // Total signups
      prisma.analyticsEvent.count({
        where: {
          page: '/coming-soon',
          action: 'early_user_signup',
          eventType: AnalyticsEventType.CONVERSION,
          createdAt: { gte: start, lte: end }
        }
      }),

      // Love button clicks
      prisma.analyticsEvent.count({
        where: {
          page: '/coming-soon',
          action: 'love_click',
          eventType: AnalyticsEventType.ACTION,
          createdAt: { gte: start, lte: end }
        }
      })
    ]);

    // Calculate conversion rate
    const conversionRate = uniqueVisitors > 0 ? (totalSignups / uniqueVisitors) * 100 : 0;

    res.json({
      success: true,
      data: {
        summary: {
          totalPageViews,
          uniqueVisitors,
          totalSignups,
          conversionRate: Math.round(conversionRate * 100) / 100,
          loveClicks
        },
        dateRange: {
          startDate: start,
          endDate: end
        }
      }
    });

  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get analytics data'
    });
  }
});

export default router;
