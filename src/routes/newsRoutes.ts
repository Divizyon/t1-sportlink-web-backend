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

export default router; 