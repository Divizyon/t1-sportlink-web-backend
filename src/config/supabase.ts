import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import * as path from 'path';

// .env dosyasını doğru yoldan yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.SUPABASE_URL as string;

const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const bypassSupabase = process.env.BYPASS_SUPABASE === 'true';

if (!bypassSupabase && (!supabaseUrl || !supabaseServiceKey)) {
  throw new Error('Supabase kimlik bilgileri eksik. Lütfen .env dosyanızı kontrol edin.');
}

// Create a mock Supabase client for testing if bypass is enabled
let supabase: any;

if (bypassSupabase) {
  // Mock client
  supabase = { /* mock implementation */ };
} else {
  // Real client
  supabase = createClient(supabaseUrl, supabaseServiceKey);
}

if (bypassSupabase) {
  console.warn('WARNING: Using mock Supabase client. Only for documentation testing purposes.');
  
  // Mock client for testing
  const mockClient = {
    auth: {
      signInWithPassword: async () => ({ data: {}, error: null }),
      signOut: async () => ({ error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: {}, error: null }),
          order: () => ({
            limit: () => ({
              data: [],
              error: null
            })
          })
        }),
        data: [],
        error: null
      })
    })
  };
  
  supabase = mockClient;
  supabaseAdmin = mockClient;
} else {
  // Normal client for user operations
  supabase = createClient(supabaseUrl, supabaseKey);

  // Admin client with service role for more privileged operations
  supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey || supabaseKey);
}

export { supabaseAdmin };
export default supabase; 