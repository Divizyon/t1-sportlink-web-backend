import express from 'express';
import * as ProfileController from '../controllers/ProfileController';
import { protect } from '../middleware/authMiddleware';
import { uploadAvatar } from '../middleware/uploadMiddleware';

const router = express.Router();

// Tüm profil rotaları için koruma middleware'i
router.use(protect);

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: User profile operations
 */

/**
 * @swagger
 * /api/profile/password:
 *   put:
 *     summary: Update user password
 *     description: Change the authenticated user's password after verifying the current password
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordDTO'
 *     responses:
 *       200:
 *         description: Password successfully updated
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
 *                   example: Şifreniz başarıyla güncellendi.
 *             example:
 *               status: success
 *               message: Şifreniz başarıyla güncellendi.
 *       400:
 *         description: Invalid input - current password incorrect or new password invalid
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Mevcut şifreniz hatalı.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/password', ProfileController.changePassword);

/**
 * @swagger
 * /api/profile/avatar:
 *   post:
 *     summary: Upload profile picture
 *     description: Upload a new profile picture for the authenticated user
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
 *                 description: The image file to upload (max 5MB, JPEG/PNG/WEBP only)
 *     responses:
 *       200:
 *         description: Profile picture successfully updated
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
 *                   example: Profil fotoğrafınız başarıyla güncellendi.
 *                 data:
 *                   type: object
 *                   properties:
 *                     profile_picture:
 *                       type: string
 *                       example: https://example.com/storage/avatars/user_123.jpg
 *             example:
 *               status: success
 *               message: Profil fotoğrafınız başarıyla güncellendi.
 *               data:
 *                 profile_picture: https://example.com/storage/avatars/user_123.jpg
 *       400:
 *         description: Invalid input - no file uploaded or invalid file type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: error
 *                 message:
 *                   type: string
 *                   example: Profil fotoğrafı yüklenmelidir.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/avatar', uploadAvatar, ProfileController.uploadAvatar);

export default router; 