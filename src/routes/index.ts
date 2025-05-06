import express from 'express';
import authRoutes from './authRoutes';
import sportsRoutes from './sportsRoutes';
import userRoutes from './userRoutes';
import eventRoutes from './eventRoutes';
import newsRoutes from './newsRoutes';
import reportRoutes from './reportRoutes';
import securityRoutes from './securityRoutes';
import announcementRoutes from './announcementRoutes';
import { protect, optionalAuth, isAdmin } from '../middleware/authMiddleware';
import friendshipRoutes from './friendshipRoutes';
import messageRoutes from './messageRoutes';

const router = express.Router();

// Her isteği kimlik doğrulama middleware'inden geçir
router.use(optionalAuth);

// Auth routes (public)
router.use('/auth', authRoutes);

// Sports routes (authenticated for write, public for read)
router.use('/sports', sportsRoutes);

// Announcement routes (public for read, admin for write)
router.use('/announcements', announcementRoutes);

// Protected routes (auth required)
router.use('/user', protect, userRoutes);
router.use('/events', eventRoutes);
router.use('/news', newsRoutes);
router.use('/reports', protect, reportRoutes);

// Admin routes
router.use('/security', isAdmin, securityRoutes);

// Mobil API rotaları
router.use('/api/mobile/friendships', friendshipRoutes);
router.use('/api/mobile/messages', messageRoutes);

export default router; 