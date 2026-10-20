import { createClient } from '@supabase/supabase-js';

// Get Supabase environment variables from Vite env or project defaults
const DEFAULT_SUPABASE_URL = 'https://xynsjollwrdbnajbrfpk.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5bnNqb2xsd3JkYm5hamJyZnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI1MjIyNzIsImV4cCI6MjEwODA5ODI3Mn0.mT8sBXf-oFnnOfT6PBbzFZeKS_AYwlxxhPJiUmz_B14';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('your-project-id'))
  ? import.meta.env.VITE_SUPABASE_URL
  : DEFAULT_SUPABASE_URL;

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY && !import.meta.env.VITE_SUPABASE_ANON_KEY.includes('your-anon-key'))
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : DEFAULT_SUPABASE_ANON_KEY;

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
