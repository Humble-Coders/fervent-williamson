import { Router } from 'express';
import { authenticateToken } from '@/middleware/simpleAuth';
import { requireAdmin, logAdminAction } from '@/middleware/adminAuth';
import { AdminController } from '@/controllers/AdminController';
import { AdminStatsController } from '@/controllers/AdminStatsController';
import bookingRoutes from './bookings';

const router = Router();

// Initialize controllers
const adminController = new AdminController();
const adminStatsController = new AdminStatsController();

// Apply authentication and admin authorization to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Debug middleware to log all admin route requests
router.use((req, res, next) => {
  console.log('🔥🔥🔥 ADMIN ROUTER MIDDLEWARE CALLED! 🔥🔥🔥');
  console.log('🔗 Request URL:', req.url);
  console.log('🔗 Request path:', req.path);
  console.log('🔗 Request originalUrl:', req.originalUrl);
  console.log('🔗 Request method:', req.method);
  next();
});

// Sub-routes
router.use('/bookings', bookingRoutes);

// User management routes
router.get('/users', 
  logAdminAction('GET_USERS'), 
  adminController.getUsers
);

router.get('/users/:id', 
  logAdminAction('GET_USER_DETAILS'), 
  adminController.getUserById
);

router.patch('/users/:id', 
  logAdminAction('UPDATE_USER'), 
  adminController.updateUser
);

router.delete('/users/:id', 
  logAdminAction('DELETE_USER'), 
  adminController.deleteUser
);

// Salon management routes
router.get('/salons', 
  logAdminAction('GET_SALONS'), 
  adminController.getSalons
);

router.patch('/salons/:id', 
  logAdminAction('UPDATE_SALON'), 
  adminController.updateSalon
);

router.delete('/salons/:id', 
  logAdminAction('DELETE_SALON'), 
  adminController.deleteSalon
);

// Statistics routes
router.get('/stats', 
  logAdminAction('GET_DASHBOARD_STATS'), 
  adminStatsController.getDashboardStats
);

router.get('/stats/users', 
  logAdminAction('GET_USER_STATS'), 
  adminStatsController.getUserStats
);

router.get('/stats/salons', 
  logAdminAction('GET_SALON_STATS'), 
  adminStatsController.getSalonStats
);

router.get('/stats/bookings', 
  logAdminAction('GET_BOOKING_STATS'), 
  adminStatsController.getBookingStats
);

export default router;
