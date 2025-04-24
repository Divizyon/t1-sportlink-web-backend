import { Request, Response } from 'express';
import * as userService from '../services/userService';

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

export const getUserDetails = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userDetails = await userService.getUserDetailsById(id);
    
    if (!userDetails) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }

    res.status(200).json({
      status: 'success',
      data: userDetails
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı detayları getirilirken bir hata oluştu.'
    });
  }
};

export const toggleUserStatusController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ 
        error: 'Yetkilendirme başarısız',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız' 
      });
    }

    const result = await userService.toggleUserStatus(userId, adminId);
    
    return res.status(200).json({
      message: `Kullanıcı durumu ${result.status} olarak güncellendi`,
      data: result
    });

  } catch (error) {
    console.error('Toggle user status error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı durumu güncellenirken bir hata oluştu.'
    });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ 
        error: 'Yetkilendirme başarısız',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız' 
      });
    }

    const result = await userService.deleteUser(userId, adminId);
    
    return res.status(200).json({
      status: 'success',
      message: result.message,
      data: result
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      status: 'error',
      message: error instanceof Error ? error.message : 'Kullanıcı silinirken bir hata oluştu.'
    });
  }
};

/**
 * Kullanıcıya uyarı gönderir
 * @param req Express request objesi
 * @param res Express response objesi
 */
export const sendWarningToUserController = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ error: 'Oturum açmanız gerekiyor' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Uyarı mesajı gereklidir' });
    }

    const result = await userService.sendWarningToUser(userId, adminId, message);

    res.status(200).json({
      message: 'Uyarı başarıyla gönderildi',
      user: result
    });
  } catch (error) {
    console.error('Uyarı gönderme controller hatası:', error);
    res.status(500).json({ error: 'Uyarı gönderilirken bir hata oluştu' });
  }
} 