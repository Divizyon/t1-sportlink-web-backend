import express from 'express';
import * as EventController from '../controllers/EventController';
import { protect, optionalAuth } from '../middleware/authMiddleware';
import { enforceDbConnection } from '../middleware/databaseMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Etkinlik yönetimi
 */

/**
 * @swagger
 * /api/events/today:
 *   get:
 *     summary: Bugünkü aktif etkinliklerin listesini döndürür
 *     description: Bugüne ait aktif etkinliklerin listesini frontend formatında döndürür
 *     tags: [Events]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         schema:
 *           type: string
 *         required: false
 *         description: Oturum token'ı (varsa user_id kullanılır)
 *     responses:
 *       200:
 *         description: Başarılı yanıt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TodayEvent'
 *       500:
 *         description: Sunucu hatası
 */
router.get('/today', optionalAuth, EventController.getTodayEvents);

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
router.get('/', enforceDbConnection, EventController.getAllEvents);

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
 *                 type: integer
 *                 format: int64
 *                 example: 6
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
router.post('/', protect, enforceDbConnection, EventController.createEvent);

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
router.get('/:id', enforceDbConnection, EventController.getEventById);

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

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Etkinlik bilgilerini güncelle
 *     description: Mevcut bir etkinliğin bilgilerini günceller
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
 *                 type: integer
 *                 format: int64
 *                 example: 6
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
 *       200:
 *         description: Etkinlik başarıyla güncellendi
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
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       404:
 *         description: Etkinlik bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.put('/:id', protect, EventController.updateEvent);

/**
 * @swagger
 * /api/events/{id}:
 *   delete:
 *     summary: Etkinliği sil
 *     description: Bir etkinliği kalıcı olarak siler
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
 *     responses:
 *       200:
 *         description: Etkinlik başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Etkinlik başarıyla silindi.
 *       401:
 *         description: Yetkilendirme hatası
 *       403:
 *         description: Bu işlem için yetkiniz yok
 *       404:
 *         description: Etkinlik bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/:id', protect, EventController.deleteEvent);

export default router; 