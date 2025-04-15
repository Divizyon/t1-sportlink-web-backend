import supabase, { supabaseAdmin } from '../config/supabase';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import sharp from 'sharp';
import { EventMedia } from '../models/EventMedia';

const BUCKET_NAME = 'sportlink-files';
const THUMBNAIL_SIZE = 200; // thumbnail boyutu (pixel)

/**
 * Medya servisi - Etkinlik görsellerini ve videolarını yönetmek için
 */
export const mediaService = {
  /**
   * Thumbnail oluşturur ve Supabase'e yükler
   * @param file Orijinal dosya
   * @param eventId Etkinlik ID
   * @returns Thumbnail URL
   */
  async createThumbnail(file: Buffer, eventId: string): Promise<string | null> {
    try {
      // Thumbnail oluştur
      const thumbnail = await sharp(file)
        .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      // Thumbnail'ı Supabase'e yükle
      const thumbnailFileName = `thumb_${uuidv4()}.jpg`;
      const thumbnailPath = `content/events/${eventId}/thumbnails/${thumbnailFileName}`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(thumbnailPath, thumbnail, {
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        console.error('Thumbnail yükleme hatası:', uploadError);
        return null;
      }

      // Thumbnail URL'sini al
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(thumbnailPath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Thumbnail oluşturma hatası:', error);
      return null;
    }
  },

  /**
   * Dosyayı Supabase Storage'a yükler
   * @param file Yüklenecek dosya
   * @param eventId İlgili etkinlik ID
   * @param mediaType Medya tipi (image veya video)
   * @param isCover Kapak görseli olarak kullanılacak mı?
   */
  async uploadEventMedia(
    file: Buffer, 
    fileName: string,
    eventId: string, 
    mediaType: 'image' | 'video',
    isCover: boolean = false
  ) {
    try {
      // Dosya yolu ve adını oluştur
      const fileExtension = path.extname(fileName);
      const uniqueFileName = `${uuidv4()}${fileExtension}`;
      const storagePath = `content/events/${eventId}/${uniqueFileName}`;
      
      // Supabase'e yükle
      const { data, error } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .upload(storagePath, file, {
          contentType: mediaType === 'image' 
            ? `image/${fileExtension.replace('.', '')}` 
            : `video/${fileExtension.replace('.', '')}`
        });
      
      if (error) {
        throw error;
      }
      
      // Dosya için public URL oluştur
      const { data: urlData } = supabaseAdmin.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);
        
      const mediaUrl = urlData.publicUrl;
      
      // Eğer görsel ise thumbnail oluştur
      let thumbnailUrl = null;
      if (mediaType === 'image') {
        thumbnailUrl = await this.createThumbnail(file, eventId);
      }
      
      // Medya bilgisini Supabase veritabanına kaydet
      const mediaId = uuidv4();
      const timestamp = new Date().toISOString();
      
      // Eğer kapak görseli olarak işaretlendiyse, mevcut kapak görsellerini güncelle
      if (isCover) {
        // Önce diğer kapak görsellerini bul ve güncelle
        const { data: existingCoverMedia } = await supabaseAdmin
          .from('event_media')
          .select('id')
          .eq('event_id', eventId)
          .eq('is_cover', true);
          
        if (existingCoverMedia && existingCoverMedia.length > 0) {
          // Mevcut kapak görsellerini güncelle
          await supabaseAdmin
            .from('event_media')
            .update({ is_cover: false })
            .in('id', existingCoverMedia.map((media: { id: string }) => media.id));
        }
      }
      
      // Yeni medyayı ekle
      const { data: eventMedia, error: insertError } = await supabaseAdmin
        .from('event_media')
        .insert([
          {
            id: mediaId,
            event_id: eventId,
            media_type: mediaType,
            media_url: mediaUrl,
            thumbnail_url: thumbnailUrl,
            storage_path: storagePath,
            is_cover: isCover,
            created_at: timestamp
          }
        ])
        .select()
        .single();
        
      if (insertError) {
        throw insertError;
      }
      
      return eventMedia;
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      throw error;
    }
  },
  
  /**
   * Etkinliğe ait tüm medya dosyalarını getirir
   * @param eventId Etkinlik ID
   */
  async getEventMedia(eventId: string): Promise<EventMedia[]> {
    try {
      const { data, error } = await supabase
        .from('event_media')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      
      return data as EventMedia[];
    } catch (error) {
      console.error('Medya getirme hatası:', error);
      throw error;
    }
  },
  
  /**
   * Etkinlik medyasını siler
   * @param mediaId Silinecek medya ID'si
   */
  async deleteEventMedia(mediaId: string) {
    try {
      // Önce medya bilgilerini al
      const { data: media, error: fetchError } = await supabase
        .from('event_media')
        .select('*')
        .eq('id', mediaId)
        .single();
        
      if (fetchError || !media) {
        throw new Error('Medya bulunamadı');
      }
      
      // Supabase storage'dan sil
      const { error: storageError } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .remove([media.storage_path]);
        
      if (storageError) {
        throw storageError;
      }
      
      // Veritabanından sil
      const { error: deleteError } = await supabaseAdmin
        .from('event_media')
        .delete()
        .eq('id', mediaId);
        
      if (deleteError) {
        throw deleteError;
      }
      
      return { success: true };
    } catch (error) {
      console.error('Medya silme hatası:', error);
      throw error;
    }
  }
};

export default mediaService; 