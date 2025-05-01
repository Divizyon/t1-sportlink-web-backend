import express from 'express';
import authRoutes from './authRoutes';
import sportsRoutes from './sportsRoutes';
import userRoutes from './userRoutes';
import eventRoutes from './eventRoutes';
import newsRoutes from './newsRoutes';
import reportRoutes from './reportRoutes';
import securityRoutes from './securityRoutes';
import announcementRoutes from './announcementRoutes';
import { authenticate, requireAuth, requireAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Her isteği kimlik doğrulama middleware'inden geçir
router.use(authenticate);

// Auth routes (public)
router.use('/auth', authRoutes);

// Sports routes (authenticated for write, public for read)
router.use('/sports', sportsRoutes);

// Announcement routes (public for read, admin for write)
router.use('/announcements', announcementRoutes);

// Protected routes (auth required)
router.use('/user', requireAuth, userRoutes);
router.use('/events', eventRoutes);
router.use('/news', newsRoutes);
router.use('/reports', requireAuth, reportRoutes);

// Admin routes
router.use('/security', requireAdmin, securityRoutes);

export default router; 