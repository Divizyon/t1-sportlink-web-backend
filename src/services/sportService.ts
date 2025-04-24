import supabase from '../config/supabase';
import logger from '../utils/logger';

export const getAllSports = async () => {
  try {
    const { data: sports, error } = await supabase
      .from('sports')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      logger.error(`Spor arama hatası: ${JSON.stringify(error)}`);
      throw new Error('Spor türleri getirilemedi');
    }

    return sports;
  } catch (error) {
    logger.error(`Error in getAllSports service: ${JSON.stringify(error)}`);
    throw error;
  }
}; 