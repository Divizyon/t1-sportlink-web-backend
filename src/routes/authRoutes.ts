import express from 'express';
import * as AuthController from '../controllers/AuthController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.get('/google', AuthController.googleAuthRedirect);
router.get('/session/refresh', AuthController.refreshSession);
router.post('/forgot-password', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);
router.post('/resend-verification', AuthController.resendVerificationEmail);

// Protected routes
router.get('/me', protect, AuthController.getCurrentUser);
router.post('/logout', protect, AuthController.logout);

export default router; 