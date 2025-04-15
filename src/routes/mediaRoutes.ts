import express from 'express';
import mediaController from '../controllers/MediaController';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware';

// Dosyaları bellekte saklayacak şekilde multer yapılandırması
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

/**
 * @swagger
 * /api/media/events/{eventId}:
 *   post:
 *     summary: Etkinliğe medya (görsel/video) ekler
 *     description: Bir etkinlik için görsel veya video yükler
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Etkinlik ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Yüklenecek dosya
 *               mediaType:
 *                 type: string
 *                 enum: [image, video]
 *                 description: Medya tipi
 *               isCover:
 *                 type: boolean
 *                 description: Kapak görseli olarak kullanılacak mı?
 *     responses:
 *       201:
 *         description: Medya başarıyla yüklendi
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 */
router.post('/events/:eventId', protect, upload.single('file'), mediaController.uploadEventMedia);

/**
 * @swagger
 * /api/media/events/{eventId}:
 *   get:
 *     summary: Etkinliğe ait tüm medya dosyalarını getirir
 *     description: Belirli bir etkinliğe ait tüm medya dosyalarını listeler
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *         description: Etkinlik ID
 *     responses:
 *       200:
 *         description: Medya listesi başarıyla alındı
 *       401:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 */
router.get('/events/:eventId', mediaController.getEventMedia);

/**
 * @swagger
 * /api/media/{mediaId}:
 *   delete:
 *     summary: Etkinlikten medya dosyasını siler
 *     description: Belirli bir medya dosyasını etkinlikten ve storage sisteminden siler
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: mediaId
 *         required: true
 *         schema:
 *           type: string
 *         description: Medya ID
 *     responses:
 *       200:
 *         description: Medya başarıyla silindi
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Medya bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/:mediaId', protect, mediaController.deleteEventMedia);

export default router; 