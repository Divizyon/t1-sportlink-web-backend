import express from 'express';
import * as EventController from '../controllers/EventController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Tüm etkinlikleri getir
 *     description: Sistemdeki tüm etkinlikleri listeler
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: Etkinlikler başarıyla getirildi
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
 *                     events:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Event'
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', EventController.getAllEvents);

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Yeni etkinlik oluştur
 *     description: Yeni bir etkinlik oluşturur
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - sport_id
 *               - event_date
 *               - start_time
 *               - end_time
 *               - location_name
 *               - location_lat
 *               - location_long
 *               - max_participants
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *                 description: Etkinlik başlığı
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Etkinlik açıklaması
 *               sport_id:
 *                 type: string
 *                 format: uuid
 *                 description: Etkinliğin spor türünün ID'si
 *               event_date:
 *                 type: string
 *                 format: date
 *                 description: Etkinlik tarihi (YYYY-MM-DD)
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 description: Etkinlik başlangıç zamanı (ISO 8601 formatında)
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: Etkinlik bitiş zamanı (ISO 8601 formatında)
 *               location_name:
 *                 type: string
 *                 maxLength: 200
 *                 description: Etkinlik konumunun adı
 *               location_lat:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 format: float
 *                 description: Etkinlik konumunun enlem bilgisi
 *               location_long:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 format: float
 *                 description: Etkinlik konumunun boylam bilgisi
 *               max_participants:
 *                 type: integer
 *                 minimum: 2
 *                 maximum: 1000
 *                 description: Maksimum katılımcı sayısı
 *     responses:
 *       201:
 *         description: Etkinlik başarıyla oluşturuldu
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
 *         description: Geçersiz istek veya veri doğrulama hatası
 *       401:
 *         description: Yetkilendirme hatası
 *       500:
 *         description: Sunucu hatası
 */
router.post('/', protect, EventController.createEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Belirli bir etkinliği getir
 *     description: Verilen ID'ye sahip etkinliği getirir
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Etkinlik ID'si
 *     responses:
 *       200:
 *         description: Etkinlik başarıyla getirildi
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
 *       404:
 *         description: Etkinlik bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.get('/:id', EventController.getEventById);

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
 *                 enum: [ACTIVE, CANCELLED, COMPLETED]
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