import express from 'express';
import * as UserController from '../controllers/UserController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

// All user routes are protected
router.use(protect);

// Routes accessible only to admins
router.get('/', restrictTo('admin'), UserController.getAllUsers);

// Routes accessible to the user and admins
router.get('/:id', UserController.getUserById);

export default router; 