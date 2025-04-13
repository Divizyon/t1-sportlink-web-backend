import express from 'express';
import * as EventController from '../controllers/EventController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/events/{id}/status:
 *   patch:
 *     summary: Etkinlik durumunu güncelle
 *     description: Bir etkinliğin durumunu aktif, iptal edildi veya tamamlandı olarak günceller
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Etkinlik ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, cancelled, completed]
 *                 description: Yeni etkinlik durumu
 *     responses:
 *       200:
 *         description: Etkinlik durumu başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     event:
 *                       $ref: '#/components/schemas/Event'
 *       400:
 *         description: Geçersiz istek veya durum güncellenemez
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       404:
 *         description: Etkinlik bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.patch('/:id/status', protect, EventController.updateEventStatus);

export default router; 