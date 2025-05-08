import express from 'express';
import * as announcementController from '../controllers/AnnouncementController';
import { param, query, validationResult } from 'express-validator';
import { StatusCodes } from 'http-status-codes';

const router = express.Router();

// Validate middleware
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

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     tags: [Announcements]
 *     summary: List all announcements
 *     description: Get all announcements in the system
 *     responses:
 *       200:
 *         description: Announcements listed successfully
 *       500:
 *         description: Server error
 */
router.get('/', announcementController.getAllAnnouncements);

/**
 * @swagger
 * /api/announcements/latest:
 *   get:
 *     summary: Get latest announcements
 *     tags: [Announcements]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of announcements to retrieve
 *     responses:
 *       200:
 *         description: Latest announcements retrieved successfully
 *       400:
 *         description: Invalid request parameters
 *       500:
 *         description: Server error
 */
router.get(
  '/latest',
  [
    query('limit')
      .optional()
      .isInt({ min: 1, max: 50 })
      .withMessage('Limit must be a number between 1-50')
  ],
  validate,
  announcementController.getLatestAnnouncements
);

/**
 * @swagger
 * /api/announcements/{id}:
 *   get:
 *     tags: [Announcements]
 *     summary: Get announcement by ID
 *     description: Get announcement details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement retrieved successfully
 *       404:
 *         description: Announcement not found
 *       500:
 *         description: Server error
 */
router.get('/:id', announcementController.getAnnouncementById);

export default router; 