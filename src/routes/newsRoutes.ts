import { Router } from 'express';
import multer from 'multer';
import { NewsController } from '../controllers/NewsController';
import { protect } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/adminCheckMiddleware';
import logger from '../utils/logger';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      logger.warn(`Geçersiz dosya türü yüklendi: ${file.mimetype}, fieldname=${file.fieldname}`);
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});

/**
 * @swagger
 * /api/news:
 *   post:
 *     summary: Create a new news item or announcement (Admin Only)
 *     tags: [News]
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
 *               - sport_id
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the news item.
 *                 example: "Yeni Turnuva Duyurusu"
 *               content:
 *                 type: string
 *                 description: The main content/body of the news item.
 *                 example: "Detaylar çok yakında..."
 *               sport_id:
 *                 type: integer
 *                 description: The ID of the sport category this news belongs to.
 *                 example: 4
 *               type:
 *                 type: string
 *                 description: Type of the news item (manual, auto, etc.).
 *                 default: manual
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: End date/time when the news item should expire.
 *                 example: "2025-12-31T23:59:59Z"
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file for the news item.
 *     responses:
 *       '201':
 *         description: News item created successfully.
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
 *                   example: Haber başarıyla oluşturuldu.
 *                 data:
 *                   $ref: '#/components/schemas/NewsItem'
 *       '400':
 *         description: Bad Request - Missing required fields or invalid input.
 *       '401':
 *         description: Unauthorized - User not logged in.
 *       '403':
 *         description: Forbidden - User is not an admin.
 *       '500':
 *         description: Internal Server Error.
 */
router.post(
  '/',
  protect,
  isAdmin,
  upload.single('image'),
  NewsController.createNews
);

/**
 * @swagger
 * /api/news:
 *   get:
 *     summary: Get all news items with optional filtering
 *     tags: [News]
 *     parameters:
 *       - in: query
 *         name: sport_id
 *         schema:
 *           type: integer
 *         description: Filter news by sport category ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of news items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Offset for pagination
 *     responses:
 *       '200':
 *         description: List of news items.
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
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/NewsItem'
 *                     count:
 *                       type: integer
 *                       description: Total count of news items matching the filter
 *       '500':
 *         description: Internal Server Error.
 */
router.get('/', NewsController.getNews);

/**
 * @swagger
 * /api/news/{id}:
 *   get:
 *     summary: Get a specific news item by ID
 *     tags: [News]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: News item ID
 *     responses:
 *       '200':
 *         description: News item found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   $ref: '#/components/schemas/NewsItem'
 *       '404':
 *         description: News item not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.get('/:id', NewsController.getNews);

/**
 * @swagger
 * /api/news/{id}:
 *   put:
 *     summary: Update a news item (Admin Only)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: News item ID to update
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: New title for the news item
 *               content:
 *                 type: string
 *                 description: New content for the news item
 *               sport_id:
 *                 type: integer
 *                 description: New sport category ID
 *               type:
 *                 type: string
 *                 description: New type for the news item (manual, auto, etc.)
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 description: New end date/time when the news item should expire
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: New image file
 *     responses:
 *       '200':
 *         description: News item updated successfully.
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
 *                   example: Haber başarıyla güncellendi.
 *                 data:
 *                   $ref: '#/components/schemas/NewsItem'
 *       '400':
 *         description: Bad Request - Invalid input or no fields to update.
 *       '401':
 *         description: Unauthorized - User not logged in.
 *       '403':
 *         description: Forbidden - User is not an admin.
 *       '404':
 *         description: News item not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.put(
  '/:id',
  protect,
  isAdmin,
  upload.single('image'),
  NewsController.updateNews
);

/**
 * @swagger
 * /api/news/{id}:
 *   delete:
 *     summary: Delete a news item (Admin Only)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: News item ID to delete
 *     responses:
 *       '200':
 *         description: News item deleted successfully.
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
 *                   example: Haber başarıyla silindi.
 *       '401':
 *         description: Unauthorized - User not logged in.
 *       '403':
 *         description: Forbidden - User is not an admin.
 *       '404':
 *         description: News item not found.
 *       '500':
 *         description: Internal Server Error.
 */
router.delete(
  '/:id',
  protect,
  isAdmin,
  NewsController.deleteNews
);

/**
 * @swagger
 * components:
 *   schemas:
 *     NewsItem:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Unique identifier for the news item
 *         title:
 *           type: string
 *           description: Title of the news item
 *         content:
 *           type: string
 *           description: Main content of the news item
 *         source_url:
 *           type: string
 *           description: Original source URL if the news is from external source
 *         image_url:
 *           type: string
 *           description: URL to the news image
 *         published_date:
 *           type: string
 *           format: date-time
 *           description: Date when the news was published
 *         sport_id:
 *           type: integer
 *           description: ID of the sport category this news belongs to
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update timestamp
 *         type:
 *           type: string
 *           description: Type of the news item (manual, auto, etc.)
 *         end_time:
 *           type: string
 *           format: date-time
 *           description: End date/time when the news item should expire
 *         Sports:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               description: Name of the sport category
 *             icon:
 *               type: string
 *               description: Icon URL of the sport category
 */

export default router; 