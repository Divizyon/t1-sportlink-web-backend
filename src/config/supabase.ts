import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseKey = process.env.SUPABASE_KEY as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY as string;
const bypassSupabase = process.env.BYPASS_SUPABASE === 'true';

if (!bypassSupabase && (!supabaseUrl || !supabaseKey)) {
  throw new Error('Missing Supabase credentials. Please check your .env file.');
}

// Create a mock Supabase client for testing if bypass is enabled
let supabase: any;
let supabaseAdmin: any;

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