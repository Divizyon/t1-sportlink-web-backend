import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as path from 'path';

// .env dosyasını doğru yoldan yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase kimlik bilgileri eksik. Lütfen .env dosyanızı kontrol edin.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 