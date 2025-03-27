import express from 'express';
import * as UserController from '../controllers/UserController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// Protect all routes
router.use(protect);

// Admin only routes
router.get('/', restrictTo('admin'), UserController.getAllUsers);

// User and admin routes
router.get('/:id', restrictTo('admin', 'user', 'coach'), UserController.getUserById);

export default router; 