import express, { Application, Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import path from 'path';
import session from 'express-session';
import passport from './config/passport';
import { setupSecurity, sanitizeRequest } from './middleware/security';
import { globalErrorHandler, AppError } from './middleware/errorHandler';
import { requestLogger } from './config/logger';
import { isDevelopment, env } from './config/env';
import { initializeFirebase } from './config/firebase';
import { prisma } from './config/database';
import { AnalyticsService } from './services/analyticsService';
import { createAnalyticsMiddleware } from './middleware/analyticsMiddleware';

// Import routes
import simpleAuthRoutes from './routes/simple-auth';
import otpAuthRoutes from './routes/otpAuth';
import socialAuthRoutes from './routes/socialAuth';
import salonsRoutes from './routes/salons';
import uploadRoutes from './routes/upload';
import categoriesRoutes from './routes/categories';
import salonCategoriesRoutes from './routes/salonCategories';
import salonStylistsRoutes from './routes/salonStylists';
import salonDashboardRoutes from './routes/salonDashboard';
import reviewsRoutes from './routes/reviews';
import bookingsRoutes from './routes/bookings';
import servicesRoutes from './routes/services';
import subservicesRoutes from './routes/subservices';
import offersRoutes from './routes/offers';
import paymentMethodsRoutes from './routes/paymentMethods';
import bookingConfigRoutes from './routes/bookingConfig';
import systemConfigRoutes from './routes/systemConfig';
import salonRequestsRoutes from './routes/salonRequests';
import favoritesRoutes from './routes/favorites';
import adminRoutes from './routes/admin/index';
import adminSignupRoutes from './routes/adminSignup';
import docsRoutes from '@/routes/docs';
import { createAnalyticsRoutes } from './routes/analyticsRoutes';
import analyticsConfigRoutes from './routes/analyticsConfig';
import bulkImportRoutes from './routes/bulkImport';
import earlyUsersRoutes from './routes/earlyUsers';
import paymentsRoutes from './routes/payments';
import frontendLogsRoutes from './routes/frontendLogs';

class App {
  public app: Application;
  private analyticsService: AnalyticsService;
  private analyticsMiddleware: any;

  constructor() {
    this.app = express();
    this.initializeAnalytics();
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeAnalytics(): void {
    // Initialize analytics service
    this.analyticsService = new AnalyticsService(prisma);

    // Initialize analytics middleware
    this.analyticsMiddleware = createAnalyticsMiddleware(this.analyticsService, {
      excludedRoutes: [
        '/health',
        '/metrics',
        '/favicon.ico',
        '/robots.txt',
        '/sitemap.xml',
        '/api/v1/analytics',
        '/uploads'
      ]
    });
  }

  private initializeMiddlewares(): void {
    // Security middlewares
    this.app.use(setupSecurity());

    // Request parsing middlewares
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Session middleware (required for Passport)
    this.app.use(session({
      secret: env.SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: !isDevelopment, // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      },
    }) as any);

    // Passport middleware
    this.app.use(passport.initialize() as any);
    this.app.use(passport.session());

    // Request ID middleware - for tracing requests across logs
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const requestId = req.headers['x-request-id'] as string ||
        `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      req.headers['x-request-id'] = requestId;
      res.setHeader('X-Request-ID', requestId);
      next();
    });

    // Logging middleware
    if (isDevelopment) {
      this.app.use(morgan('dev'));
    }
    this.app.use(requestLogger);

    // Request sanitization
    this.app.use(sanitizeRequest);

    // Disable caching for API routes in development
    if (isDevelopment) {
      this.app.use('/api', (req: Request, res: Response, next: NextFunction) => {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
        // Disable ETag generation to prevent 304 responses
        res.removeHeader('ETag');
        res.set('ETag', '');
        next();
      });
    }

    // Analytics middleware (track page views and user behavior)
    this.app.use(this.analyticsMiddleware.trackPageView());

    // Static file serving for uploaded images with CORS headers
    this.app.use('/uploads', (req: Request, res: Response, next: NextFunction) => {
      // Set CORS headers for image requests
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Cross-Origin-Resource-Policy', 'cross-origin');
      res.header('Cross-Origin-Embedder-Policy', 'unsafe-none');

      // Remove CSP for image requests
      res.removeHeader('Content-Security-Policy');

      next();
    }, express.static(path.join(process.cwd(), 'uploads'), {
      setHeaders: (res: Response) => {
        res.header('Cross-Origin-Resource-Policy', 'cross-origin');
        res.removeHeader('Content-Security-Policy');
      }
    }));

    // Trust proxy (for accurate IP addresses behind reverse proxy)
    this.app.set('trust proxy', 1);

    // Disable ETag generation in development to prevent 304 responses
    if (isDevelopment) {
      this.app.set('etag', false);
    }
  }

  private initializeRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
      });
    });

    // API routes
    this.app.use('/api/v1', this.createApiRouter());

    // 404 handler for undefined routes
    this.app.all('*', (req: Request, res: Response, next: NextFunction) => {
      next(new AppError(`Route ${req.originalUrl} not found`, 404));
    });
  }

  private createApiRouter(): express.Router {
    const router = express.Router();

    // Welcome endpoint
    router.get('/', (req: Request, res: Response) => {
      res.status(200).json({
        success: true,
        message: 'Welcome to Salon Management API',
        version: '1.0.0',
        documentation: '/api/v1/docs',
      });
    });

    // Test endpoint
    router.get('/test', (req, res) => {
      res.status(200).json({
        success: true,
        message: 'API is working!',
        timestamp: new Date().toISOString(),
      });
    });

    // Mount route modules here
    // IMPORTANT: Admin routes must be registered BEFORE salon routes
    // to prevent route conflicts (admin/salons vs salons)

    // Debug middleware to log all requests
    router.use((req, res, next) => {
      console.error('🌍🌍🌍 MAIN ROUTER REQUEST! 🌍🌍🌍');
      console.error('🔗 Request URL:', req.url);
      console.error('🔗 Request path:', req.path);
      console.error('🔗 Request originalUrl:', req.originalUrl);
      console.error('🔗 Request method:', req.method);
      next();
    });

    router.use('/admin/signup', adminSignupRoutes);
    router.use('/admin', adminRoutes);

    router.use('/auth', simpleAuthRoutes);
    router.use('/auth', otpAuthRoutes);
    router.use('/auth', socialAuthRoutes);
    router.use('/salons', salonsRoutes);
    router.use('/upload', uploadRoutes);
    router.use('/categories', categoriesRoutes);
    router.use('/salon/categories', salonCategoriesRoutes);
    router.use('/salon/stylists', salonStylistsRoutes);
    router.use('/salon/dashboard', salonDashboardRoutes);
    router.use('/reviews', reviewsRoutes);
    router.use('/bookings', bookingsRoutes);
    router.use('/services', servicesRoutes);
    router.use('/subservices', subservicesRoutes);
    router.use('/offers', offersRoutes);
    router.use('/payment-methods', paymentMethodsRoutes);
    router.use('/booking-config', bookingConfigRoutes);
    router.use('/system-config', systemConfigRoutes);
    router.use('/salon-requests', salonRequestsRoutes);
    router.use('/favorites', favoritesRoutes);
    router.use('/analytics', createAnalyticsRoutes(this.analyticsService));
    router.use('/analytics-config', analyticsConfigRoutes);
    router.use('/bulk-import', bulkImportRoutes);
    router.use('/early-users', earlyUsersRoutes);
    router.use('/payments', paymentsRoutes);
    router.use('/frontend-logs', frontendLogsRoutes);
    router.use('/docs', docsRoutes);

    return router;
  }

  private initializeErrorHandling(): void {
    // Analytics error tracking middleware
    this.app.use(this.analyticsMiddleware.trackError());

    // Global error handler (must be last)
    this.app.use(globalErrorHandler);
  }

  public getApp(): Application {
    return this.app;
  }
}

export default App;
