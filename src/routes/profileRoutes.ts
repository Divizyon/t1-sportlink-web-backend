import express from 'express';
import { changePassword, getProfile, updateProfile, uploadAvatar } from '../controllers/ProfileController';
import { protect } from '../middleware/authMiddleware';
import upload from '../middleware/uploadMiddleware'; // Dosya yükleme middleware'i

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile management
 */

// Tüm profil route'ları için kimlik doğrulama gerekli
router.use(protect);

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data (name, email, phone, avatar)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                   format: email
 *                 phone:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                   format: url
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.get('/', getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *                 description: User's first name
 *               last_name:
 *                 type: string
 *                 description: User's last name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address (use with caution, might require verification)
 *               phone:
 *                 type: string
 *                 description: User's phone number
 *             required:
 *               - first_name
 *               - last_name
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Bad request (e.g., missing required fields)
 *       401:
 *         description: Unauthorized
 */
router.put('/', updateProfile);

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Change user password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 format: password
 *               newPassword:
 *                 type: string
 *                 format: password
 *               confirmNewPassword:
 *                 type: string
 *                 format: password
 *             required:
 *               - currentPassword
 *               - newPassword
 *               - confirmNewPassword
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Bad request (e.g., incorrect current password, passwords don't match, weak new password)
 *       401:
 *         description: Unauthorized
 */
router.put('/password', changePassword);

/**
 * @swagger
 * /api/profile/avatar:
 *   post:
 *     summary: Upload profile avatar
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: The avatar image file to upload (e.g., profile.jpg).
 *             required:
 *               - avatar
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
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
 *                   example: Avatar uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatarUrl:
 *                       type: string
 *                       format: url
 *       400:
 *         description: Bad request (e.g., no file, invalid file type, file too large)
 *       401:
 *         description: Unauthorized
 */
router.post('/avatar', upload.single('avatar'), uploadAvatar); // upload middleware'ini kullanıyoruz

export default router; 