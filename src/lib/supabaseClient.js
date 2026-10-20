import { createClient } from '@supabase/supabase-js';

// Get Supabase environment variables from Vite env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate if user has configured Supabase with real credentials
export const isSupabaseConfigured = () => {
  return (
    typeof supabaseUrl === 'string' &&
    supabaseUrl.trim().length > 0 &&
    !supabaseUrl.includes('your-project-id') &&
    typeof supabaseAnonKey === 'string' &&
    supabaseAnonKey.trim().length > 0 &&
    !supabaseAnonKey.includes('your-anon-key')
  );
};

// Create Supabase client instance (or null if unconfigured)
export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const getSupabaseConfigStatus = () => {
  if (isSupabaseConfigured()) {
    return {
      connected: true,
      url: supabaseUrl,
      mode: 'Supabase Cloud Database (Live)',
    };
  }
  return {
    connected: false,
    url: null,
    mode: 'Local High-Speed Cache (Supabase Ready)',
  };
};
