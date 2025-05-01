// Bu dosya sadece uyumluluğu korumak için burada kalıyor
// Merkezi Supabase yapılandırması için aşağıdaki dosya kullanılmalı
import supabase, { supabaseAdmin } from '../config/supabase';

// Re-export
export { supabase };
export default supabaseAdmin; 