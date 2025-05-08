import express from 'express';
import { 
  changePassword, 
  deleteAvatar, 
  getProfile, 
  updateProfile, 
  uploadAvatar, 
  getUserSports, 
  addUserSport, 
  removeUserSport,
  batchUpdateUserSports 
} from '../controllers/ProfileController';
import { protect } from '../middleware/authMiddleware';
import { uploadImage } from '../middleware/uploadMiddleware'; // Dosya yükleme middleware'i

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Kullanıcı profil yönetimi
 */

// Tüm profil route'ları için kimlik doğrulama gerekli
router.use(protect);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Mevcut kullanıcı profilini getir
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcı profil bilgileri
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                   description: Kullanıcının tam adı
 *                 email:
 *                   type: string
 *                   format: email
 *                   description: Kullanıcının e-posta adresi
 *                 phone:
 *                   type: string
 *                   description: Kullanıcının telefon numarası
 *                 avatar:
 *                   type: string
 *                   format: url
 *                   description: Kullanıcının profil resmi URL'i
 *                 bio:
 *                   type: string
 *                   description: Kullanıcının biyografisi
 *                 gender:
 *                   type: string
 *                   description: Kullanıcının cinsiyeti
 *                 birthday_date:
 *                   type: string
 *                   format: date
 *                   description: Kullanıcının doğum tarihi
 *                 address:
 *                   type: string
 *                   description: Kullanıcının adresi
 *                 first_name:
 *                   type: string
 *                   description: Kullanıcının adı
 *                 last_name:
 *                   type: string
 *                   description: Kullanıcının soyadı
 *                 total_events:
 *                   type: integer
 *                   description: Kullanıcının katıldığı toplam etkinlik sayısı
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Kullanıcı bulunamadı
 */
router.get('/', getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Kullanıcı profilini güncelle
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: Kullanıcının adı
 *               last_name:
 *                 type: string
 *                 description: Kullanıcının soyadı
 *               phone:
 *                 type: string
 *                 description: Kullanıcının telefon numarası
 *               bio:
 *                 type: string
 *                 description: Kullanıcının biyografisi/hakkında bilgisi
 *               gender:
 *                 type: string
 *                 description: Kullanıcının cinsiyeti
 *               birthday_date:
 *                 type: string
 *                 format: date
 *                 description: Kullanıcının doğum tarihi (YYYY-MM-DD formatında)
 *               address:
 *                 type: string
 *                 description: Kullanıcının adresi
 *             required:
 *               - first_name
 *               - last_name
 *     responses:
 *       200:
 *         description: Profil başarıyla güncellendi
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
 *                   example: Profile updated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     gender:
 *                       type: string
 *                     birthday_date:
 *                       type: string
 *                       format: date
 *                     address:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     total_events:
 *                       type: integer
 *                       description: Kullanıcının katıldığı toplam etkinlik sayısı
 *       400:
 *         description: Hatalı istek (örn. gerekli alanlar eksik veya email değiştirme girişimi)
 *       401:
 *         description: Yetkisiz erişim
 */
router.put('/', updateProfile);

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Kullanıcı şifresini değiştir
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *     responses:
 *       200:
 *         description: Şifre başarıyla değiştirildi
 *       400:
 *         description: Hatalı istek (örn. mevcut şifre yanlış, şifreler eşleşmiyor, yeni şifre çok zayıf)
 *       401:
 *         description: Yetkisiz erişim
 */
router.put('/password', changePassword);

/**
 * @swagger
 * /api/profile/avatar:
 *   post:
 *     summary: Profil resmi yükle
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Yüklenecek profil resmi dosyası (örn. profil.jpg).
 *             required:
 *               - avatar
 *     responses:
 *       200:
 *         description: Profil resmi başarıyla yüklendi
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
 *                   example: Profil resmi başarıyla yüklendi
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       format: url
 *       400:
 *         description: Hatalı istek (örn. dosya yok, geçersiz dosya türü, dosya çok büyük)
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/avatar', uploadImage, uploadAvatar); // upload middleware'ini kullanıyoruz

/**
 * @swagger
 * /api/profile/avatar:
 *   delete:
 *     summary: Profil resmi sil
 *     description: Kullanıcının profil resmini siler ve varsayılan/boş resme geri döner.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil resmi başarıyla silindi
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
 *                   example: Avatar deleted successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       description: Varsayılan avatar URL'i veya boş string
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/avatar', deleteAvatar);

/**
 * @swagger
 * /api/profile/sports:
 *   get:
 *     summary: Kullanıcının favori sporlarını getir
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Kullanıcının favori sporları
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
 *                   example: User sports fetched successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       sport_id:
 *                         type: integer
 *                         description: Spor dalının ID'si
 *                       sport:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           name:
 *                             type: string
 *                           description:
 *                             type: string
 *                           icon:
 *                             type: string
 *       401:
 *         description: Yetkisiz erişim
 */
router.get('/sports', getUserSports);

/**
 * @swagger
 * /api/profile/sports:
 *   post:
 *     summary: Kullanıcının favori sporlarına yeni spor ekle
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sport_id:
 *                 type: integer
 *                 description: Eklenecek spor dalının ID'si
 *             required:
 *               - sport_id
 *     responses:
 *       201:
 *         description: Favori spor başarıyla eklendi
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
 *                   example: Sport added to favorites successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     sport_id:
 *                       type: integer
 *       400:
 *         description: Hatalı istek (örn. geçersiz spor ID'si)
 *       401:
 *         description: Yetkisiz erişim
 *       409:
 *         description: Çakışma (spor zaten favorilerde)
 */
router.post('/sports', addUserSport);

/**
 * @swagger
 * /api/profile/sports/{sportId}:
 *   delete:
 *     summary: Kullanıcının favori sporlarından bir sporu kaldır
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Silinecek spor dalının ID'si
 *     responses:
 *       200:
 *         description: Favori spor başarıyla kaldırıldı
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
 *                   example: Sport removed from favorites successfully
 *       401:
 *         description: Yetkisiz erişim
 *       404:
 *         description: Spor bulunamadı
 */
router.delete('/sports/:sportId', removeUserSport);

/**
 * @swagger
 * /api/profile/sports/batch:
 *   post:
 *     summary: Kullanıcının favori sporlarını toplu güncelle
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               add:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Eklenecek spor dalları ID'lerinin listesi
 *               remove:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Silinecek spor dalları ID'lerinin listesi
 *     responses:
 *       200:
 *         description: Favori sporlar başarıyla güncellendi
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
 *                   example: User sports batch update successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     added:
 *                       type: integer
 *                       description: Eklenen spor sayısı
 *                     removed:
 *                       type: integer
 *                       description: Silinen spor sayısı
 *                     sports:
 *                       type: array
 *                       description: Güncel favori sporlar
 *       400:
 *         description: Hatalı istek
 *       401:
 *         description: Yetkisiz erişim
 */
router.post('/sports/batch', batchUpdateUserSports);

export default router; 