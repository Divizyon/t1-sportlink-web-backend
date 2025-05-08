import { Request, Response } from 'express';
import * as userService from '../services/userService';
import supabase, { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';
import { NotificationService } from '../services/NotificationService';

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
    console.log(`getUserDetails çağrıldı, id: ${id}`);
    
    const userDetails = await userService.getUserDetailsById(id);
    
    if (!userDetails) {
      console.log(`Kullanıcı bulunamadı, id: ${id}`);
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı.'
      });
    }

    console.log(`Kullanıcı detayları alındı, şimdi raporlar getiriliyor. id: ${id}`);
    
    // Kullanıcı raporlarını getir
    try {
      const userReports = await userService.getUserReports(id);
      console.log(`Kullanıcı raporları alındı, rapor sayısı: ${userReports.length}`);

      // Kullanıcı detaylarına raporları ekle
      const responseData = {
        ...userDetails,
        reports: userReports
      };

      return res.status(200).json({
        status: 'success',
        data: responseData
      });
    } catch (reportError) {
      console.error('Kullanıcı raporları getirilirken hata oluştu:', reportError);
      
      // Raporlarda hata olsa bile kullanıcı detaylarını döndür, reports: [] olacak
      return res.status(200).json({
        status: 'success',
        data: {
          ...userDetails,
          reports: []
        }
      });
    }
  } catch (error) {
    console.error('Get user details error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Kullanıcı detayları getirilirken bir hata oluştu.'
    });
  }
};

/**
 * Kullanıcı durumunu aktif/inaktif olarak değiştirir
 */
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
    
    // Kullanıcı durumu inaktif olduğunda adminlere bildirim gönder
    if (result.status === 'inactive') {
      try {
        // Kullanıcı adını al
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('first_name, last_name')
          .eq('id', userId)
          .single();
          
        // Admin adını al
        const { data: adminData } = await supabaseAdmin
          .from('users')
          .select('first_name, last_name')
          .eq('id', adminId)
          .single();
          
        const userName = userData 
          ? `${userData.first_name} ${userData.last_name}`
          : 'Bilinmeyen Kullanıcı';
          
        const adminName = adminData
          ? `${adminData.first_name} ${adminData.last_name}`
          : 'Bir Admin';
          
        // Bildirim gönder
        const notificationService = new NotificationService();
        await notificationService.notifyAdminsUserInactive(
          userId,
          userName,
          `${adminName} tarafından inaktif yapıldı`
        );
        logger.info(`Kullanıcı inaktif bildirimi gönderildi: ${userName}`);
      } catch (notificationError) {
        logger.error('Bildirim gönderirken hata oluştu:', notificationError);
        // Ana işlemi etkilememesi için hata fırlatmıyoruz
      }
    }
    
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

/**
 * Kullanıcıyı izlemeye alma/izlemeden çıkarma
 * @param req Express Request
 * @param res Express Response
 */
export const toggleUserWatch = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { watch } = req.body;
    const adminId = req.user?.id;

    if (!adminId) {
      return res.status(401).json({ 
        error: 'Yetkilendirme başarısız',
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız' 
      });
    }

    // Önce kullanıcıyı kontrol et
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        status: 'error',
        message: 'Kullanıcı bulunamadı'
      });
    }

    // İzleme durumunu güncelle
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        is_watched: watch,
        watched_since: watch ? new Date().toISOString() : null
      })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Kullanıcı izleme durumu güncellenirken hata:', updateError);
      return res.status(500).json({
        status: 'error',
        message: 'Kullanıcı izleme durumu güncellenirken bir hata oluştu'
      });
    }

    // Kullanıcı izlemeye alındığında bildirim gönder
    if (watch) {
      try {
        // Kullanıcı adını al
        const userName = updatedUser 
          ? `${updatedUser.first_name} ${updatedUser.last_name}`
          : 'Bilinmeyen Kullanıcı';
          
        // Admin adını al
        const { data: adminData } = await supabaseAdmin
          .from('users')
          .select('first_name, last_name')
          .eq('id', adminId)
          .single();
          
        const adminName = adminData
          ? `${adminData.first_name} ${adminData.last_name}`
          : 'Bir Admin';
          
        // Bildirim gönder
        const notificationService = new NotificationService();
        await notificationService.notifyAdminsUserWatched(
          userId,
          userName,
          adminName
        );
        logger.info(`Kullanıcı izleme bildirimi gönderildi: ${userName}`);
      } catch (notificationError) {
        logger.error('Bildirim gönderirken hata oluştu:', notificationError);
        // Ana işlemi etkilememesi için hata fırlatmıyoruz
      }
    }

    return res.status(200).json({
      status: 'success',
      message: watch ? 'Kullanıcı başarıyla izlemeye alındı' : 'Kullanıcı izlemeden çıkarıldı',
      data: {
        id: updatedUser.id,
        name: `${updatedUser.first_name} ${updatedUser.last_name}`,
        email: updatedUser.email,
        isWatched: updatedUser.is_watched,
        updatedAt: updatedUser.watched_since,
        updatedBy: req.user.id
      }
    });

  } catch (error) {
    console.error('toggleUserWatch hatası:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Bir hata oluştu'
    });
  }
};

/**
 * USER rolündeki kullanıcıları sayfalandırılmış şekilde getiren controller
 */
export const getUsersByRoleController = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const sortBy = (req.query.sort as string) || 'mixed'; // 'new', 'active' veya 'mixed'
    
    logger.info(`USER rolündeki kullanıcılar isteniyor: sayfa=${page}, limit=${limit}, sıralama=${sortBy}`);
    
    const result = await userService.getUsersByRole(page, limit, sortBy);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    logger.error('USER rolündeki kullanıcıları getirme hatası:', error);
    res.status(500).json({
      status: 'error',
      message: 'Kullanıcılar listelenirken bir hata oluştu'
    });
  }
};

/**
 * Kullanıcı hesabını dondurur (30 gün içinde giriş yapılmazsa inactive olur)
 */
export const freezeAccountController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız'
      });
    }

    const result = await userService.freezeUserAccount(userId);
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Hesap dondurma controller hatası:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    return res.status(500).json({
      success: false,
      message: 'Hesap dondurma işlemi sırasında bir hata oluştu',
      error: errorMessage
    });
  }
};

/**
 * Kullanıcı hesabının silinmesini talep eder (hesabı inactive yapar)
 */
export const deleteAccountController = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Bu işlemi gerçekleştirmek için giriş yapmalısınız'
      });
    }

    const result = await userService.requestAccountDeletion(userId);
    
    return res.status(200).json(result);
  } catch (error) {
    logger.error('Hesap silme controller hatası:', error);
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen bir hata oluştu';
    
    return res.status(500).json({
      success: false,
      message: 'Hesap silme işlemi sırasında bir hata oluştu',
      error: errorMessage
    });
  }
}; 