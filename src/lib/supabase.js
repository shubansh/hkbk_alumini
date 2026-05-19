import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing. ' +
    'Add them in Vercel → Project Settings → Environment Variables.'
  );
}

/**
 * Keep this config MINIMAL.
 * - Do NOT add flowType: 'pkce' — it changes the token storage format and
 *   invalidates all sessions that were created without PKCE.
 * - Do NOT add a custom fetch wrapper — it can abort Supabase's own internal
 *   token-refresh requests, breaking session persistence.
 * - persistSession, autoRefreshToken, detectSessionInUrl are all true by
 *   default in Supabase v2, but we list them explicitly for clarity.
 */
export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: {
    persistSession:     true,   // Store session in localStorage (survives refresh)
    autoRefreshToken:   true,   // Automatically refresh JWT before expiry
    detectSessionInUrl: true,   // Needed for magic links / OAuth redirects
  },
});
