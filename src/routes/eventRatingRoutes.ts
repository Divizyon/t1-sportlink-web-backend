import express from 'express';
import eventRatingController from '../controllers/EventRatingController';
import { protect } from '../middleware/authMiddleware';
import { rateLimit } from 'express-rate-limit';
import { body, param, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

// Validate middleware inline
const validate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      errors: errors.array(),
      message: 'Validation failed'
    });
  }
  
  next();
};

// Rate limiter for rating creation to prevent spam
const createRatingLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 requests per window
  message: 'Çok fazla yorum gönderimi yaptınız, lütfen 5 dakika sonra tekrar deneyin'
});

const router = express.Router();

/**
 * @swagger
 * /event-ratings/{eventId}/ratings:
 *   get:
 *     summary: Etkinliğin tüm yorumlarını getir
 *     tags: [Event Ratings]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Etkinlik ID
 *     responses:
 *       200:
 *         description: Etkinlik yorumları başarıyla getirildi
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
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       event_id:
 *                         type: integer
 *                       user_id:
 *                         type: string
 *                       rating:
 *                         type: integer
 *                         nullable: true
 *                       review:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       users:
 *                         type: object
 *                         properties:
 *                           full_name:
 *                             type: string
 *                           profile_picture:
 *                             type: string
 *                             nullable: true
 *       400:
 *         description: Geçersiz etkinlik ID
 *       500:
 *         description: Sunucu hatası
 */
router.get(
  '/:eventId/ratings',
  [
    param('eventId').isInt().withMessage('Geçersiz etkinlik ID')
  ],
  validate,
  eventRatingController.getEventRatings
);

/**
 * @swagger
 * /event-ratings/{eventId}/my-rating:
 *   get:
 *     summary: Kullanıcının belirli bir etkinliğe yaptığı yorumu getir
 *     tags: [Event Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Etkinlik ID
 *     responses:
 *       200:
 *         description: Kullanıcı yorumu başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     id:
 *                       type: integer
 *                     event_id:
 *                       type: integer
 *                     user_id:
 *                       type: string
 *                     rating:
 *                       type: integer
 *                       nullable: true
 *                     review:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Geçersiz etkinlik ID
 *       401:
 *         description: Yetkisiz erişim
 *       500:
 *         description: Sunucu hatası
 */
router.get(
  '/:eventId/my-rating',
  [
    param('eventId').isInt().withMessage('Geçersiz etkinlik ID')
  ],
  validate,
  protect,
  eventRatingController.getUserRatingForEvent
);

/**
 * @swagger
 * /event-ratings/{eventId}/ratings:
 *   post:
 *     summary: Yeni yorum/puanlama ekle
 *     tags: [Event Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Etkinlik ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - review
 *             properties:
 *               review:
 *                 type: string
 *                 description: Yorum metni
 *                 minLength: 2
 *                 maxLength: 1000
 *               rating:
 *                 type: integer
 *                 description: Puanlama (1-5 arası, COMPLETED etkinlikler için zorunlu)
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       201:
 *         description: Yorum başarıyla eklendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     event_id:
 *                       type: integer
 *                     user_id:
 *                       type: string
 *                     rating:
 *                       type: integer
 *                       nullable: true
 *                     review:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Yorum başarıyla eklendi
 *       400:
 *         description: Geçersiz istek veya doğrulama hatası
 *       401:
 *         description: Yetkisiz erişim
 *       429:
 *         description: Çok fazla istek gönderildi
 */
router.post(
  '/:eventId/ratings',
  [
    param('eventId').isInt().withMessage('Geçersiz etkinlik ID'),
    body('review')
      .notEmpty()
      .withMessage('Yorum alanı zorunludur')
      .isString()
      .withMessage('Yorum bir metin olmalıdır')
      .isLength({ min: 2, max: 1000 })
      .withMessage('Yorum 2-1000 karakter arasında olmalıdır'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Puanlama 1-5 arasında bir tamsayı olmalıdır')
  ],
  validate,
  protect,
  createRatingLimiter,
  eventRatingController.addRating
);

/**
 * @swagger
 * /event-ratings/rating/{ratingId}:
 *   put:
 *     summary: Yorumu güncelle
 *     tags: [Event Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yorum ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - review
 *             properties:
 *               review:
 *                 type: string
 *                 description: Yorum metni
 *                 minLength: 2
 *                 maxLength: 1000
 *               rating:
 *                 type: integer
 *                 description: Puanlama (1-5 arası, COMPLETED etkinlikler için zorunlu)
 *                 minimum: 1
 *                 maximum: 5
 *     responses:
 *       200:
 *         description: Yorum başarıyla güncellendi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     event_id:
 *                       type: integer
 *                     user_id:
 *                       type: string
 *                     rating:
 *                       type: integer
 *                       nullable: true
 *                     review:
 *                       type: string
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                 message:
 *                   type: string
 *                   example: Yorum başarıyla güncellendi
 *       400:
 *         description: Geçersiz istek veya doğrulama hatası
 *       401:
 *         description: Yetkisiz erişim
 */
router.put(
  '/rating/:ratingId',
  [
    param('ratingId').isInt().withMessage('Geçersiz yorum ID'),
    body('review')
      .notEmpty()
      .withMessage('Yorum alanı zorunludur')
      .isString()
      .withMessage('Yorum bir metin olmalıdır')
      .isLength({ min: 2, max: 1000 })
      .withMessage('Yorum 2-1000 karakter arasında olmalıdır'),
    body('rating')
      .optional()
      .isInt({ min: 1, max: 5 })
      .withMessage('Puanlama 1-5 arasında bir tamsayı olmalıdır')
  ],
  validate,
  protect,
  eventRatingController.updateRating
);

/**
 * @swagger
 * /event-ratings/rating/{ratingId}:
 *   delete:
 *     summary: Yorumu sil
 *     tags: [Event Ratings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ratingId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Yorum ID
 *     responses:
 *       200:
 *         description: Yorum başarıyla silindi
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
 *                   example: Yorum başarıyla silindi
 *       400:
 *         description: Geçersiz istek veya doğrulama hatası
 *       401:
 *         description: Yetkisiz erişim
 */
router.delete(
  '/rating/:ratingId',
  [
    param('ratingId').isInt().withMessage('Geçersiz yorum ID')
  ],
  validate,
  protect,
  eventRatingController.deleteRating
);

export default router; 