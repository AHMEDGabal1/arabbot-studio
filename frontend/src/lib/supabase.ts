import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

function createSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are missing. Auth features will be disabled.');
  }
  return createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder');
}

export const supabase = createSupabaseClient();
