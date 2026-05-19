import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    '[Supabase] Missing environment variables. ' +
    'Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your Vercel project settings.'
  );
}

export const supabase = createClient(supabaseUrl ?? '', supabaseKey ?? '', {
  auth: {
    // Persist session in localStorage so it survives page refresh
    persistSession: true,
    // Automatically refresh the JWT before it expires (prevents stale token issues)
    autoRefreshToken: true,
    // Detect the session from the URL hash (needed for OAuth / magic links)
    detectSessionInUrl: true,
    // Use localStorage (default) — required for session to survive hard refreshes on Vercel
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'hkbk-auth',
    // Use PKCE flow for better security
    flowType: 'pkce',
  },
  realtime: {
    // Limit reconnection attempts to prevent infinite retry loops
    params: { eventsPerSecond: 10 },
  },
  global: {
    // Attach a timeout to every fetch so Supabase cold-starts don't hang indefinitely
    fetch: (url, options = {}) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s per request
      return fetch(url, { ...options, signal: controller.signal }).finally(() =>
        clearTimeout(timeout)
      );
    },
  },
});
