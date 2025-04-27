import { v4 as uuidv4 } from 'uuid'; // Benzersiz dosya adları için
import { supabaseAdmin } from '../config/supabase'; // Admin client'ı kullanalım (storage/db için)
import logger from '../utils/logger';
import { Database } from '../types/supabase'; // Supabase tipleri

// Supabase Storage bucket adını 'content' olarak değiştir
const NEWS_IMAGE_BUCKET = 'sportlink-files'; 
// Gerekirse kullanılacak sabitler
// const NEWS_TYPE_ANNOUNCEMENT = 'announcement';
// const DEFAULT_NEWS_STATUS = 'published';

type NewsInput = {
  title: string;
  content: string;
  creatorId: string; // Bu hala gerekli olabilir, kimin oluşturduğunu bilmek için
  sport_id: number; // Zorunlu hale getirildi
  // sendNotification kaldırıldı
  file?: Express.Multer.File; // Multer'dan gelen dosya (opsiyonel)
};

// Tip tanımı (Supabase tiplerinden türetilebilir ama şimdilik basit tutalım)
type News = Database['public']['Tables']['News']['Row'];


export const NewsService = {
  async createNews(input: NewsInput): Promise<News> {
    // sendNotification kaldırıldı
    const { title, content, creatorId, sport_id, file } = input;
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
      const newsDataToInsert = {
        title,
        content,
        image_url: imageUrl,
        sport_id, // Girdiden gelen sport_id kullanılıyor
        // Creator ID, type, status gibi sütunlar News tablosunda yoksa kaldırılmalı
        // Eğer varsa ve gerekli ise creatorId buraya eklenebilir: creator_id: creatorId,
        published_date: new Date().toISOString(), // Use ISO string for timestamp
        created_at: new Date().toISOString(), // Use ISO string
        updated_at: new Date().toISOString(), // Use ISO string
        source_url: '' as string | null, // Provide default or null
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

      // 3. Bildirim Gönderme kısmı tamamen kaldırıldı

      return newNews as News;

    } catch (error) {
      logger.error(`Haber oluşturma servisinde hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`, error);
      // Hataları tekrar fırlat ki controller yakalayabilsin
      throw error;
    }
  }
  // Diğer NewsService fonksiyonları (getNews, updateNews, deleteNews vb.) buraya eklenebilir
};

// Eğer NewsService'i class olarak tanımlamak istersen:
// export class NewsService {
//   async createNews(...) { ... }
// }
// export default new NewsService(); 