import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';
import { Database } from '../types/supabase';

type Sport = Database['public']['Tables']['Sports']['Row'];

export const SportsService = {
  async getAllSports(): Promise<Sport[]> {
    logger.info('SportsService: Tüm spor kategorileri getiriliyor...');
    try {
      const { data, error } = await supabaseAdmin
        .from('Sports')
        .select('id, name, description, icon'); // Gerekli alanları seç

      if (error) {
        logger.error(`Supabase 'Sports' tablosu okuma hatası:`, error);
        throw new Error('Spor kategorileri getirilirken bir veritabanı hatası oluştu.');
      }

      logger.info(`SportsService: ${data?.length || 0} adet spor kategorisi bulundu.`);
      return data || []; // Veri null ise boş dizi döndür

    } catch (error) {
      logger.error(`Spor kategorileri getirme servisinde hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, error);
      throw error;
    }
  }
}; 