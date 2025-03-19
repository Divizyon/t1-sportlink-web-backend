import express from 'express';
import * as AuthController from '../controllers/AuthController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/reset-password', AuthController.resetPassword);

// Protected routes
router.use(protect);
router.get('/me', AuthController.getCurrentUser);
router.post('/logout', AuthController.logout);

export default router; 