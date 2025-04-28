import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Çevre değişkenlerini yükle
dotenv.config();

// Gerekli ortam değişkenlerini kontrol et
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  throw new Error('SUPABASE_URL ve SUPABASE_KEY .env dosyasında tanımlanmalıdır');
}

// Supabase istemcisini oluştur
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Admin istemcisini oluştur (service_key ile)
const supabaseAdmin = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  : supabase; // Service key yoksa normal istemciyi kullan

// supabaseAdmin'i varsayılan olarak export et
export default supabaseAdmin; 
// Gerekirse normal istemciye de erişim sağla
export { supabase }; 