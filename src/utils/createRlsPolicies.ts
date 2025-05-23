import { supabaseAdmin } from '../config/supabase';
import logger from './logger';

/**
 * Sports tablosu için basitleştirilmiş erişim kontrolü
 */
export const checkSportsTableAccess = async (): Promise<boolean> => {
  try {
    logger.info('Sports tablosu erişim kontrolü yapılıyor...');
    
    // Basit bir sorgu ile erişimi kontrol et
    const { data, error } = await supabaseAdmin
      .from('Sports')
      .select('id, name')
      .limit(1);
    
    if (error) {
      if (error.code === '42501') { // permission denied
        logger.warn('Sports tablosuna erişim için RLS politikaları ayarlanmalı - Supabase Dashboard üzerinden yapılabilir');
        logger.info('Tavsiye edilen RLS politikası: Sports tablosu için en azından SELECT yetkisi herkese açık olmalı');
      } else {
        logger.error('Sports tablosu erişim hatası:', error);
      }
      return false;
    }
    
    logger.info('Sports tablosuna erişim sağlandı.');
    return true;
  } catch (error) {
    logger.error('Sports tablosu erişim kontrolü sırasında beklenmeyen hata:', error);
    return false;
  }
};

/**
 * Tüm gerekli tablo erişim kontrolleri
 */
export const checkAllTableAccess = async (): Promise<boolean> => {
  try {
    logger.info('Veritabanı tablo erişimleri kontrol ediliyor...');
    
    const sportsAccess = await checkSportsTableAccess();
    
    // Diğer tablolar için de benzer kontroller eklenebilir
    // const eventsAccess = await checkEventsTableAccess();
    
    if (!sportsAccess) {
      logger.warn('Bazı tablolara erişim sağlanamadı, retry mekanizması ile sorular yine de çalışacak');
      return false; 
    }
    
    logger.info('Tüm kontrol edilen tablolara erişim sağlandı.');
    return true;
  } catch (error) {
    logger.error('Tablo erişim kontrolü sırasında beklenmeyen hata:', error);
    return false;
  }
};

export default {
  checkSportsTableAccess,
  checkAllTableAccess
}; 