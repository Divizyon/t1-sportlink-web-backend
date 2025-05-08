import express from 'express';
import * as WarningController from '../controllers/WarningController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Warnings
 *   description: Kullanıcı uyarı mesajları yönetimi
 */

/**
 * @swagger
 * /api/warnings:
 *   get:
 *     summary: Kullanıcının tüm uyarı mesajlarını getirir
 *     description: Kullanıcının kendisine gönderilen tüm uyarıları listeler
 *     tags: [Warnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Uyarı mesajları başarıyla getirildi
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', protect, WarningController.getUserWarnings);

/**
 * @swagger
 * /api/warnings/unread/count:
 *   get:
 *     summary: Kullanıcının okunmamış uyarı sayısını getirir
 *     description: Kullanıcının okunmamış uyarı mesajlarının sayısını döndürür
 *     tags: [Warnings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Okunmamış uyarı sayısı başarıyla getirildi
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       500:
 *         description: Sunucu hatası
 */
router.get('/unread/count', protect, WarningController.getUnreadWarningsCount);

/**
 * @swagger
 * /api/warnings/{warningId}/read:
 *   patch:
 *     summary: Uyarı mesajını okundu olarak işaretler
 *     description: Kullanıcının kendisine ait bir uyarıyı okundu olarak işaretler
 *     tags: [Warnings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: warningId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Okundu işaretlenecek uyarının ID'si
 *     responses:
 *       200:
 *         description: Uyarı başarıyla okundu olarak işaretlendi
 *       401:
 *         description: Kimlik doğrulama gerekli
 *       404:
 *         description: Uyarı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.patch('/:warningId/read', protect, WarningController.markWarningAsRead);

export default router; 