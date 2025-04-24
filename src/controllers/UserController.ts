import { Request, Response } from 'express';
import * as userService from '../services/userService';
import { SecurityService } from '../services/securityService';
import { UpdateUserProfileDTO } from '../models/User';

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
    const userDetails = await userService.getUserDetails();
    
    res.status(200).json({
      status: 'success',
      results: userDetails.length,
      data: {
        USER_DETAILS: userDetails
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı detayları getirilirken bir hata oluştu.'
    });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userProfile?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Oturum açılmamış.'
      });
    }
    
    const user = await userService.findUserById(userId);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı profili bulunamadı.'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        profile: user
      }
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcı profili getirilirken bir hata oluştu.'
    });
  }
};

export const updateUserProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.userProfile?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Oturum açılmamış.'
      });
    }
    
    const userData: UpdateUserProfileDTO = req.body;
    
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // Kullanıcı bilgilerini güncelle
    const updatedUser = await userService.updateUserProfile(userId, userData);
    
    if (!updatedUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }
    
    // Başarılı profil güncelleme işlemini logla
    try {
      await SecurityService.createLog({
        type: 'user_update',
        admin: `${updatedUser.first_name} ${updatedUser.last_name}`,
        ip,
        status: 'success',
        action: `Profil güncelleme / ${updatedUser.email}`
      });
    } catch (logError) {
      console.error('Profile update security log error:', logError);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Profil başarıyla güncellendi.',
      data: {
        user: updatedUser
      }
    });
  } catch (error) {
    console.error('Update user profile error:', error);
    
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // Başarısız profil güncelleme işlemini logla
    try {
      await SecurityService.createLog({
        type: 'user_update',
        admin: req.userProfile?.email || 'Bilinmeyen',
        ip,
        status: 'error',
        action: `Profil güncelleme başarısız`
      });
    } catch (logError) {
      console.error('Profile update security log error:', logError);
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Profil güncellenirken bir hata oluştu.'
    });
  }
}; 