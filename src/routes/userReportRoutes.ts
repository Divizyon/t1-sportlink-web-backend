import { Router } from 'express';
import { protect } from '../middleware/authMiddleware';
import { UserReportController } from '../controllers/UserReportController';

const router = Router();

// Tüm rotaları koruma altına al - sadece giriş yapmış kullanıcılar raporlama yapabilir
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: UserReports
 *   description: Kullanıcı raporlama işlemleri
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     UserReport:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Rapor ID
 *           example: 42
 *         report_reason:
 *           type: string
 *           description: Rapor sebebi
 *           example: 'Uygunsuz davranış'
 *         report_date:
 *           type: string
 *           format: date-time
 *           description: Rapor tarihi
 *           example: '2025-01-15T14:30:00Z'
 *         status:
 *           type: string
 *           description: Raporun durumu
 *           example: 'pending'
 *           enum: [pending, reviewing, resolved, rejected]
 *         event_id:
 *           type: string
 *           description: Raporlanan etkinlik ID'si (eğer etkinlik raporuysa)
 *           example: '123e4567-e89b-12d3-a456-426614174000'
 *           nullable: true
 *         reported_id:
 *           type: string
 *           description: Raporlanan kullanıcı ID'si (eğer kullanıcı raporuysa)
 *           example: '123e4567-e89b-12d3-a456-426614174001'
 *           nullable: true
 */

/**
 * @swagger
 * /api/user-reports:
 *   get:
 *     summary: Kullanıcının kendi raporlarını görüntüle
 *     tags: [UserReports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Raporlar başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/UserReport'
 *                 count:
 *                   type: integer
 *                   example: 3
 *       401:
 *         description: Yetkilendirme hatası
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', UserReportController.getUserReports);

/**
 * @swagger
 * /api/user-reports/user:
 *   post:
 *     summary: Bir kullanıcıyı raporla
 *     tags: [UserReports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reportedId
 *               - reason
 *             properties:
 *               reportedId:
 *                 type: string
 *                 description: Raporlanacak kullanıcının ID'si
 *                 example: '123e4567-e89b-12d3-a456-426614174001'
 *               reason:
 *                 type: string
 *                 description: Rapor sebebi
 *                 example: 'Uygunsuz davranış sergiliyor'
 *     responses:
 *       201:
 *         description: Rapor başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Rapor başarıyla oluşturuldu'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 42
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkilendirme hatası
 *       500:
 *         description: Sunucu hatası
 */
router.post('/user', UserReportController.reportUser);

/**
 * @swagger
 * /api/user-reports/event:
 *   post:
 *     summary: Bir etkinliği raporla
 *     tags: [UserReports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - reason
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: Raporlanacak etkinliğin ID'si
 *                 example: '123e4567-e89b-12d3-a456-426614174000'
 *               reason:
 *                 type: string
 *                 description: Rapor sebebi
 *                 example: 'Uygunsuz içerik'
 *     responses:
 *       201:
 *         description: Rapor başarıyla oluşturuldu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: 'Etkinlik raporu başarıyla oluşturuldu'
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 43
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         description: Yetkilendirme hatası
 *       500:
 *         description: Sunucu hatası
 */
router.post('/event', UserReportController.reportEvent);

export default router; 