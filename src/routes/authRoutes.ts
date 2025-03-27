import express from 'express';
import * as AuthController from '../controllers/AuthController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication operations
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account with the provided information
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserDTO'
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               user:
 *                 id: 550e8400-e29b-41d4-a716-446655440000
 *                 email: user@example.com
 *                 first_name: John
 *                 last_name: Doe
 *                 role: user
 *                 created_at: 2023-01-01T00:00:00.000Z
 *                 updated_at: 2023-01-01T00:00:00.000Z
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid input or email already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Email already in use
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/register', AuthController.register);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticate a user and return a JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginDTO'
 *     responses:
 *       200:
 *         description: User successfully logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *             example:
 *               user:
 *                 id: 550e8400-e29b-41d4-a716-446655440000
 *                 email: user@example.com
 *                 first_name: John
 *                 last_name: Doe
 *                 role: user
 *                 created_at: 2023-01-01T00:00:00.000Z
 *                 updated_at: 2023-01-01T00:00:00.000Z
 *               token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               message: Invalid email or password
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /auth/google:
 *   get:
 *     summary: Google OAuth sign-in
 *     description: Redirects the user to Google OAuth sign-in page
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google sign-in page
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/google', AuthController.googleAuthRedirect);

/**
 * @swagger
 * /auth/session/refresh:
 *   get:
 *     summary: Refresh authentication session
 *     description: Refreshes the JWT token for an active session
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Session successfully refreshed
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
 *                     session:
 *                       type: object
 *                       properties:
 *                         access_token:
 *                           type: string
 *                         refresh_token:
 *                           type: string
 *             example:
 *               status: success
 *               data:
 *                 session:
 *                   access_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   refresh_token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/session/refresh', AuthController.refreshSession);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     description: Send a password reset link to the user's email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               status: success
 *               message: Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: error
 *               message: E-posta adresi gereklidir.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/forgot-password', AuthController.requestPasswordReset);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Reset user password with a new one
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordDTO'
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               status: success
 *               message: Şifreniz başarıyla güncellendi.
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: error
 *               message: Yeni şifre gereklidir.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/reset-password', AuthController.resetPassword);

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     description: Resends the account verification email to the user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               status: success
 *               message: Doğrulama e-postası gönderildi.
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *             example:
 *               status: error
 *               message: E-posta adresi gereklidir.
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/resend-verification', AuthController.resendVerificationEmail);

// Protected routes
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user information
 *     description: Retrieve the currently authenticated user's profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *             example:
 *               user:
 *                 id: 550e8400-e29b-41d4-a716-446655440000
 *                 email: user@example.com
 *                 first_name: John
 *                 last_name: Doe
 *                 role: user
 *                 created_at: 2023-01-01T00:00:00.000Z
 *                 updated_at: 2023-01-01T00:00:00.000Z
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/me', protect, AuthController.getCurrentUser);

/**
 * @swagger
 * /auth/logout:
 *   post:
 *     summary: Log out a user
 *     description: Invalidate the user's current session token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User successfully logged out
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               status: success
 *               message: Başarıyla çıkış yapıldı.
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/logout', protect, AuthController.logout);

export default router;