import { supabaseAdmin } from '../config/supabase';

/**
 * Database erişimini test eden yardımcı fonksiyon
 */
export const testDatabaseAccess = async () => {
  console.log('Veritabanı erişim testi başlatılıyor...');

  try {
    // 1. Announcements tablosuna erişim testi
    console.log('Announcements tablosuna erişim testi yapılıyor...');
    const { data: announcements, error: announcementsError } = await supabaseAdmin
      .from('Announcements')
      .select('*')
      .limit(1);

    if (announcementsError) {
      console.error('Announcements tablosuna erişimde hata:', announcementsError);
    } else {
      console.log('Announcements tablosuna erişim başarılı:', announcements?.length || 0, 'kayıt bulundu');
    }

    // 2. Kullanılan token'ın rolünü kontrol et
    console.log('Supabase servis rolü kontrolü...');
    const { data: authData, error: authError } = await supabaseAdmin.auth.getSession();
    
    console.log('Kimlik bilgileri:', authData);
    
    if (authError) {
      console.error('Auth bilgisi alınırken hata:', authError);
    } else {
      console.log('Auth bilgisi başarıyla alındı');
      // Admin API anahtarı zaten bir token içermez, burada kimlik bilgisi olmayabilir
    }

    // 3. Test amaçlı bir kayıt eklemeyi dene
    console.log('Test kaydı ekleniyor...');
    const testData = {
      title: 'Test Duyurusu - Service Role Test',
      content: 'Bu bir test duyurusudur, service role erişimini test etmek için oluşturulmuştur.',
      creator_id: 'test-user-id'
    };

    const { data: insertData, error: insertError } = await supabaseAdmin
      .from('Announcements')
      .insert([testData])
      .select();

    if (insertError) {
      console.error('Kayıt eklenirken hata:', insertError);
    } else {
      console.log('Test kaydı başarıyla eklendi:', insertData);

      // Eklenen test kaydını sil
      const testId = insertData[0]?.id;
      if (testId) {
        const { error: deleteError } = await supabaseAdmin
          .from('Announcements')
          .delete()
          .eq('id', testId);

        if (deleteError) {
          console.error('Test kaydı silinirken hata:', deleteError);
        } else {
          console.log('Test kaydı başarıyla silindi');
        }
      }
    }

    console.log('Veritabanı erişim testi tamamlandı.');
  } catch (error) {
    console.error('Veritabanı erişim testi sırasında beklenmeyen hata:', error);
  }
};

// Bu dosya doğrudan çalıştırıldığında testi başlat
if (require.main === module) {
  testDatabaseAccess()
    .then(() => console.log('Test tamamlandı'))
    .catch(err => console.error('Test hatası:', err));
} 