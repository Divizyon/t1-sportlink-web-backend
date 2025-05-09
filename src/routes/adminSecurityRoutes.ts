import express from 'express';
import SecurityController from '../controllers/SecurityController';
import { isAdmin } from '../middleware/authMiddleware';

// Bu dosya, admin/yönetici tarafından kullanılan güvenlik log endpoint'lerini içerir
// Ancak artık routes/index.ts'de bağlantısı olmadığından API'da erişilemez durumdadır
// İhtiyaç duyulursa tekrar eklenebilir

const router = express.Router();

/**
 * @swagger
 * /api/security/logs:
 *   get:
 *     summary: Güvenlik loglarını listele
 *     description: Güvenlik loglarını filtreleme ve sayfalama destekli olarak getirir (sadece admin)
 *     tags:
 *       - Security
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Sayfa başına kayıt sayısı
 *       - in: query
 *         name: searchQuery
 *         schema:
 *           type: string
 *         description: Admin veya aksiyon alanlarında arama yapar
 *       - in: query
 *         name: dateFilter
 *         schema:
 *           type: string
 *           format: date
 *         description: Belirli bir tarihe göre filtreler (yyyy-MM-dd)
 *       - in: query
 *         name: actionType
 *         schema:
 *           type: string
 *           enum: [login, logout, failed_attempt, password_change, user_update, role_change, permission_change]
 *         description: İşlem tipine göre filtreler
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, warning, error]
 *         description: Duruma göre filtreler
 *     responses:
 *       200:
 *         description: Güvenlik logları başarıyla alındı
 *       401:
 *         description: Yetkilendirme hatası
 *       500:
 *         description: Sunucu hatası
 */
router.get('/logs', SecurityController.getLogs);

/**
 * @swagger
 * /api/security/logs:
 *   post:
 *     summary: Yeni güvenlik logu oluştur
 *     description: Yeni bir güvenlik log kaydı oluşturur (sadece admin veya sistem)
 *     tags:
 *       - Security
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - admin
 *               - ip
 *               - status
 *               - action
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [login, logout, failed_attempt, password_change, user_update, role_change, permission_change]
 *               admin:
 *                 type: string
 *               ip:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [success, warning, error]
 *               action:
 *                 type: string
 *     responses:
 *       201:
 *         description: Güvenlik logu başarıyla oluşturuldu
 *       400:
 *         description: Geçersiz veya eksik veri
 *       401:
 *         description: Yetkilendirme hatası
 *       500:
 *         description: Sunucu hatası
 */
router.post('/logs', SecurityController.createLog);

/**
 * @swagger
 * /api/security/logs/{id}:
 *   delete:
 *     summary: Güvenlik logunu sil
 *     description: Belirtilen ID'ye sahip güvenlik logunu siler (sadece admin)
 *     tags:
 *       - Security
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Silinecek log kaydının ID'si
 *     responses:
 *       200:
 *         description: Güvenlik logu başarıyla silindi
 *       400:
 *         description: Geçersiz veya eksik ID
 *       401:
 *         description: Yetkilendirme hatası
 *       500:
 *         description: Sunucu hatası
 */
router.delete('/logs/:id', SecurityController.deleteLog);

export default router; 