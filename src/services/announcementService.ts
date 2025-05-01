import { supabaseAdmin } from '../config/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Duyuru tipi
export interface Announcement {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  creator_id: string;
  created_at: string;
  updated_at: string;
}

// Duyuru oluşturma için input tipi
export interface CreateAnnouncementInput {
  title: string;
  content: string;
  image_url: string | null;
  creator_id: string;
}

// Duyuru güncelleme için input tipi
export interface UpdateAnnouncementInput {
  title?: string;
  content?: string;
  image_url?: string | null;
  updater_id: string;
}

/**
 * Tüm duyuruları getirir
 * @returns Duyuru listesi
 */
export const getAllAnnouncements = async (): Promise<Announcement[]> => {
  const { data, error } = await supabaseAdmin
    .from('Announcements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Duyurular getirilirken hata:', error);
    throw new Error(`Duyurular getirilirken bir hata oluştu: ${error.message}`);
  }

  return data || [];
};

/**
 * ID'ye göre duyuru getirir
 * @param id Duyuru ID
 * @returns Duyuru veya null
 */
export const getAnnouncementById = async (id: string): Promise<Announcement | null> => {
  const { data, error } = await supabaseAdmin
    .from('Announcements')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') { // Kayıt bulunamadı
      console.log(`${id} ID'li duyuru bulunamadı`);
      return null;
    }
    console.error(`Duyuru getirilirken hata: ${error.message}`);
    throw new Error(`Duyuru getirilirken bir hata oluştu: ${error.message}`);
  }

  return data;
};

/**
 * Yeni duyuru oluşturur
 * @param input Duyuru oluşturma verileri
 * @returns Oluşturulan duyuru
 */
export const createAnnouncement = async (input: CreateAnnouncementInput): Promise<Announcement> => {
  const { data, error } = await supabaseAdmin
    .from('Announcements')
    .insert([
      {
        title: input.title,
        content: input.content,
        image_url: input.image_url,
        creator_id: input.creator_id
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Duyuru oluşturulurken hata:', error);
    throw new Error(`Duyuru oluşturulurken bir hata oluştu: ${error.message}`);
  }

  return data;
};

/**
 * Duyuru günceller
 * @param id Duyuru ID
 * @param input Güncelleme verileri
 * @returns Güncellenmiş duyuru
 */
export const updateAnnouncement = async (id: string, input: UpdateAnnouncementInput): Promise<Announcement> => {
  // Önce duyurunun var olduğunu kontrol et
  const announcement = await getAnnouncementById(id);
  if (!announcement) {
    throw new Error(`${id} ID'li duyuru bulunamadı`);
  }

  const updateData: any = {};
  if (input.title !== undefined) updateData.title = input.title;
  if (input.content !== undefined) updateData.content = input.content;
  if (input.image_url !== undefined) updateData.image_url = input.image_url;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('Announcements')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Duyuru güncellenirken hata: ${error.message}`);
    throw new Error(`Duyuru güncellenirken bir hata oluştu: ${error.message}`);
  }

  return data;
};

/**
 * Duyuru siler
 * @param id Duyuru ID
 */
export const deleteAnnouncement = async (id: string): Promise<void> => {
  // Önce duyurunun var olduğunu kontrol et
  const announcement = await getAnnouncementById(id);
  if (!announcement) {
    throw new Error(`${id} ID'li duyuru bulunamadı`);
  }

  const { error } = await supabaseAdmin
    .from('Announcements')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Duyuru silinirken hata: ${error.message}`);
    throw new Error(`Duyuru silinirken bir hata oluştu: ${error.message}`);
  }
}; 