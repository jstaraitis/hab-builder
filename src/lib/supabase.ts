import { createClient } from '@supabase/supabase-js';

/**
 * Supabase Client Configuration
 * 
 * To set up:
 * 1. Create a Supabase account at https://supabase.com
 * 2. Create a new project
 * 3. Go to Project Settings > API
 * 4. Copy your project URL and anon key
 * 5. Add to .env.local:
 *    VITE_SUPABASE_URL=your_project_url
 *    VITE_SUPABASE_ANON_KEY=your_anon_key
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️  Supabase credentials not found. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local'
  );
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
