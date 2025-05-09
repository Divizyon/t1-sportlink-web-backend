import express from 'express';
import authRoutes from './authRoutes';
import sportsRoutes from './sportsRoutes';
import userRoutes from './userRoutes';
import eventRoutes from './eventRoutes';
import announcementRoutes from './announcementRoutes';
import eventRatingRoutes from './eventRatingRoutes';
import userReportRoutes from './userReportRoutes';
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

// Kullanıcı raporlama işlemleri için
router.use('/user-reports', requireAuth, userReportRoutes);

// Event ratings routes
router.use('/event-ratings', eventRatingRoutes);

// Note: Security logs endpointleri kaldırıldı, eğer gerekirse adminSecurityRoutes.ts dosyasından erişilebilir

export default router; 