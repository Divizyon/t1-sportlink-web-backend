import express from 'express';
import * as ReportController from '../controllers/ReportController';
import { protect, restrictTo } from '../middleware/authMiddleware';

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
router.get('/', ReportController.getAllReports);

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

export default router; 