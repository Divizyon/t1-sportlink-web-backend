import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Çevre değişkenlerini yükle
dotenv.config();

// Çevre değişkenlerini kontrol et
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  throw new Error('SUPABASE_URL ve SUPABASE_KEY çevre değişkenleri tanımlanmalıdır.');
}

// Normal client for user operations
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// Admin client for administrative operations (if service key exists)
export const supabaseAdmin = process.env.SUPABASE_SERVICE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)
  : supabase; // Eğer service key yoksa normal client'i kullan

export default supabase; 