import express from 'express';
import { NotificationController } from '../controllers/NotificationController';
import { protect, isAdmin } from '../middleware/authMiddleware';

const router = express.Router();
const notificationController = new NotificationController();

/**
 * @route GET /api/notifications
 * @description Bildirim listesini getirir
 * @access Private
 */
router.get('/', protect, notificationController.getNotifications);

/**
 * @route GET /api/notifications/unread-count
 * @description Okunmamış bildirim sayısını getirir
 * @access Private
 */
router.get('/unread-count', protect, notificationController.getUnreadCount);

/**
 * @route PATCH /api/notifications/:id/read
 * @route PUT /api/notifications/:id/read
 * @description Bildirimi okundu olarak işaretler
 * @access Private
 */
router.patch('/:id/read', protect, notificationController.markAsRead);
router.put('/:id/read', protect, notificationController.markAsRead);


/**
 * @route PATCH /api/notifications/mark-all-read
 * @route PUT /api/notifications/mark-all-read
 * @description Tüm bildirimleri okundu olarak işaretler
 * @access Private
 */
router.patch('/mark-all-read', protect, notificationController.markAllAsRead);
router.put('/mark-all-read', protect, notificationController.markAllAsRead);

/**
 * @route DELETE /api/notifications/:id
 * @description Bildirimi siler
 * @access Private
 */
router.delete('/:id', protect, notificationController.deleteNotification);

/**
 * @route POST /api/notifications/test
 * @description Test bildirimi oluşturur (sadece geliştirme amaçlı)
 * @access Admin
 */
router.post('/test', protect, isAdmin, notificationController.createTestNotification);

export default router; 