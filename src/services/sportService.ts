import supabase, { supabaseAdmin } from '../config/supabase';
import logger from '../utils/logger';

export const getAllSports = async () => {
  try {
    const { data: Sports, error } = await supabaseAdmin
      .from('Sports')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error('Error fetching Sports:', error);
      throw new Error('Spor türleri getirilemedi');
    }

    return Sports;
  } catch (error) {
    logger.error('Error in getAllSports service:', error);
    throw error;
  }
}; 