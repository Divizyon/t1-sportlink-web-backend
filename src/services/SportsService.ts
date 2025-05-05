import { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';
import { Database } from '../types/supabase';

type Sport = Database['public']['Tables']['Sports']['Row'];

export const SportsService = {
  /**
   * Tüm spor dallarını getirir
   */
  async getAllSports(): Promise<Sport[]> {
    logger.info('SportsService: Tüm spor kategorileri getiriliyor...');
    try {
      const { data, error } = await supabaseAdmin
        .from('Sports')
        .select('*')
        .order('name');
      
      if (error) {
        logger.error('Spor dalları getirilirken hata oluştu:', error);
        throw error;
      }
      
      logger.info(`SportsService: ${data?.length || 0} adet spor kategorisi bulundu.`);
      return data || [];
    } catch (error) {
      logger.error('Spor dalları getirilirken hata oluştu:', error);
      throw error;
    }
  },
  
  /**
   * Belirli bir spor dalını ID'ye göre getirir
   */
  async getSportById(id: number | string): Promise<Sport | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('Sports')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        logger.error(`Spor dalı getirilirken hata oluştu (ID: ${id}):`, error);
        return null;
      }
      
      return data;
    } catch (error) {
      logger.error(`Spor dalı getirilirken hata oluştu (ID: ${id}):`, error);
      return null;
    }
  }
}; 