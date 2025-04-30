import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Çevre değişkenlerini yükle
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_KEY || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '';

// Geliştirilmiş bağlantı havuzu yapılandırması ile client oluştur
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
  db: {
    schema: 'public'
  },
  global: {
    fetch: fetch.bind(globalThis)
  }
});

// Admin işlemleri için service_role key ile client
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false
  },
  db: {
    schema: 'public'
  },
  global: {
    fetch: fetch.bind(globalThis)
  }
});

// Bağlantı havuzunu ısıtma fonksiyonu
async function initializeConnectionPool() {
  try {
    // Basit bir sorgu çalıştırarak bağlantı havuzunu başlat
    console.log('Bağlantı havuzu ısınma işlemi başlatılıyor...');
    const { data, error } = await supabase.from('users').select('*').limit(1);
    console.log('Bağlantı havuzu başlatıldı:', error ? 'Başarısız' : 'Başarılı');
    if (error) throw error;
    
    // Admin bağlantısını da kontrol et
    const { error: adminError } = await supabaseAdmin.from('users').select('*').limit(1);
    console.log('Admin bağlantı havuzu başlatıldı:', adminError ? 'Başarısız' : 'Başarılı');
    
    return true;
  } catch (err) {
    console.error('Bağlantı havuzu ısınma hatası:', err);
    return false;
  }
}

// Bağlantı kontrolü fonksiyonu
async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase.from('users').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
}

export default supabase;
export { 
  supabaseAdmin, 
  initializeConnectionPool as warmupConnectionPool, 
  testDatabaseConnection as checkDatabaseConnection 
}; 
