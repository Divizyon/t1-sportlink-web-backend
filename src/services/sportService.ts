import supabase from '../config/supabase';
import { Sport, CreateSportDTO, UpdateSportDTO } from '../models/Sport';

/**
 * Tüm spor kategorilerini getir
 */
export const getSports = async (): Promise<Sport[]> => {
  try {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return data as Sport[];
  } catch (error) {
    console.error('Error getting sports:', error);
    return [];
  }
};

/**
 * ID'ye göre bir spor kategorisi getir
 */
export const getSportById = async (id: string): Promise<Sport | null> => {
  try {
    const { data, error } = await supabase
      .from('sports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Sport;
  } catch (error) {
    console.error(`Error getting sport with ID ${id}:`, error);
    return null;
  }
};

/**
 * Yeni bir spor kategorisi oluştur
 */
export const createSport = async (sportData: CreateSportDTO): Promise<Sport | null> => {
  try {
    const { data, error } = await supabase
      .from('sports')
      .insert(sportData)
      .select()
      .single();

    if (error) throw error;
    return data as Sport;
  } catch (error) {
    console.error('Error creating sport:', error);
    return null;
  }
};

/**
 * Mevcut bir spor kategorisini güncelle
 */
export const updateSport = async (id: string, sportData: UpdateSportDTO): Promise<Sport | null> => {
  try {
    const { data, error } = await supabase
      .from('sports')
      .update(sportData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Sport;
  } catch (error) {
    console.error(`Error updating sport with ID ${id}:`, error);
    return null;
  }
};

/**
 * Bir spor kategorisini sil
 */
export const deleteSport = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('sports')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting sport with ID ${id}:`, error);
    return false;
  }
}; 