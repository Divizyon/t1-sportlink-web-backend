import express from 'express';
import multer from 'multer';
import { AnnouncementController } from '../controllers/AnnouncementController';
import { protect } from '../middleware/authMiddleware';
import { isAdmin } from '../middleware/adminCheckMiddleware';

const router = express.Router();

// Configure multer for memory storage (needed for Supabase storage upload)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

/**
 * @swagger
 * /api/announcements:
 *   post:
 *     summary: Create a new announcement
 *     description: Create a new announcement with optional image upload. Admin access required.
 *     tags: [Announcements]
 *     security:
 *       - bearerAuth: []
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - content
 *             properties:
 *               title:
 *                 type: string
 *                 description: Announcement title
 *               content:
 *                 type: string
 *                 description: Announcement content
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Optional image file
 *               imageUrl:
 *                 type: string
 *                 description: Optional image URL
 *     responses:
 *       201:
 *         description: Announcement created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin access required
 */
router.post(
  '/',
  protect, // Authenticate user
  isAdmin, // Ensure user has admin access
  upload.single('image'), // Handle image upload
  AnnouncementController.createAnnouncement
);

/**
 * @swagger
 * /api/announcements:
 *   get:
 *     summary: Get all announcements
 *     description: Retrieve a list of all announcements
 *     tags: [Announcements]
 *     responses:
 *       200:
 *         description: List of announcements
 */
router.get('/', AnnouncementController.getAnnouncements);

/**
 * @swagger
 * /api/announcements/{id}:
 *   get:
 *     summary: Get a specific announcement
 *     description: Retrieve an announcement by its ID
 *     tags: [Announcements]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Announcement ID
 *     responses:
 *       200:
 *         description: Announcement details
 *       404:
 *         description: Announcement not found
 */
router.get('/:id', AnnouncementController.getAnnouncementById);

export default router;