import { Router } from 'express';
import { AdminSignupController } from '../controllers/AdminSignupController';

const router = Router();

// Initialize controller
const adminSignupController = new AdminSignupController();

// Admin signup routes (no authentication required for initial setup)
router.get('/available', adminSignupController.checkSignupAvailable);
router.post('/create', adminSignupController.createAdmin);

// Password Reset Routes
import { AdminPasswordResetController } from '../controllers/AdminPasswordResetController';
const adminPasswordResetController = new AdminPasswordResetController();

router.post('/verify-setup-password', adminPasswordResetController.verifySetupPassword);
router.post('/reset-password', adminPasswordResetController.resetPassword);

export default router;
