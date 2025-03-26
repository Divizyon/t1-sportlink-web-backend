import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as path from 'path';

// .env dosyasını doğru yoldan yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Supabase kimlik bilgileri eksik. Lütfen .env dosyanızı kontrol edin.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase; 