import { Request, Response } from 'express';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import { SecurityService } from '../services/securityService';
import { ChangePasswordDTO } from '../models/User';

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.userProfile?.id;
    
    if (!userId) {
      return res.status(401).json({
        status: 'error',
        message: 'Oturum açılmamış.'
      });
    }
    
    const { currentPassword, newPassword } = req.body as ChangePasswordDTO;
    
    // Veri doğrulama
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'Mevcut şifre ve yeni şifre gereklidir.'
      });
    }
    
    // Yeni şifre için basit validasyon - en az 6 karakter
    if (newPassword.length < 6) {
      return res.status(400).json({
        status: 'error',
        message: 'Yeni şifre en az 6 karakter olmalıdır.'
      });
    }
    
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // Şifreyi değiştir
    await authService.changePassword(userId, currentPassword, newPassword);
    
    // Başarılı şifre değiştirme işlemini logla
    try {
      await SecurityService.createLog({
        type: 'user_update',
        admin: req.userProfile?.email || 'Bilinmeyen',
        ip,
        status: 'success',
        action: `Şifre güncelleme / ${req.userProfile?.email}`
      });
    } catch (logError) {
      console.error('Password change security log error:', logError);
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Şifreniz başarıyla güncellendi.'
    });
  } catch (error) {
    console.error('Change password error:', error);
    
    // IP adresini al
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    
    // Başarısız şifre değiştirme işlemini logla
    try {
      await SecurityService.createLog({
        type: 'user_update',
        admin: req.userProfile?.email || 'Bilinmeyen',
        ip,
        status: 'error',
        action: `Şifre güncelleme başarısız`
      });
    } catch (logError) {
      console.error('Password change security log error:', logError);
    }
    
    // Hata mesajını belirle - özel hata mesajı varsa kullan
    let errorMessage = 'Şifre güncellenirken bir hata oluştu.';
    if (error instanceof Error) {
      if (error.message.includes('Mevcut şifre hatalı')) {
        return res.status(400).json({
          status: 'error',
          message: 'Mevcut şifreniz hatalı.'
        });
      }
      errorMessage = error.message;
    }
    
    res.status(500).json({
      status: 'error',
      message: errorMessage
    });
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