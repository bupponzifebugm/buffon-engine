import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://xqnivsoyricyekhwxwwj.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhxbml2c295cmljeWVraHd4d3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1Mzc5MTcsImV4cCI6MjA5NTExMzkxN30.CephI3y4MzVWkYlSiUjrMsIXxnubL0FJ91_n4sgo310';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
