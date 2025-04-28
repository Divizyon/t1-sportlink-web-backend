import { Router } from 'express';
import { SportsController } from '../controllers/SportsController';
// Gerekirse authentication/authorization middleware eklenebilir
// import { protect, authorize } from '../middleware/authMiddleware';

const router = Router();

/**
 * @swagger
 * /api/sports:
 *   get:
 *     summary: Tüm spor türlerini getir
 *     description: Sistemdeki tüm spor türlerini listeler
 *     tags: [Sports]
 *     responses:
 *       200:
 *         description: Spor türleri başarıyla getirildi
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
 *                     sports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             format: uuid
 *                           name:
 *                             type: string
 *                           type:
 *                             type: string
 *                           description:
 *                             type: string
 *       500:
 *         description: Sunucu hatası
 */
router.get('/', SportsController.getAllSports);

export default router; 