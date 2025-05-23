import { supabaseAdmin } from '../config/supabase';
import logger from './logger';

/**
 * Veritabanı bağlantısını kontrol eden basit fonksiyon
 */
export const checkDatabaseConnection = async (): Promise<boolean> => {
  try {
    logger.info('Veritabanı bağlantısı kontrol ediliyor...');
    
    // Basit bir sorgu çalıştırarak bağlantıyı kontrol et
    const { data, error } = await supabaseAdmin
      .from('Sports')
      .select('id')
      .limit(1);
    
    if (error) {
      // Sports tablosuna erişim hatası - yine de bağlantı var
      if (error.code === '42501') { // permission denied
        logger.warn('Sports tablosuna erişim hatası, ancak bağlantı kurulabildi');
        return true;
      }
      
      logger.error('Veritabanı bağlantı hatası:', error);
      return false;
    }
    
    logger.info('Veritabanı bağlantısı başarılı.');
    return true;
  } catch (error) {
    logger.error('Veritabanı bağlantı kontrolü sırasında beklenmeyen hata:', error);
    return false;
  }
};

export default {
  checkDatabaseConnection
}; 