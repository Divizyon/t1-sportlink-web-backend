import { supabaseAdmin } from './supabase';

/**
 * Uygulamanın ihtiyaç duyduğu tüm storage bucket'larını oluşturur ve yapılandırır
 */
export const setupStorageBuckets = async (): Promise<void> => {
  try {
    console.log('Storage bucket kontrol ediliyor...');

    // "sportlink-files" bucket'ını kontrol et, yoksa oluştur
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.error('Bucket listesi alınırken hata:', listError);
      throw listError;
    }

    const sportlinkBucket = buckets?.find(bucket => bucket.name === 'sportlink-files');
    
    if (!sportlinkBucket) {
      console.log('"sportlink-files" bucket\'ı bulunamadı, oluşturuluyor...');
      
      // Bucket oluştur
      const { error: createError } = await supabaseAdmin.storage.createBucket('sportlink-files', {
        public: true, // Dosyalara herkese açık URL'ler vererek erişilebilir yap
        fileSizeLimit: 5 * 1024 * 1024, // 5MB limit
      });
      
      if (createError) {
        console.error('Bucket oluşturulurken hata:', createError);
        throw createError;
      }
      
      console.log('"sportlink-files" bucket\'ı başarıyla oluşturuldu.');
      console.log('Not: Storage izinleri için Supabase Dashboard\'dan RLS politikaları manuel olarak ayarlanmalıdır.');
    } else {
      console.log('"sportlink-files" bucket\'ı zaten mevcut.');
    }
    
    console.log('Storage bucket başarıyla yapılandırıldı.');
    console.log('Lütfen Supabase Dashboard üzerinden izinleri manuel olarak ayarlayın:');
    console.log('1. Tüm kullanıcılar için okuma izni');
    console.log('2. Admin kullanıcılar için yazma izni');
    
  } catch (error) {
    console.error('Storage bucket yapılandırılırken hata oluştu:', error);
  }
}; 