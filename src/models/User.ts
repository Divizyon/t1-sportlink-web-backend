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
 *         - role
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Kullanıcı kimliği
 *         email:
 *           type: string
 *           format: email
 *           description: E-posta adresi
 *         first_name:
 *           type: string
 *           description: Ad
 *         last_name:
 *           type: string
 *           description: Soyad
 *         phone_number:
 *           type: string
 *           description: Telefon numarası
 *         role:
 *           type: string
 *           description: Kullanıcı rolü (admin, user, coach)
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Oluşturulma tarihi
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Güncellenme tarihi
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
 *           description: E-posta adresi
 *         password:
 *           type: string
 *           format: password
 *           description: Şifre
 *         first_name:
 *           type: string
 *           description: Ad
 *         last_name:
 *           type: string
 *           description: Soyad
 *         phone_number:
 *           type: string
 *           description: Telefon numarası
 *         role:
 *           type: string
 *           description: Kullanıcı rolü (varsayılan olarak 'user')
 *     LoginDTO:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: E-posta adresi
 *         password:
 *           type: string
 *           format: password
 *           description: Şifre
 */

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: string;
  created_at: string;
  updated_at: string;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
} 