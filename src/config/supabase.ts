import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Çevre değişkenlerini yükle
dotenv.config();

// Çevre değişkenlerini kontrol et
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_URL, SUPABASE_KEY ve SUPABASE_SERVICE_KEY çevre değişkenleri tanımlanmalıdır.');
}

// Normal user client (JWT ile)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
  {
    auth: {
      persistSession: false
    }
  }
);

// Admin client (service role key ile) - RLS bypass eder
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL, 
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  }
);

// Varsayılan olarak supabaseAdmin'i export et
export default supabaseAdmin; 