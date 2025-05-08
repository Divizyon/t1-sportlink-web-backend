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

/**
 * Kullanıcının favori sporlarını getiren controller fonksiyonu
 * GET /api/profile/sports
 */
export const getUserSports = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('Kullanıcı kimliği doğrulanamadı');
    }

    // Kullanıcının spor verilerini ve ilişkili spor detaylarını çek
    const { data: sportsData, error } = await supabase
      .from('User_Sports')
      .select(`
        sport_id,
        sport:Sports (
          id,
          name,
          description,
          icon
        )
      `)
      .eq('user_id', userId);

    if (error) {
      logger.error(`Kullanıcı sporları getirilirken hata oluştu. userId: ${userId}`, error);
      throw error;
    }

    res.status(200).json({
      status: 'success',
      message: 'Kullanıcı sporları başarıyla getirildi',
      data: sportsData
    });
  } catch (error) {
    handleError(error as Error, res);
  }
};

/**
 * Kullanıcının favori sporlarına yeni bir spor ekler
 * POST /api/profile/sports
 */
export const addUserSport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('Kullanıcı kimliği doğrulanamadı');
    }

    const { sport_id } = req.body;

    // İstek validasyonu
    if (!sport_id || typeof sport_id !== 'number') {
      throw new BadRequestError('Geçerli bir sport_id belirtilmelidir');
    }

    // Spor ID'sinin geçerli olup olmadığını kontrol et
    const { data: sportExists, error: sportCheckError } = await supabase
      .from('Sports')
      .select('id')
      .eq('id', sport_id)
      .single();

    if (sportCheckError || !sportExists) {
      logger.error(`Spor ID geçerli değil. sport_id: ${sport_id}`, sportCheckError);
      throw new BadRequestError('Belirtilen spor bulunamadı');
    }

    // Kullanıcının bu sporu zaten ekleyip eklemediğini kontrol et
    const { data: existingSport, error: checkError } = await supabase
      .from('User_Sports')
      .select('sport_id')
      .eq('user_id', userId)
      .eq('sport_id', sport_id)
      .single();

    if (existingSport) {
      return res.status(409).json({
        status: 'error',
        message: 'Bu spor zaten favorilerinizde bulunuyor'
      });
    }

    // Sporu kullanıcının favorilerine ekle
    const { error: insertError } = await supabase
      .from('User_Sports')
      .insert({
        user_id: userId,
        sport_id: sport_id
      });

    if (insertError) {
      logger.error(`Kullanıcı sporları eklenirken hata oluştu. userId: ${userId}`, insertError);
      throw insertError;
    }

    logger.info(`Kullanıcıya yeni spor eklendi. userId: ${userId}, sportId: ${sport_id}`);
    res.status(201).json({
      status: 'success',
      message: 'Spor başarıyla favorilere eklendi',
      data: {
        sport_id
      }
    });
  } catch (error) {
    handleError(error as Error, res);
  }
};

/**
 * Kullanıcının favori sporlarından bir sporu kaldırır
 * DELETE /api/profile/sports/:sportId
 */
export const removeUserSport = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('Kullanıcı kimliği doğrulanamadı');
    }

    const sportId = parseInt(req.params.sportId);
    
    if (isNaN(sportId)) {
      throw new BadRequestError('Geçerli bir spor ID belirtilmelidir');
    }

    // Kullanıcının bu sporu favorilerinde olup olmadığını kontrol et
    const { data: existingSport, error: checkError } = await supabase
      .from('User_Sports')
      .select('sport_id')
      .eq('user_id', userId)
      .eq('sport_id', sportId)
      .single();

    if (checkError || !existingSport) {
      throw new NotFoundError('Belirtilen spor favorilerinizde bulunamadı');
    }

    // Sporu kullanıcının favorilerinden kaldır
    const { error: deleteError } = await supabase
      .from('User_Sports')
      .delete()
      .eq('user_id', userId)
      .eq('sport_id', sportId);

    if (deleteError) {
      logger.error(`Kullanıcı sporu silinirken hata oluştu. userId: ${userId}, sportId: ${sportId}`, deleteError);
      throw deleteError;
    }

    logger.info(`Kullanıcının favori sporu silindi. userId: ${userId}, sportId: ${sportId}`);
    res.status(200).json({
      status: 'success',
      message: 'Spor başarıyla favorilerden kaldırıldı'
    });
  } catch (error) {
    handleError(error as Error, res);
  }
};

/**
 * Kullanıcının favori sporlarını toplu olarak günceller (ekler/çıkarır)
 * POST /api/profile/sports/batch
 */
export const batchUpdateUserSports = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedError('Kullanıcı kimliği doğrulanamadı');
    }

    const { add = [], remove = [] } = req.body;

    // İstek validasyonu
    if (!Array.isArray(add) || !Array.isArray(remove)) {
      throw new BadRequestError('Geçerli bir istek formatı kullanılmalıdır');
    }

    // Ekleme ve silme sayılarını takip et
    let addedCount = 0;
    let removedCount = 0;

    // Silme işlemi
    if (remove.length > 0) {
      // Tüm silinecek ID'lerin geçerli olduğunu kontrol et
      for (const sportId of remove) {
        if (typeof sportId !== 'number') {
          throw new BadRequestError('Tüm spor ID\'leri sayı olmalıdır');
        }
      }

      // Silme işlemini gerçekleştir
      const { error: deleteError } = await supabase
        .from('User_Sports')
        .delete()
        .eq('user_id', userId)
        .in('sport_id', remove);

      if (deleteError) {
        logger.error(`Sporlar toplu silinirken hata oluştu. userId: ${userId}`, deleteError);
        throw deleteError;
      }

      removedCount = remove.length;
      logger.info(`${removedCount} adet spor favorilerden kaldırıldı. userId: ${userId}`);
    }

    // Ekleme işlemi
    if (add.length > 0) {
      // Tüm eklenecek ID'lerin geçerli olduğunu kontrol et
      for (const sportId of add) {
        if (typeof sportId !== 'number') {
          throw new BadRequestError('Tüm spor ID\'leri sayı olmalıdır');
        }
      }

      // Mevcut sporları getir
      const { data: existingSports } = await supabase
        .from('User_Sports')
        .select('sport_id')
        .eq('user_id', userId);

      const existingIds = existingSports?.map(sport => sport.sport_id) || [];
      
      // Yalnızca mevcut olmayan sporları ekle
      const sportsToAdd = add.filter(id => !existingIds.includes(id));
      
      if (sportsToAdd.length > 0) {
        // Sporların varlığını kontrol et
        const { data: validSports } = await supabase
          .from('Sports')
          .select('id')
          .in('id', sportsToAdd);
        
        const validIds = validSports?.map(sport => sport.id) || [];
        
        // Ekleme işlemini gerçekleştir
        const userSportsToInsert = validIds.map(sportId => ({
          user_id: userId,
          sport_id: sportId
        }));

        if (userSportsToInsert.length > 0) {
          const { error: insertError } = await supabase
            .from('User_Sports')
            .insert(userSportsToInsert);

          if (insertError) {
            logger.error(`Sporlar toplu eklenirken hata oluştu. userId: ${userId}`, insertError);
            throw insertError;
          }

          addedCount = userSportsToInsert.length;
          logger.info(`${addedCount} adet spor favorilere eklendi. userId: ${userId}`);
        }
      }
    }

    // Güncellenmiş favori sporları getir
    const { data: updatedSports, error: fetchError } = await supabase
      .from('User_Sports')
      .select(`
        sport_id,
        sport:Sports (
          id,
          name,
          description,
          icon
        )
      `)
      .eq('user_id', userId);

    if (fetchError) {
      logger.error(`Güncellenmiş kullanıcı sporları getirilirken hata oluştu. userId: ${userId}`, fetchError);
      throw fetchError;
    }

    res.status(200).json({
      status: 'success',
      message: 'Favori sporlar başarıyla güncellendi',
      data: {
        added: addedCount,
        removed: removedCount,
        sports: updatedSports
      }
    });
  } catch (error) {
    handleError(error as Error, res);
  }
}; 