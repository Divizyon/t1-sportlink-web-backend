import { supabaseAdmin } from '../config/supabase';
import logger from './logger';

/**
 * Basit veritabanı bağlantı kontrolü
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    logger.info('Veritabanı bağlantısı kontrol ediliyor...');
    
    // Basit bir sorgu ile bağlantıyı test et
    const { data, error } = await supabaseAdmin
      .from('Sports')
      .select('id')
      .limit(1);
      
    if (error && error.code !== '42501') { // 42501: Permission denied hatası bağlantının çalıştığını gösterir
      logger.error('Veritabanı bağlantı kontrolü hatası:', error);
      return false;
    }
    
    logger.info('Veritabanı bağlantısı aktif.');
    return true;
  } catch (error) {
    logger.error('Veritabanı bağlantı kontrolü sırasında beklenmeyen hata:', error);
    return false;
  }
};

export default {
  checkDatabaseConnection
}; 