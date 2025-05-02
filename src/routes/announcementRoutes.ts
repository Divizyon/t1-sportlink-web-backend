import express from 'express';
import * as announcementController from '../controllers/AnnouncementController';
import { protect, isAdmin } from '../middleware/authMiddleware';
import { uploadImage } from '../middleware/uploadMiddleware';

const router = express.Router();

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: Tüm duyuruları listeler
 *     description: Sistemdeki tüm duyuruları getirir
 *     responses:
 *       200:
 *         description: Duyurular başarıyla listelendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyurular başarıyla getirildi
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
 *                       title:
 *                         type: string
 *                         example: Sistem Bakımı
 *                       content:
 *                         type: string
 *                         example: 10 Haziran tarihinde sistem bakımda olacaktır.
 *                       image_url:
 *                         type: string
 *                         nullable: true
 *                         example: https://example.com/images/maintenance.jpg
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2023-05-01T12:00:00Z
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: 2023-05-01T12:00:00Z
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyurular getirilirken bir hata oluştu
 *                 error:
 *                   type: string
 *                   example: Veritabanı bağlantısı sağlanamadı
 */
router.get('/', announcementController.getAllAnnouncements);

/**
 * @swagger
 * /api/announcements/{id}:
 *   get:
 *     tags: [Announcements]
 *     summary: Belirtilen ID'ye sahip duyuruyu getirir
 *     description: Belirtilen ID'ye sahip duyuruyu detaylarıyla birlikte getirir
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Duyuru ID'si
 *     responses:
 *       200:
 *         description: Duyuru başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru başarıyla getirildi
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
 *                     title:
 *                       type: string
 *                       example: Sistem Bakımı
 *                     content:
 *                       type: string
 *                       example: 10 Haziran tarihinde sistem bakımda olacaktır.
 *                     image_url:
 *                       type: string
 *                       nullable: true
 *                       example: https://example.com/images/maintenance.jpg
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-05-01T12:00:00Z
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-05-01T12:00:00Z
 *       404:
 *         description: Duyuru bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru bulunamadı
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru getirilirken bir hata oluştu
 *                 error:
 *                   type: string
 *                   example: Veritabanı bağlantısı sağlanamadı
 */
router.get('/:id', announcementController.getAnnouncementById);

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     tags: [Announcements]
 *     summary: Yeni bir duyuru oluşturur (Sadece Admin)
 *     description: Yeni bir duyuru oluşturur, sadece admin kullanıcılar erişebilir
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 example: Yeni Özellik Duyurusu
 *               content:
 *                 type: string
 *                 example: Platformumuza yeni özellikler ekledik. Detaylar için tıklayınız.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Duyuru için resim dosyası (isteğe bağlı)
 *     responses:
 *       201:
 *         description: Duyuru başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru başarıyla oluşturuldu
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
 *                     title:
 *                       type: string
 *                       example: Yeni Özellik Duyurusu
 *                     content:
 *                       type: string
 *                       example: Platformumuza yeni özellikler ekledik. Detaylar için tıklayınız.
 *                     image_url:
 *                       type: string
 *                       example: https://example.com/images/new-feature.jpg
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-05-01T12:00:00Z
 *       400:
 *         description: Geçersiz istek
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Başlık ve içerik alanları zorunludur
 *       401:
 *         description: Yetkisiz erişim
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bu işlem için giriş yapmalısınız
 *       403:
 *         description: Erişim reddedildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bu işlem için yetkiniz bulunmamaktadır
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru oluşturulurken bir hata oluştu
 *                 error:
 *                   type: string
 *                   example: Veritabanı bağlantısı sağlanamadı
 */
router.post('/', protect, isAdmin, uploadImage, announcementController.createAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 *   put:
 *     tags: [Announcements]
 *     summary: Bir duyuruyu günceller (Sadece Admin)
 *     description: Belirtilen ID'ye sahip duyuruyu günceller, sadece admin kullanıcılar erişebilir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Güncellenecek duyuru ID'si
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: Güncellenmiş Duyuru Başlığı
 *               content:
 *                 type: string
 *                 example: Güncellenmiş duyuru içeriği.
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Yeni duyuru resmi (isteğe bağlı)
 *     responses:
 *       200:
 *         description: Duyuru başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru başarıyla güncellendi
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: a1b2c3d4-e5f6-g7h8-i9j0-k1l2m3n4o5p6
 *                     title:
 *                       type: string
 *                       example: Güncellenmiş Duyuru Başlığı
 *                     content:
 *                       type: string
 *                       example: Güncellenmiş duyuru içeriği.
 *                     image_url:
 *                       type: string
 *                       example: https://example.com/images/updated-image.jpg
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: 2023-05-02T14:30:00Z
 *       400:
 *         description: Geçersiz istek
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru ID gereklidir
 *       401:
 *         description: Yetkisiz erişim
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bu işlem için yetkiniz bulunmamaktadır
 *       404:
 *         description: Duyuru bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru bulunamadı
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru güncellenirken bir hata oluştu
 *                 error:
 *                   type: string
 *                   example: Veritabanı bağlantısı sağlanamadı
 */
router.put('/:id', protect, isAdmin, uploadImage, announcementController.updateAnnouncement);

/**
 * @swagger
 * /api/announcements/{id}:
 *   delete:
 *     tags: [Announcements]
 *     summary: Bir duyuruyu siler (Sadece Admin)
 *     description: Belirtilen ID'ye sahip duyuruyu siler, sadece admin kullanıcılar erişebilir
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Silinecek duyuru ID'si
 *     responses:
 *       200:
 *         description: Duyuru başarıyla silindi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru başarıyla silindi
 *       400:
 *         description: Geçersiz istek
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru ID gereklidir
 *       401:
 *         description: Yetkisiz erişim
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Bu işlem için yetkiniz bulunmamaktadır
 *       404:
 *         description: Duyuru bulunamadı
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru bulunamadı
 *       500:
 *         description: Sunucu hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Duyuru silinirken bir hata oluştu
 *                 error:
 *                   type: string
 *                   example: Veritabanı bağlantısı sağlanamadı
 */
router.delete('/:id', protect, isAdmin, announcementController.deleteAnnouncement);

export default router; 