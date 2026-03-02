import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://yrjwbebvoaxxrgruzqlp.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlyandiZWJ2b2F4eHJncnV6cWxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MDczOTcsImV4cCI6MjA4Nzk4MzM5N30.YKMmuqlU_2P_Kkj8-txqNiqcgvUjUD6DHmnTvV7xuEU";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key is missing in environment variables.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '');
