import { Request, Response } from 'express';
import { UnauthorizedError, BadRequestError, NotFoundError } from '../errors/customErrors';
import { handleError } from '../utils/errorHandler';
import { ChangePasswordDTO } from '../models/User';
import * as authService from '../services/authService';
import * as userService from '../services/userService';
import logger from '../utils/logger';
import supabase from '../config/supabase';
import { format } from 'date-fns';

// GET /api/profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }
    const profileData = await userService.getUserProfileById(userId);
    res.status(200).json(profileData);
  } catch (error) {
    handleError(error as Error, res);
  }
};

// PUT /api/profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }
    // Body'den sadece izin verilen alanları al
    const { first_name, last_name, email, phone, bio, gender, birthday_date, address } = req.body;
    
    if (!first_name || !last_name) { // İsim ve soyisim zorunlu
        throw new BadRequestError('First name and last name are required.');
    }
    
    // Tarih formatı kontrolü
    if (birthday_date) {
      const birthdayDateObj = new Date(birthday_date);
      const today = new Date();
      
      // Tarih geçerli mi kontrol et
      if (isNaN(birthdayDateObj.getTime())) {
        throw new BadRequestError('Please enter a valid date format (YYYY-MM-DD).');
      }
      
      // Doğum tarihi gelecekte olamaz
      if (birthdayDateObj > today) {
        throw new BadRequestError('Birth date cannot be a future date.');
      }
    }
    
    const updateData = { 
      first_name, 
      last_name, 
      email, 
      phone,
      bio,
      gender,
      birthday_date,
      address
    };
    
    await userService.updateUserProfileById(userId, updateData);
    
    // Güncellenmiş profil verilerini döndür
    const updatedProfile = await userService.getUserProfileById(userId);
    
    logger.info(`Profile updated for user: ${userId}`);
    res.status(200).json({ 
      status: 'success', 
      message: 'Profile updated successfully',
      data: updatedProfile
    });
  } catch (error) {
    handleError(error as Error, res);
  }
};

// PUT /api/profile/password
/**
 * YAPILAN DEĞİŞİKLİKLER - 6 Mayıs 2024
 * ---------------------------------------
 * 1. Şifre değiştirme endpoint'i güncellendi
 *    - /api/auth/reset-password endpointi yerine bu endpoint kullanılacak
 *    - Mevcut şifre doğrulama kontrolü eklendi
 *    - Supabase Auth entegrasyonu iyileştirildi
 * 
 * 2. Validasyon kontrolleri güçlendirildi
 *    - Şifre uzunluğu kontrolü (en az 6 karakter)
 *    - Şifre eşleşme kontrolü
 *    - Boş alan kontrolü
 * 
 * 3. Hata yönetimi geliştirildi
 *    - Daha açıklayıcı hata mesajları
 *    - Güvenlik odaklı hata yanıtları
 */
export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body;
    
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      throw new BadRequestError('All password fields are required');
    }

    if (newPassword !== confirmNewPassword) {
      throw new BadRequestError('New password and confirmation do not match');
    }
    
    if (newPassword.length < 6) {
      throw new BadRequestError('New password must be at least 6 characters long');
    }

    // First verify the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: req.user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Then change the password
    await authService.changePassword(userId, currentPassword, newPassword);

    logger.info(`Password successfully changed for user: ${userId}`);
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully'
    });
  } catch (error) {
    handleError(error as Error, res);
  }
};

// POST /api/profile/avatar
export const uploadAvatar = async (req: Request, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
          throw new UnauthorizedError('User not authenticated');
        }
        
        const file = req.file;
        if (!file) {
            throw new BadRequestError('Avatar file is required.');
        }

        const avatarUrl = await userService.updateUserAvatar(userId, file);

        logger.info(`Avatar uploaded for user ${userId}: ${avatarUrl}`);
        res.status(200).json({
            status: 'success',
            message: 'Avatar uploaded successfully',
            data: { avatarUrl }
        });

    } catch (error) {
        handleError(error as Error, res);
    }
};

// DELETE /api/profile/avatar
export const deleteAvatar = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('User not authenticated');
    }

    // Varsayılan avatar URL'i
    const defaultAvatarUrl = process.env.DEFAULT_AVATAR_URL || '';

    // Kullanıcının mevcut avatar URL'ini al
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('profile_picture')
      .eq('id', userId)
      .single();

    if (userError) {
      logger.error(`Error getting user data for ID: ${userId}`, userError);
      throw new NotFoundError('User not found');
    }

    // Eğer kullanıcının zaten avatarı yoksa işlem yapmaya gerek yok
    if (!userData.profile_picture || userData.profile_picture === defaultAvatarUrl) {
      return res.status(200).json({
        status: 'success',
        message: 'No avatar to delete'
      });
    }

    // Avatar URL'inden dosya yolunu çıkart
    const fileUrl = userData.profile_picture;
    let filePath = '';

    try {
      // sportlink-files/ ile başlayan kısmı çıkart
      const storageUrl = new URL(fileUrl);
      const pathParts = storageUrl.pathname.split('/');
      
      // Bucket adından sonraki kısmı al
      const bucketIndex = pathParts.findIndex(part => part === 'sportlink-files');
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        filePath = pathParts.slice(bucketIndex + 1).join('/');
      }

      // Eğer filePath doğru şekilde çıkarılamadıysa
      if (!filePath) {
        // Alternatif olarak users/avatars/ klasörü altındaki dosya adını al
        const avatarFileName = fileUrl.split('/').pop();
        if (avatarFileName) {
          filePath = `users/avatars/${avatarFileName}`;
        }
      }
    } catch (error) {
      logger.error(`Error parsing avatar URL: ${fileUrl}`, error);
      // Dosya silinmese bile profil güncellenecek, bu nedenle devam et
    }

    // Eğer dosya yolu çıkarılabildiyse, depolama alanından sil
    if (filePath) {
      const { error: deleteError } = await supabase.storage
        .from('sportlink-files')
        .remove([filePath]);

      if (deleteError) {
        logger.error(`Error deleting avatar from storage: ${filePath}`, deleteError);
        // Dosya silinmese bile profil güncellenecek, bu nedenle devam et
      } else {
        logger.info(`Avatar successfully deleted from storage: ${filePath}`);
      }
    }

    // Kullanıcı profilindeki avatar alanını varsayılan değer veya boş string ile güncelle
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        profile_picture: defaultAvatarUrl,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId);

    if (updateError) {
      logger.error(`Error updating user profile after avatar deletion: ${userId}`, updateError);
      throw new Error('Failed to update profile after avatar deletion');
    }

    logger.info(`Avatar deleted for user ${userId}`);
    res.status(200).json({
      status: 'success',
      message: 'Avatar deleted successfully',
      data: { 
        avatarUrl: defaultAvatarUrl 
      }
    });
  } catch (error) {
    handleError(error as Error, res);
  }
}; 