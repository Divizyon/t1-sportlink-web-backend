import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_KEY!;

/**
 * Returns a Supabase client that includes the provided access token in its requests,
 * enabling RLS policies to recognize auth.uid().
 */
export function getSupabaseForToken(token: string): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
} 