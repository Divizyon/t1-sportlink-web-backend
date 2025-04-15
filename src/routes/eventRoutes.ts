import express from 'express';
import * as EventController from '../controllers/EventController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Tüm etkinlikleri listeler
 *     description: Sistemdeki tüm etkinlikleri getirir
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Etkinlik listesi başarıyla alındı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', EventController.getAllEvents);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Belirli bir etkinliği getirir
 *     description: ID'si verilen etkinliğin detaylarını getirir
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Etkinlik ID
 *     responses:
 *       200:
 *         description: Etkinlik başarıyla alındı
 *       404:
 *         description: Etkinlik bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/:id', EventController.getEventById);

export default router; 