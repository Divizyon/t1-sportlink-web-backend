import express from 'express';
import * as ReportController from '../controllers/ReportController';
import { protect, restrictTo } from '../middleware/authMiddleware';
import { enforceDbConnection } from '../middleware/databaseMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Rapor yönetimi
 */

// Tüm rapor rotaları korumalıdır ve sadece admin ve staff erişebilir
router.use(protect);
router.use(restrictTo('ADMIN', 'STAFF'));

/**
 * @swagger
 * /api/reports:
 *   get:
 *     summary: Tüm raporları getir
 *     description: Sistemdeki tüm raporları getirir. Sadece yöneticiler ve görevliler erişebilir.
 *     tags: [Reports]
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
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   description: Dönen rapor sayısı
 *                   example: 3
 *                 data:
 *                   type: object
 *                   properties:
 *                     reports:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Report'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', enforceDbConnection, ReportController.getAllReports);

/**
 * @swagger
 * /api/reports/dashboard:
 *   get:
 *     summary: Dashboard için rapor verilerini getir
 *     description: Frontend dashboard için uygun formatta rapor verilerini getirir.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Rapor verileri başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 results:
 *                   type: integer
 *                   description: Dönen rapor sayısı
 *                   example: 3
 *                 data:
 *                   type: object
 *                   properties:
 *                     DASHBOARD_REPORTS:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/ReportData'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/dashboard', ReportController.getReportData);

/**
 * @swagger
 * /api/reports/{id}/status:
 *   patch:
 *     summary: Rapor durumunu güncelle
 *     description: Raporun durumunu çözüldü veya reddedildi olarak güncelle.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
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
 *                 enum: [resolved, rejected]
 *                 description: Raporun yeni durumu
 *     responses:
 *       200:
 *         description: Rapor durumu başarıyla güncellendi
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
 *                     report:
 *                       $ref: '#/components/schemas/Report'
 *       400:
 *         description: Geçersiz durum değeri
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Rapor bulunamadı
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:id/status', ReportController.updateReportStatus);

/**
 * @swagger
 * /api/reports/{id}/notes:
 *   patch:
 *     summary: Rapora admin notu ekle
 *     description: Rapora admin notu ekler veya mevcut notu günceller.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - admin_notes
 *             properties:
 *               admin_notes:
 *                 type: string
 *                 description: Admin notu içeriği
 *     responses:
 *       200:
 *         description: Admin notu başarıyla eklendi/güncellendi
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
 *                     report:
 *                       $ref: '#/components/schemas/Report'
 *       400:
 *         description: Admin notu gereklidir
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Rapor bulunamadı
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:id/notes', ReportController.updateAdminNotes);

/**
 * @swagger
 * /api/reports/{id}/ban-user:
 *   post:
 *     summary: Kullanıcıyı banla
 *     description: Raporda belirtilen kullanıcıyı banlar ve raporu çözüldü olarak işaretler.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla banlandı
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
 *                   example: Kullanıcı başarıyla banlandı.
 *                 data:
 *                   type: object
 *                   properties:
 *                     banned_user_id:
 *                       type: string
 *                       description: Banlanan kullanıcının UUID'si
 *                       example: a1b2c3d4-e5f6-7890-abcd-ef1234567890
 *       400:
 *         description: Geçersiz istek
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Rapor veya kullanıcı bulunamadı
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/ban-user', ReportController.banUserFromReport);

/**
 * @swagger
 * /api/reports/{id}/admin-info:
 *   get:
 *     summary: Rapor için admin işlem bilgilerini getir
 *     description: Raporu işleyen adminin e-posta, kullanıcı adı, admin notu ve rapor ID bilgilerini döndürür.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
 *     responses:
 *       200:
 *         description: Admin bilgileri başarıyla getirildi
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
 *                     rapor_id:
 *                       type: string
 *                       description: Rapor ID'si
 *                       example: "42"
 *                     admin_email:
 *                       type: string
 *                       description: Admin e-posta adresi
 *                       example: admin@sportlink.com
 *                     admin_username:
 *                       type: string
 *                       description: Admin kullanıcı adı
 *                       example: admin123
 *                     admin_notu:
 *                       type: string
 *                       description: Rapora eklenen admin notu
 *                       example: "Bu kullanıcı uyarılmıştır."
 *                     durum:
 *                       type: string
 *                       description: Raporun durumu
 *                       example: "Çözüldü"
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Rapor bulunamadı
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/admin-info', ReportController.getReportAdminInfo);

/**
 * @swagger
 * /api/reports/{id}:
 *   get:
 *     summary: Rapor detaylarını getir
 *     description: Belirli bir raporun tüm detaylarını getirir.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Rapor ID'si
 *     responses:
 *       200:
 *         description: Rapor detayları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Rapor detayları başarıyla getirildi
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 42
 *                     report_reason:
 *                       type: string
 *                       example: Uygunsuz davranış
 *                     report_date:
 *                       type: string
 *                       format: date-time
 *                     status:
 *                       type: string
 *                       enum: [pending, resolved, rejected]
 *                     admin_notes:
 *                       type: string
 *                       example: Kullanıcı uyarıldı
 *                     reporter:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         username:
 *                           type: string
 *                     reported_user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         username:
 *                           type: string
 *                     event:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         title:
 *                           type: string
 *       400:
 *         description: Geçersiz rapor ID formatı
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Rapor bulunamadı
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', ReportController.getReportDetails);

/**
 * @swagger
 * /api/reports/test:
 *   post:
 *     summary: Test raporu oluştur
 *     description: Test amaçlı yeni bir rapor oluşturur. Bildirim sistemi testleri için kullanılır.
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - reporter_id
 *               - reported_id
 *               - report_reason
 *             properties:
 *               reporter_id:
 *                 type: string
 *                 description: Raporu oluşturan kullanıcının ID'si
 *               reported_id:
 *                 type: string
 *                 description: Raporlanan kullanıcının ID'si
 *               report_reason:
 *                 type: string
 *                 description: Rapor nedeni
 *               event_id:
 *                 type: integer
 *                 description: İlgili etkinliğin ID'si (opsiyonel)
 *               status:
 *                 type: string
 *                 enum: [pending, resolved, rejected]
 *                 default: pending
 *                 description: Rapor durumu (opsiyonel)
 *               admin_notes:
 *                 type: string
 *                 description: Admin notları (opsiyonel)
 *     responses:
 *       201:
 *         description: Test raporu başarıyla oluşturuldu
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
 *                   example: Test rapor başarıyla oluşturuldu
 *                 data:
 *                   type: object
 *                   properties:
 *                     report:
 *                       $ref: '#/components/schemas/Report'
 *       400:
 *         description: Geçersiz veri
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/test', ReportController.createTestReport);

export default router;