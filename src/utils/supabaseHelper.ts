import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Çevre değişkenlerini yükle
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Validasyon
if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  const missing = [];
  if (!supabaseUrl) missing.push('SUPABASE_URL');
  if (!supabaseAnonKey) missing.push('SUPABASE_KEY');
  if (!supabaseServiceKey) missing.push('SUPABASE_SERVICE_KEY');
  
  throw new Error(`Eksik Supabase yapılandırması: ${missing.join(', ')}`);
}

// Normal client instance
let _supabase: SupabaseClient | null = null;

// Admin client instance
let _supabaseAdmin: SupabaseClient | null = null;

/**
 * Standart Supabase istemcisini döndürür
 * @returns Supabase istemcisi
 */
export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

/**
 * Admin yetkili Supabase istemcisini döndürür
 * @returns Admin Supabase istemcisi
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return _supabaseAdmin;
}

// Test fonksiyonu - Bu modülü doğrudan çalıştırdığımızda testleri yapar
async function testConnections() {
  console.log('Supabase bağlantıları test ediliyor...');
  
  try {
    // Normal client testi
    const supabase = getSupabase();
    const { data: normalData, error: normalError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    console.log('Normal client testi:', normalError ? '❌ Başarısız' : '✅ Başarılı');
    if (normalError) console.error('  Hata:', normalError.message);
    
    // Admin client testi
    const admin = getSupabaseAdmin();
    const { data: adminData, error: adminError } = await admin.auth.admin.listUsers();
    
    console.log('Admin client testi:', adminError ? '❌ Başarısız' : '✅ Başarılı');
    if (adminError) console.error('  Hata:', adminError.message);
    else console.log('  Kullanıcı sayısı:', adminData.users.length);
    
  } catch (error) {
    console.error('Test sırasında bir hata oluştu:', error);
  }
}

// Eğer bu dosya doğrudan çalıştırılıyorsa, testleri çalıştır
if (require.main === module) {
  testConnections();
}

// Varsayılan olarak normal istemciyi export et
export default getSupabase(); 