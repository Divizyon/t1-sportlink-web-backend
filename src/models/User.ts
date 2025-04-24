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
 *         role:
 *           type: string
 *           enum: [ADMIN, STAFF, USER]
 *           description: User's role (defaults to 'USER')
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
 *     UpdateUserProfileDTO:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *           description: User's first name
 *         last_name:
 *           type: string
 *           description: User's last name
 *         username:
 *           type: string
 *           description: User's username
 *         phone:
 *           type: string
 *           description: User's phone number
 *         default_location_latitude:
 *           type: number
 *           description: User's default location latitude
 *         default_location_longitude:
 *           type: number
 *           description: User's default location longitude
 *     ChangePasswordDTO:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: User's current password
 *         newPassword:
 *           type: string
 *           format: password
 *           description: User's new password
 */

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'STAFF' | 'USER';
  created_at: string;
  updated_at: string;
  username?: string;
  phone?: string;
  profile_picture?: string;
  default_location_latitude?: number;
  default_location_longitude?: number;
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
}

export interface CreateUserDTO {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: 'ADMIN' | 'STAFF' | 'USER';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateUserProfileDTO {
  first_name?: string;
  last_name?: string;
  username?: string;
  phone?: string;
  default_location_latitude?: number;
  default_location_longitude?: number;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
} 