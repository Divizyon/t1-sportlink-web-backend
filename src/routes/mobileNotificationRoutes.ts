import express from 'express';
import { MobileNotificationController } from '../controllers/MobileNotificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();
const mobileNotificationController = new MobileNotificationController();

/**
 * @route POST /api/mobile/notifications/register-device
 * @desc Cihaz token'ı kaydet
 * @access Private
 */
router.post('/register-device', protect, mobileNotificationController.registerDeviceToken);

/**
 * @route GET /api/mobile/notifications
 * @desc Kullanıcı bildirimlerini getir
 * @access Private
 */
router.get('/', protect, mobileNotificationController.getUserNotifications);

/**
 * @route GET /api/mobile/notifications/unread-count
 * @desc Okunmamış bildirim sayısını getir
 * @access Private
 */
router.get('/unread-count', protect, mobileNotificationController.getUnreadCount);

/**
 * @route PATCH /api/mobile/notifications/:id/read
 * @desc Bildirimi okundu olarak işaretle
 * @access Private
 */
router.patch('/:id/read', protect, mobileNotificationController.markAsRead);

/**
 * @route PATCH /api/mobile/notifications/mark-all-read
 * @desc Tüm bildirimleri okundu olarak işaretle
 * @access Private
 */
router.patch('/mark-all-read', protect, mobileNotificationController.markAllAsRead);

/**
 * @route POST /api/mobile/notifications/test
 * @desc Test bildirimi gönder
 * @access Private
 */
router.post('/test', protect, mobileNotificationController.sendTestNotification);

export default router;
