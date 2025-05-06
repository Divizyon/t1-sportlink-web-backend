import express from 'express';
import * as MessageController from '../controllers/MessageController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

// Tüm rotaları koruma altına alıyoruz
router.use(protect);

/**
 * @swagger
 * /api/mobile/messages/chat-list:
 *   get:
 *     summary: Sohbet listesini getir
 *     tags: [Mobile - Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sohbet listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/chat-list', MessageController.getChatList);

/**
 * @swagger
 * /api/mobile/messages/unread:
 *   get:
 *     summary: Okunmamış mesaj sayılarını getir
 *     tags: [Mobile - Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Okunmamış mesaj sayıları
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/unread', MessageController.getUnreadMessageCount);

/**
 * @swagger
 * /api/mobile/messages/{friendId}:
 *   post:
 *     summary: Mesaj gönder
 *     tags: [Mobile - Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *               content_type:
 *                 type: string
 *                 enum: [text, image, video, file]
 *                 default: text
 *     responses:
 *       201:
 *         description: Mesaj gönderildi
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/:friendId', MessageController.sendMessage);

/**
 * @swagger
 * /api/mobile/messages/{friendId}:
 *   get:
 *     summary: Bir arkadaşla olan mesajlaşmaları listele
 *     tags: [Mobile - Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: Mesajlar listesi
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/:friendId', MessageController.getConversation);

/**
 * @swagger
 * /api/mobile/messages/{friendId}/read:
 *   put:
 *     summary: Mesajları okundu olarak işaretle
 *     tags: [Mobile - Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: friendId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Mesajlar okundu olarak işaretlendi
 *       401:
 *         description: Yetkisiz erişim
 */
router.put('/:friendId/read', MessageController.markMessagesAsRead);

export default router;
