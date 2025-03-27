import express, { Request, Response } from 'express';
import * as UserController from '../controllers/UserController';
import { protect, restrictTo } from '../middleware/authMiddleware';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management operations
 */

// All user routes are protected
router.use(protect);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users. Only accessible to administrators.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *             example:
 *               users:
 *                 - id: 550e8400-e29b-41d4-a716-446655440000
 *                   email: admin@example.com
 *                   first_name: Admin
 *                   last_name: User
 *                   role: admin
 *                   created_at: 2023-01-01T00:00:00.000Z
 *                   updated_at: 2023-01-01T00:00:00.000Z
 *                 - id: 550e8400-e29b-41d4-a716-446655440001
 *                   email: user@example.com
 *                   first_name: John
 *                   last_name: Doe
 *                   role: user
 *                   created_at: 2023-01-02T00:00:00.000Z
 *                   updated_at: 2023-01-02T00:00:00.000Z
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', restrictTo('admin'), UserController.getAllUsers);

/**
 * @swagger
 * /users/test:
 *   get:
 *     summary: Test API route
 *     description: Simple test endpoint to verify the API and Swagger documentation are working correctly.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test successful
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
 *                   example: API test successful
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: 2023-01-01T00:00:00.000Z
 *             example:
 *               status: success
 *               message: API test successful
 *               timestamp: 2023-01-01T00:00:00.000Z
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/test', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'API test successful',
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     description: Retrieve detailed information about a specific user. Users can only access their own profile, while admins can access any profile.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the user
 *         example: 550e8400-e29b-41d4-a716-446655440000
 *     responses:
 *       200:
 *         description: User details retrieved successfully
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
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', UserController.getUserById);

export default router;