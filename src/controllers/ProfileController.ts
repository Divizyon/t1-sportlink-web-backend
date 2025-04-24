import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { SecurityService } from '../services/securityService';
import { ChangePasswordDTO } from '../models/User';
import { UnauthorizedError, BadRequestError } from '../errors/customErrors';
import logger from '../utils/logger';
import { handleError } from '../utils/errorHandler';

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    // Validate password requirements
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestError('New password must be at least 8 characters long');
    }

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestError('New password and confirmation do not match');
    }

    await authService.changePassword(userId, currentPassword, newPassword);
    
    logger.info(`Password successfully changed for user: ${userId}`);
    res.status(200).json({ message: 'Password changed successfully' });
  } catch (error: unknown) {
    handleError(error as Error, req, res, next);
  }
};

export const uploadAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.userProfile?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Oturum açılmamış.'
      });
    }
    
    // Dosya yüklenmiş mi kontrol et
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Profil fotoğrafı yüklenmelidir.'
      });
    }
    
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // Avatar yükle
    const updatedUser = await userService.uploadAvatar(userId, req.file);
    
    if (!updatedUser) {
      return res.status(500).json({
        status: 'error',
        message: 'Profil fotoğrafı güncellenemedi.'
      });
    }
    
    // Başarılı avatar yükleme işlemini logla
    try {
      await SecurityService.createLog({
        type: 'user_update',
        admin: `${updatedUser.first_name} ${updatedUser.last_name}`,
        ip,
        status: 'success',
        action: `Avatar güncelleme / ${updatedUser.email}`
      });
    } catch (logError) {
      console.error('Avatar upload security log error:', logError);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Profil fotoğrafınız başarıyla güncellendi.',
      data: {
        profile_picture: updatedUser.profile_picture
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // Başarısız avatar yükleme işlemini logla
    try {
      await SecurityService.createLog({
        type: 'user_update',
        admin: req.userProfile?.email || 'Bilinmeyen',
        ip,
        status: 'error',
        action: `Avatar güncelleme başarısız`
      });
    } catch (logError) {
      console.error('Avatar upload security log error:', logError);
    }
    
    // Hata mesajını belirle
    let errorMessage = 'Profil fotoğrafı yüklenirken bir hata oluştu.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
  }
}; 