import { Router } from 'express';
import { UserNewsController } from '../controllers/UserNewsController';

const router = Router();

/**
 * @swagger
 * /api/user-news:
 *   get:
 *     summary: Tüm haberleri görüntüle
 *     tags: [UserNews]
 *     parameters:
 *       - in: query
 *         name: sport_id
 *         schema:
 *           type: integer
 *         description: Spor kategorisine göre filtrele
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Sayfa başına haber sayısı
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Sayfalama için kaçıncı haberden başlanacağı
 *     responses:
 *       '200':
 *         description: Haberler başarıyla getirildi
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
 *                     $ref: '#/components/schemas/NewsItem'
 *                 count:
 *                   type: integer
 *                   example: 20
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       '500':
 *         description: Sunucu hatası
 */
router.get('/', UserNewsController.getAllNews);

/**
 * @swagger
 * /api/user-news/latest:
 *   get:
 *     summary: En son eklenen haberleri getir
 *     tags: [UserNews]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Kaç haber getirileceği
 *     responses:
 *       '200':
 *         description: En son haberler başarıyla getirildi
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
 *                     $ref: '#/components/schemas/NewsItem'
 *       '500':
 *         description: Sunucu hatası
 */
router.get('/latest', UserNewsController.getLatestNews);

/**
 * @swagger
 * /api/user-news/sport/{sportId}:
 *   get:
 *     summary: Bir spor kategorisine ait haberleri getir
 *     tags: [UserNews]
 *     parameters:
 *       - in: path
 *         name: sportId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Spor kategorisi ID'si
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Kaç haber getirileceği
 *     responses:
 *       '200':
 *         description: Spor kategorisine ait haberler başarıyla getirildi
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
 *                     $ref: '#/components/schemas/NewsItem'
 *                 count:
 *                   type: integer
 *                   example: 10
 *       '400':
 *         description: Geçersiz spor kategorisi ID'si
 *       '500':
 *         description: Sunucu hatası
 */
router.get('/sport/:sportId', UserNewsController.getNewsBySportId);

/**
 * @swagger
 * /api/user-news/{id}:
 *   get:
 *     summary: ID'ye göre haber detaylarını getir
 *     tags: [UserNews]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Haber ID'si
 *     responses:
 *       '200':
 *         description: Haber başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/NewsItem'
 *       '400':
 *         description: Geçersiz haber ID'si
 *       '404':
 *         description: Haber bulunamadı
 *       '500':
 *         description: Sunucu hatası
 */
router.get('/:id', UserNewsController.getNewsById);

export default router; 