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
 */

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'STAFF' | 'USER';
  created_at: string;
  updated_at: string;
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