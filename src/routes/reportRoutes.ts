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

export default router; 