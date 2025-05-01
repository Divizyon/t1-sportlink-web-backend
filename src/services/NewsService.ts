import { v4 as uuidv4 } from 'uuid'; // Benzersiz dosya adları için
import { supabaseAdmin } from '../config/supabase'; // Admin client'ı kullanalım (storage/db için)
import logger from '../utils/logger';
import { Database } from '../types/supabase'; // Supabase tipleri

// Supabase Storage bucket adını 'content' olarak değiştir
const NEWS_IMAGE_BUCKET = 'sportlink-files'; 
// Gerekirse kullanılacak sabitler
const DEFAULT_NEWS_TYPE = 'manual'; // Manuel oluşturulan haberler için

type NewsInput = {
  title: string;
  content: string;
  creatorId: string; // Bu hala gerekli olabilir, kimin oluşturduğunu bilmek için
  sport_id: number; // Zorunlu hale getirildi
  type?: string; // Opsiyonel, varsayılan değer kullanılacak
  end_time?: Date; // Opsiyonel
  file?: Express.Multer.File; // Multer'dan gelen dosya (opsiyonel)
};

type NewsUpdateInput = {
  id: number;
  title?: string;
  content?: string;
  sport_id?: number;
  type?: string;
  end_time?: Date;
  file?: Express.Multer.File;
};

type NewsQueryOptions = {
  sportId?: number;
  limit?: number;
  offset?: number;
};

// Tip tanımı (Supabase tiplerinden türetilebilir ama şimdilik basit tutalım)
type News = Database['public']['Tables']['News']['Row'];


export const NewsService = {
  async createNews(input: NewsInput): Promise<News> {
    const { 
      title, 
      content, 
      creatorId, 
      sport_id, 
      type = DEFAULT_NEWS_TYPE,
      end_time = null,
      file 
    } = input;
    
    let imageUrl: string | null = null;

    logger.info(`Haber oluşturma işlemi başlatıldı: title=${title}, creatorId=${creatorId}, sportId=${sport_id}, file=${!!file}`);

    try {
      // 1. Görsel Yükleme (varsa)
      if (file) {
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        // Dosya yolunu 'content' bucket'ı içindeki 'news' klasörüne ayarla
        const filePath = `news/${uniqueFileName}`; 

        logger.info(`Görsel yükleniyor: bucket=${NEWS_IMAGE_BUCKET}, path=${filePath}`);

        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from(NEWS_IMAGE_BUCKET) // Correct bucket name used here
          .upload(filePath, file.buffer, { // Correct file path used here
            contentType: file.mimetype,
          });

        if (uploadError) {
          logger.error(`Supabase Storage yükleme hatası: ${uploadError.message}`, uploadError);
          throw new Error('Görsel yüklenirken bir hata oluştu.');
        }

        // Yüklenen dosyanın public URL'ini al
        const { data: urlData } = supabaseAdmin.storage
          .from(NEWS_IMAGE_BUCKET)
          .getPublicUrl(filePath);

        imageUrl = urlData?.publicUrl || null;
        logger.info(`Görsel başarıyla yüklendi: url=${imageUrl}`);
      }

      // 2. Veritabanına Kaydetme
      const now = new Date().toISOString();
      const newsDataToInsert = {
        title,
        content,
        image_url: imageUrl,
        sport_id, // Girdiden gelen sport_id kullanılıyor
        published_date: now,
        created_at: now,
        updated_at: now,
        source_url: '' as string | null,
        type, // Yeni eklenen alan
        end_time: end_time ? end_time.toISOString() : null // Yeni eklenen alan
      };

      logger.info('Haber veritabanına ekleniyor:', newsDataToInsert);

      const { data: newNews, error: insertError } = await supabaseAdmin
        .from('News') // Tablo adının 'News' olduğundan emin ol
        .insert([newsDataToInsert])
        .select()
        .single();

      if (insertError) {
        logger.error(`Supabase veritabanı ekleme hatası: ${insertError.message}`, insertError);
        // İlişkisel hatalar (örn: sport_id yok) için daha spesifik kontrol
        if (insertError.code === '23503') {
           // Daha açıklayıcı bir mesaj
           if (insertError.message.includes('News_sport_id_fkey')) {
             throw new Error(`Geçersiz Spor Kategorisi ID'si: ${sport_id}. Bu ID'ye sahip bir spor kategorisi bulunamadı.`);
           }
           // Diğer olası foreign key hataları için genel mesaj
           throw new Error('İlişkili veri bulunamadı (örn. geçersiz ID).');
        }
        // Diğer veritabanı hataları
        throw new Error('Haber veritabanına kaydedilirken bir hata oluştu.');
      }

      if (!newNews) {
          logger.error('Haber oluşturuldu ancak veri döndürülemedi.');
          throw new Error('Haber oluşturuldu ancak sonuç alınamadı.');
      }

      logger.info(`Haber başarıyla oluşturuldu: id=${newNews.id}`);

      return newNews as News;

    } catch (error) {
      logger.error(`Haber oluşturma servisinde hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, error);
      // Hataları tekrar fırlat ki controller yakalayabilsin
      throw error;
    }
  },

  async getNewsById(id: number): Promise<News | null> {
    try {
      logger.info(`${id} ID'li haber getiriliyor`);

      const { data, error } = await supabaseAdmin
        .from('News')
        .select(`
          *,
          Sports:sport_id (name, icon)
        `)
        .eq('id', id)
        .single();

      if (error) {
        logger.error(`Haber getirme hatası: ${error.message}`, error);
        throw error;
      }

      if (!data) {
        logger.info(`${id} ID'li haber bulunamadı`);
        return null;
      }

      logger.info(`${id} ID'li haber başarıyla getirildi`);
      return data as News;
    } catch (error) {
      logger.error(`getNewsById servisinde hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, error);
      throw error;
    }
  },

  async getAllNews(options: NewsQueryOptions = {}): Promise<{ data: News[]; count: number }> {
    try {
      const { sportId, limit = 20, offset = 0 } = options;
      logger.info(`Haberler getiriliyor: sportId=${sportId}, limit=${limit}, offset=${offset}`);

      // İlk olarak count sorgusu yap
      let countQuery = supabaseAdmin
        .from('News')
        .select('id', { count: 'exact' });
      
      if (sportId) {
        countQuery = countQuery.eq('sport_id', sportId);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) {
        logger.error(`Haber sayısı hesaplama hatası: ${countError.message}`, countError);
        throw countError;
      }
      
      // Sonra ana sorguyu yap
      let query = supabaseAdmin
        .from('News')
        .select(`
          *,
          Sports:sport_id (name, icon)
        `)
        .order('published_date', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (sportId) {
        query = query.eq('sport_id', sportId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        logger.error(`Haberler getirilirken hata: ${error.message}`, error);
        throw error;
      }
      
      logger.info(`${data.length} haber başarıyla getirildi`);
      return { 
        data: data as News[], 
        count: count || 0 
      };
    } catch (error) {
      logger.error(`getAllNews servisinde hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, error);
      throw error;
    }
  },

  async updateNews(input: NewsUpdateInput): Promise<News> {
    try {
      const { id, title, content, sport_id, type, end_time, file } = input;
      
      logger.info(`${id} ID'li haber güncelleniyor`);
      
      // 1. Mevcut haberi kontrol et
      const { data: existingNews, error: getError } = await supabaseAdmin
        .from('News')
        .select('image_url')
        .eq('id', id)
        .single();
      
      if (getError) {
        logger.error(`Mevcut haberi getirme hatası: ${getError.message}`, getError);
        throw new Error(`Güncellenecek haber bulunamadı (ID: ${id})`);
      }
      
      // 2. Yeni görsel varsa yükle
      let imageUrl = existingNews?.image_url || null;
      
      if (file) {
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${uuidv4()}.${fileExtension}`;
        const filePath = `news/${uniqueFileName}`;
        
        logger.info(`Yeni görsel yükleniyor: bucket=${NEWS_IMAGE_BUCKET}, path=${filePath}`);
        
        const { error: uploadError } = await supabaseAdmin.storage
          .from(NEWS_IMAGE_BUCKET)
          .upload(filePath, file.buffer, {
            contentType: file.mimetype,
          });
        
        if (uploadError) {
          logger.error(`Görsel yükleme hatası: ${uploadError.message}`, uploadError);
          throw new Error('Görsel güncellenirken bir hata oluştu');
        }
        
        const { data: urlData } = supabaseAdmin.storage
          .from(NEWS_IMAGE_BUCKET)
          .getPublicUrl(filePath);
        
        imageUrl = urlData?.publicUrl || null;
        logger.info(`Yeni görsel başarıyla yüklendi: url=${imageUrl}`);
      }
      
      // 3. Güncelleme verilerini hazırla
      const updateData: Record<string, any> = {
        updated_at: new Date().toISOString()
      };
      
      if (title !== undefined) updateData.title = title;
      if (content !== undefined) updateData.content = content;
      if (sport_id !== undefined) updateData.sport_id = sport_id;
      if (type !== undefined) updateData.type = type;
      if (end_time !== undefined) updateData.end_time = end_time ? end_time.toISOString() : null;
      if (file) updateData.image_url = imageUrl;
      
      logger.info('Haber güncelleniyor:', { id, ...updateData });
      
      // 4. Haberi güncelle
      const { data: updatedNews, error: updateError } = await supabaseAdmin
        .from('News')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (updateError) {
        logger.error(`Haber güncelleme hatası: ${updateError.message}`, updateError);
        
        // İlişkisel hatalar için spesifik kontrol
        if (updateError.code === '23503' && updateError.message.includes('News_sport_id_fkey')) {
          throw new Error(`Geçersiz Spor Kategorisi ID'si: ${sport_id}. Bu ID'ye sahip bir spor kategorisi bulunamadı.`);
        }
        
        throw new Error('Haber güncellenirken bir hata oluştu');
      }
      
      if (!updatedNews) {
        logger.error('Haber güncellendi ancak veri döndürülemedi.');
        throw new Error('Haber güncellendi ancak sonuç alınamadı.');
      }
      
      logger.info(`${id} ID'li haber başarıyla güncellendi`);
      return updatedNews as News;
      
    } catch (error) {
      logger.error(`updateNews servisinde hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, error);
      throw error;
    }
  },

  async deleteNews(id: number): Promise<boolean> {
    try {
      logger.info(`${id} ID'li haber siliniyor`);
      
      // 1. Haberi ve görsel URL'ini al
      const { data: news, error: getError } = await supabaseAdmin
        .from('News')
        .select('image_url')
        .eq('id', id)
        .single();
      
      if (getError) {
        logger.error(`Silinecek haberi getirme hatası: ${getError.message}`, getError);
        throw new Error(`Silinecek haber bulunamadı (ID: ${id})`);
      }
      
      // 2. Haberi sil
      const { error: deleteError } = await supabaseAdmin
        .from('News')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        logger.error(`Haber silme hatası: ${deleteError.message}`, deleteError);
        throw new Error('Haber silinirken bir hata oluştu');
      }
      
      // 3. Eğer görsel varsa ve storage'da ise, görseli de sil
      if (news?.image_url) {
        const imagePathMatch = news.image_url.match(/\/([^\/]+)\/([^\/]+)$/);
        
        if (imagePathMatch && imagePathMatch.length >= 3) {
          const imagePath = `news/${imagePathMatch[2]}`;
          
          logger.info(`İlişkili görsel siliniyor: ${imagePath}`);
          
          const { error: storageError } = await supabaseAdmin.storage
            .from(NEWS_IMAGE_BUCKET)
            .remove([imagePath]);
          
          if (storageError) {
            // Görseli silememe durumunda sadece log atalım, ana işlemi etkilemesin
            logger.warn(`Görsel silinirken hata oluştu: ${storageError.message}`, storageError);
          } else {
            logger.info(`İlişkili görsel başarıyla silindi: ${imagePath}`);
          }
        }
      }
      
      logger.info(`${id} ID'li haber başarıyla silindi`);
      return true;
      
    } catch (error) {
      logger.error(`deleteNews servisinde hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, error);
      throw error;
    }
  }
};

// Eğer NewsService'i class olarak tanımlamak istersen:
// export class NewsService {
//   async createNews(...) { ... }
// }
// export default new NewsService(); 