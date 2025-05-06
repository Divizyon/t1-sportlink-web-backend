/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - first_name
 *         - last_name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: User's unique identifier
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         first_name:
 *           type: string
 *           description: User's first name
 *         last_name:
 *           type: string
 *           description: User's last name
 *         role:
 *           type: string
 *           enum: [ADMIN, STAFF, USER]
 *           description: User's role
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp of when user was created
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Timestamp of last update
 *         birthday_date:
 *           type: string
 *           format: date
 *           description: User's birthday date
 *     UserDetail:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *         - role
 *         - status
 *         - joinDate
 *       properties:
 *         id:
 *           type: integer
 *           description: User's unique identifier
 *         name:
 *           type: string
 *           description: User's full name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         role:
 *           type: string
 *           description: User's role in Turkish (e.g. üye, admin)
 *         status:
 *           type: string
 *           description: User's account status (e.g. aktif, pasif)
 *         joinDate:
 *           type: string
 *           format: date
 *           description: Date when user joined
 *         avatar:
 *           type: string
 *           description: Path to user's avatar image
 *         registeredDate:
 *           type: string
 *           format: date
 *           description: Date when user registered
 *         lastActive:
 *           type: string
 *           format: date
 *           description: Date when user was last active
 *         birthday_date:
 *           type: string
 *           format: date
 *           description: User's birthday date
 *     CreateUserDTO:
 *       type: object
 *       required:
 *         - email
 *         - password
 *         - first_name
 *         - last_name
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         first_name:
 *           type: string
 *           description: User's first name
 *         last_name:
 *           type: string
 *           description: User's last name
 *         password_confirm:
 *           type: string
 *           format: password
 *           description: User's password confirmation
 *         birthday_date:
 *           type: string
 *           format: date
 *           description: User's birthday date
 *     LoginDTO:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 */

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'STAFF' | 'USER';
  created_at: string;
  updated_at: string;
  birthday_date?: string;
}

export interface UserDetail {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  joinDate: string;
  avatar?: string;
  registeredDate: string;
  lastActive: string;
  birthday_date: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  password_confirm?: string;
  first_name: string;
  last_name: string;
  birthday_date?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
} 