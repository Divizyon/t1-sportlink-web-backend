import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { getUserDetails, getUserDetailsById } from '../services/userService';

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsers();
    
    res.status(200).json({
      status: 'success',
      results: users.length,
      data: {
        users
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcılar getirilirken bir hata oluştu.'
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.findUserById(id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı getirilirken bir hata oluştu.'
    });
  }
};

/**
 * @swagger
 * /users/details:
 *   get:
 *     summary: Tüm kullanıcıların detaylarını getirir
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Kullanıcı detayları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       500:
 *         description: Sunucu hatası
 */
export const getAllUserDetails = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await userService.getUserDetails();
    res.status(200).json(users);
  } catch (error) {
    console.error('Kullanıcı detayları getirilirken hata oluştu:', error);
    res.status(500).json({ 
      message: 'Kullanıcı detayları getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
};

/**
 * @swagger
 * /users/details/{id}:
 *   get:
 *     summary: Belirli bir kullanıcının detaylarını getirir
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Kullanıcı ID'si
 *     responses:
 *       200:
 *         description: Kullanıcı detayları başarıyla getirildi
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       404:
 *         description: Kullanıcı bulunamadı
 *       500:
 *         description: Sunucu hatası
 */
export const getUserDetailById = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.params.id;
    
    if (!userId) {
      res.status(400).json({ message: 'Geçersiz kullanıcı ID\'si' });
      return;
    }
    
    const user = await userService.getUserDetailsById(userId);
    
    if (!user) {
      res.status(404).json({ message: 'Kullanıcı bulunamadı' });
      return;
    }
    
    res.status(200).json(user);
  } catch (error) {
    console.error('Kullanıcı detayı getirilirken hata oluştu:', error);
    res.status(500).json({ 
      message: 'Kullanıcı detayı getirilirken bir hata oluştu',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata'
    });
  }
}; 