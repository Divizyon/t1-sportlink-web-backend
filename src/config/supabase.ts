import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Normal client for user operations
const supabase = createClient(supabaseUrl, supabaseKey);

// Admin client with service role for more privileged operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);

export default supabase; 