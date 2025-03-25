import { createClient } from '@supabase/supabase-js';

async function testBuckets() {
  try {
    // UYARI: Bu değerleri gerçek anahtarınızla değiştirin
    const supabaseUrl = 'https://gihdkqozknxxokklmqvz.supabase.co';
    // Service role key değerini "Settings > API" bölümünden "service_role" için "Reveal" tıklayarak aldığınız değerle değiştirin
    const supabaseServiceKey = 'BURAYA_SERVICE_ROLE_KEY_YAZIN';
    
    console.log('Service role key kullanılıyor...');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Bucket listesini al
    console.log('Bucketlar alınıyor...');
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw new Error(`Bucket listesi alınamadı: ${error.message}`);
    }
    
    console.log('Bucketlar:', buckets);
    console.log('Bucket sayısı:', buckets.length);
    
    if (buckets.length === 0) {
      console.log('Dikkat: Hiç bucket bulunamadı! Bucket oluşturmayı deneyelim...');
      
      // Bucket oluşturma denemesi
      console.log('Yeni bucket oluşturuluyor...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('test-bucket', {
        public: true
      });
      
      if (createError) {
        console.error('Bucket oluşturma hatası:', createError.message);
      } else {
        console.log('Yeni bucket oluşturuldu:', newBucket);
      }
    } else {
      // Her bucket'ın içeriğini kontrol et
      for (const bucket of buckets) {
        console.log(`\n${bucket.name} bucket içeriği:`);
        const { data: files, error: listError } = await supabase.storage.from(bucket.name).list();
        
        if (listError) {
          console.error(`${bucket.name} bucket içeriği alınamadı: ${listError.message}`);
          continue;
        }
        
        if (files.length === 0) {
          console.log(`${bucket.name} bucket'ı boş`);
        } else {
          files.forEach(file => console.log(`- ${file.name}`));
        }
      }
    }
    
  } catch (error: any) {
    console.error('Test hatası:', error.message);
  }
}

// Testi çalıştır
testBuckets(); 