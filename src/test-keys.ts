import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Çevre değişkenlerini yükle
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

console.log('=== Supabase Anahtar Testi ===');
console.log('SUPABASE_URL:', supabaseUrl);
console.log('SUPABASE_KEY (ilk 10 karakter):', supabaseKey.substring(0, 10) + '...');
console.log('SUPABASE_SERVICE_KEY (ilk 10 karakter):', supabaseServiceKey.substring(0, 10) + '...');

const testRegularClient = async () => {
  try {
    console.log('\n=== Normal Client Testi ===');
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: userCountData, error: userCountError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (userCountError) {
      console.error('Normal client hatası:', userCountError);
      return false;
    } else {
      console.log('Normal client başarılı!');
      return true;
    }
  } catch (err) {
    console.error('Normal client test hatası:', err);
    return false;
  }
};

const testAdminClient = async () => {
  try {
    console.log('\n=== Admin Client Testi ===');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Admin yetkisi gerektiren bir işlem dene
    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();
      
      if (error) {
        console.error('Admin client hatası:', error);
        return false;
      } else {
        console.log('Admin client başarılı!', 'Kullanıcı sayısı:', data.users?.length || 0);
        return true;
      }
    } catch (err) {
      console.error('Admin işlemi hatası:', err);
      return false;
    }
  } catch (err) {
    console.error('Admin client test hatası:', err);
    return false;
  }
};

// Test fonksiyonlarını çalıştır
(async () => {
  const normalClientOk = await testRegularClient();
  const adminClientOk = await testAdminClient();
  
  console.log('\n=== Test Sonuçları ===');
  console.log('Normal Client:', normalClientOk ? '✓ Çalışıyor' : '✗ Hatalı');
  console.log('Admin Client:', adminClientOk ? '✓ Çalışıyor' : '✗ Hatalı');
  
  if (!normalClientOk || !adminClientOk) {
    console.error('\n⚠️ Düzeltilmesi gereken sorunlar var.');
    
    if (!adminClientOk) {
      console.error('\nÖneriler:');
      console.error('1. Supabase yönetim paneline gidin');
      console.error('2. "Settings" > "API" yolunu izleyin');
      console.error('3. "Project API keys" bölümünde "service_role" anahtarını kopyalayın');
      console.error('4. .env dosyanızda SUPABASE_SERVICE_KEY değişkenini güncelleyin');
    }
  } else {
    console.log('\n✅ Tüm testler başarılı!');
  }
})(); 