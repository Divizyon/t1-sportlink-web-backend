import supabase, { supabaseAdmin } from '../config/supabase';
import { getIO } from '../config/socket';
import logger from '../utils/logger';

// Uyarı mesajı için tip tanımı
interface UserWarning {
  id?: string;
  user_id: string;
  admin_id: string;
  message: string;
  sent_at?: string;
  is_read: boolean;
}

// Tablo adını kontrol eden yardımcı fonksiyon
const getValidTableName = async (): Promise<string> => {
  return 'User_Warnings';
};

/**
 * Admin tarafından kullanıcıya uyarı mesajı gönderir
 * @param warning Uyarı mesajı bilgileri
 * @returns Oluşturulan uyarı mesajı
 */
export const sendWarningToUser = async (warning: UserWarning) => {
  try {
    const tableName = await getValidTableName();
    
    // Uyarı mesajını veritabanına kaydet
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .insert({
        user_id: warning.user_id,
        admin_id: warning.admin_id,
        message: warning.message,
        sent_at: new Date().toISOString(),
        is_read: false
      })
      .select()
      .single();

    if (error) {
      logger.error('Uyarı mesajı kaydedilemedi:', error);
      throw new Error(`Uyarı mesajı kaydedilemedi: ${error.message}`);
    }

    // Socket.IO üzerinden anlık bildirim gönder
    try {
      const io = getIO();
      io.to(`user:${warning.user_id}`).emit('new_warning', data);
      logger.info(`Kullanıcıya anlık uyarı gönderildi: ${warning.user_id}`);
    } catch (socketError) {
      // Socket gönderimi başarısız olsa bile, uyarı veritabanına kaydedildi
      logger.warn(`Anlık bildirim gönderilemedi, ancak uyarı kaydedildi: ${socketError}`);
    }

    return data;
  } catch (error) {
    logger.error('Uyarı gönderme hatası:', error);
    throw error;
  }
};

/**
 * Kullanıcıya ait tüm uyarı mesajlarını getirir
 * @param userId Kullanıcı ID
 * @returns Kullanıcıya ait uyarı mesajları
 */
export const getUserWarnings = async (userId: string) => {
  try {
    const tableName = await getValidTableName();
    
    // İlişki olmadan basic sorgu yapalım
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('user_id', userId)
      .order('sent_at', { ascending: false });

    if (error) {
      logger.error('Kullanıcı uyarıları getirilemedi:', error);
      throw new Error(`Kullanıcı uyarıları getirilemedi: ${error.message}`);
    }

    // Admin bilgilerini ayrı bir sorguda alıp manuel birleştirelim
    if (data && data.length > 0) {
      // Tüm admin ID'lerini toplayalım
      const adminIds = [...new Set(data.map(warning => warning.admin_id))];
      
      // Eğer admin ID'leri varsa, bunlara ait kullanıcıları getirelim
      if (adminIds.length > 0) {
        const { data: admins, error: adminsError } = await supabaseAdmin
          .from('users')
          .select('id, first_name, last_name')
          .in('id', adminIds);
        
        if (!adminsError && admins) {
          // Admin bilgilerini uyarı verilerine ekleyelim
          return data.map(warning => {
            const admin = admins.find(a => a.id === warning.admin_id);
            return {
              ...warning,
              admin: admin ? {
                first_name: admin.first_name,
                last_name: admin.last_name
              } : null
            };
          });
        }
      }
    }

    return data;
  } catch (error) {
    logger.error('Kullanıcı uyarıları sorgulama hatası:', error);
    throw error;
  }
};

/**
 * Uyarı mesajını okundu olarak işaretler
 * @param warningId Uyarı ID
 * @param userId Kullanıcı ID (güvenlik kontrolü için)
 * @returns İşlem sonucu
 */
export const markWarningAsRead = async (warningId: string, userId: string) => {
  try {
    const tableName = await getValidTableName();
    
    // Güvenlik kontrolü: Uyarının gerçekten bu kullanıcıya ait olduğundan emin olun
    const { data: warning, error: checkError } = await supabaseAdmin
      .from(tableName)
      .select('id')
      .eq('id', warningId)
      .eq('user_id', userId)
      .single();

    if (checkError || !warning) {
      logger.error('Uyarı mesajı bulunamadı veya bu kullanıcıya ait değil');
      throw new Error('Uyarı mesajı bulunamadı veya bu kullanıcıya ait değil');
    }

    // Uyarıyı okundu olarak işaretle - updated_at alanını kullanmadan
    const { data, error } = await supabaseAdmin
      .from(tableName)
      .update({ is_read: true })
      .eq('id', warningId)
      .select()
      .single();

    if (error) {
      logger.error('Uyarı okundu işaretlenemedi:', error);
      throw new Error(`Uyarı okundu işaretlenemedi: ${error.message}`);
    }

    return data;
  } catch (error) {
    logger.error('Uyarı okundu işaretleme hatası:', error);
    throw error;
  }
};

/**
 * Bir kullanıcının okunmamış uyarı sayısını getirir
 * @param userId Kullanıcı ID
 * @returns Okunmamış uyarı sayısı
 */
export const getUnreadWarningsCount = async (userId: string) => {
  try {
    const tableName = await getValidTableName();
    
    const { count, error } = await supabaseAdmin
      .from(tableName)
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      logger.error('Okunmamış uyarı sayısı getirilemedi:', error);
      throw new Error(`Okunmamış uyarı sayısı getirilemedi: ${error.message}`);
    }

    return { count };
  } catch (error) {
    logger.error('Okunmamış uyarı sayısı sorgulama hatası:', error);
    throw error;
  }
}; 