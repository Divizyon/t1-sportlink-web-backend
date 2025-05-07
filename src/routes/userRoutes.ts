import express from 'express';
import { 
  getAllUsers, 
  getUserById, 
  getUserDetails,
  toggleUserStatusController,
  deleteUserController,
  sendWarningToUserController,
  toggleUserWatch,
  getUsersByRoleController
} from '../controllers/UserController';
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
 * /api/users:
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
router.get('/', restrictTo('ADMIN'), getAllUsers);

/**
 * @swagger
 * /api/users/{id}/details:
 *   get:
 *     summary: Get detailed user information
 *     description: Retrieve detailed information about a specific user including their events, favorite categories, and more.
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
 *     responses:
 *       200:
 *         description: Detailed user information retrieved successfully
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
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     username:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                       format: email
 *                     role:
 *                       type: string
 *                     status:
 *                       type: string
 *                     is_watched:
 *                       type: boolean
 *                     watched_since:
 *                       type: string
 *                       nullable: true
 *                     joinDate:
 *                       type: string
 *                       format: date
 *                     avatar:
 *                       type: string
 *                     profile_picture:
 *                       type: string
 *                     registeredDate:
 *                       type: string
 *                       format: date
 *                     lastActive:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                     birthday_date:
 *                       type: string
 *                       format: date
 *                       description: User's birthday date
 *                     address:
 *                       type: string
 *                     bio:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     eventCount:
 *                       type: integer
 *                     completedEvents:
 *                       type: integer
 *                     favoriteCategories:
 *                       type: array
 *                       items:
 *                         type: string
 *                     events:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                           title:
 *                             type: string
 *                           date:
 *                             type: string
 *                             format: date-time
 *                           status:
 *                             type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/details', protect, getUserDetails);

/**
 * @swagger
 * /api/users/{id}:
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
router.get('/:id', protect, getUserById);

/**
 * @swagger
 * /api/users/{userId}/toggle-status:
 *   patch:
 *     summary: Kullanıcı durumunu değiştir (aktif/inaktif)
 *     description: Bir kullanıcının durumunu aktif veya inaktif olarak değiştirir. Sadece admin kullanıcıları bu işlemi yapabilir.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Durumu değiştirilecek kullanıcının ID'si
 *         example: 1876bf9e-892b-4106-a398-3afbf87c90e0
 *     responses:
 *       200:
 *         description: Kullanıcı durumu başarıyla değiştirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Kullanıcı durumu inactive olarak güncellendi
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [active, inactive]
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Yetkilendirme hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Bu işlem için admin yetkisine sahip olmalısınız
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.patch('/:userId/toggle-status', protect, restrictTo('ADMIN'), toggleUserStatusController);

/**
 * @swagger
 * /api/users/{userId}:
 *   delete:
 *     summary: Kullanıcıyı sil
 *     description: Belirtilen kullanıcıyı ve ilişkili tüm kayıtlarını siler. Sadece admin kullanıcıları bu işlemi yapabilir.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Silinecek kullanıcının ID'si
 *     responses:
 *       200:
 *         description: Kullanıcı başarıyla silindi
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
 *                   example: Kullanıcı ve ilişkili tüm kayıtları başarıyla silindi
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                     message:
 *                       type: string
 *                     deletedUser:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                         email:
 *                           type: string
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         description: Yetkilendirme hatası
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Bu işlem için admin yetkisine sahip olmalısınız
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete('/:userId', protect, restrictTo('ADMIN'), deleteUserController);

/**
 * @swagger
 * /api/users/{userId}/warning:
 *   post:
 *     tags: [Users]
 *     summary: Kullanıcıya uyarı gönder
 *     description: Belirtilen kullanıcıya uyarı gönderir. Sadece admin kullanıcıları bu işlemi yapabilir.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Uyarı gönderilecek kullanıcının ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [message]
 *             properties:
 *               message:
 *                 type: string
 *                 description: Kullanıcıya gönderilecek uyarı mesajı
 *           example:
 *             message: "Lütfen etkinliklere zamanında katılım gösteriniz."
 *     responses:
 *       200:
 *         description: Uyarı başarıyla gönderildi
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
 *                   example: "Uyarı başarıyla gönderildi"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     email:
 *                       type: string
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *       400:
 *         description: Geçersiz istek
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
 *                   example: "Uyarı mesajı gereklidir"
 *       401:
 *         description: Yetkilendirme hatası
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
 *                   example: "Bu işlemi gerçekleştirmek için giriş yapmalısınız."
 *       403:
 *         description: Yetki hatası
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
 *                   example: "Bu işlemi gerçekleştirmek için admin yetkisi gerekiyor."
 *       404:
 *         description: Kullanıcı bulunamadı
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
 *                   example: "Belirtilen kullanıcı bulunamadı"
 *       500:
 *         description: Sunucu hatası
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
 *                   example: "Bir hata oluştu. Lütfen daha sonra tekrar deneyin."
 */
router.post('/:userId/warning', protect, restrictTo('ADMIN'), sendWarningToUserController);

/**
 * @swagger
 * /api/users/{userId}/watch:
 *   put:
 *     summary: İzleme durumunu değiştir
 *     description: Bir kullanıcıyı izlemeye alma veya izlemeden çıkarma. Sadece adminler kullanabilir.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: İzlenecek/izlemeden çıkarılacak kullanıcının ID'si
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - watch
 *             properties:
 *               watch:
 *                 type: boolean
 *                 description: true = izlemeye al, false = izlemeden çıkar
 *           example:
 *             watch: true
 *     responses:
 *       200:
 *         description: İşlem başarılı
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
 *                   example: Kullanıcı başarıyla izlemeye alındı
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     isWatched:
 *                       type: boolean
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                     updatedBy:
 *                       type: string
 *                       format: uuid
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put('/:userId/watch', restrictTo('ADMIN'), toggleUserWatch);

/**
 * @swagger
 * /api/users/role/user:
 *   get:
 *     summary: USER rolündeki kullanıcıları listele
 *     description: Sadece USER rolüne sahip kullanıcıları sayfalandırılmış olarak getirir
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Listelenmek istenen sayfa numarası
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Sayfa başına gösterilecek kullanıcı sayısı
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [mixed, new, active]
 *           default: mixed
 *         description: Sıralama türü - mixed (karışık), new (yeni kayıtlı), active (aktif kullanıcılar)
 *     responses:
 *       200:
 *         description: Kullanıcılar başarıyla listelendi
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
 *                     users:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           email:
 *                             type: string
 *                           first_name:
 *                             type: string
 *                           last_name:
 *                             type: string
 *                           role:
 *                             type: string
 *                           event_count:
 *                             type: integer
 *                             description: Kullanıcının katıldığı etkinlik sayısı (sadece mixed sıralamada)
 *                     meta:
 *                       type: object
 *                       properties:
 *                         totalCount:
 *                           type: integer
 *                           description: Toplam kullanıcı sayısı
 *                         page:
 *                           type: integer
 *                           description: Mevcut sayfa
 *                         limit:
 *                           type: integer
 *                           description: Sayfa başına kullanıcı sayısı
 *                         totalPages:
 *                           type: integer
 *                           description: Toplam sayfa sayısı
 *                         sortBy:
 *                           type: string
 *                           description: Kullanılan sıralama türü
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/role/user', getUsersByRoleController);

export default router;