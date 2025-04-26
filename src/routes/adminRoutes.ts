import express from 'express';
import { adminController } from '../controllers';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Yönetici erişimi gerektiren raporlarla ilgili rotalar
router.get('/reports/:reportId', protect, isAdmin, adminController.getReportAdminDetails);
router.post('/reports/:reportId/warn-user', protect, isAdmin, adminController.sendWarningToUser);
router.post('/users/:userId/toggle-status', protect, isAdmin, adminController.toggleUserStatus);

export default router; 