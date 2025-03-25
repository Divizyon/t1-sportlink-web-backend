import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
<<<<<<< HEAD
import * as path from 'path';

// .env dosyasını doğru yoldan yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
=======

dotenv.config();
>>>>>>> 76cbe056b6d71c2afdafe3a7ba1844d6a344a614

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
<<<<<<< HEAD
  throw new Error('Supabase kimlik bilgileri eksik. Lütfen .env dosyanızı kontrol edin.');
=======
  throw new Error('Missing Supabase credentials. Please check your .env file.');
>>>>>>> 76cbe056b6d71c2afdafe3a7ba1844d6a344a614
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase; 