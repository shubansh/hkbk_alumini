/**
 * AuthContext.jsx — Production-safe, StrictMode-safe authentication provider.
 *
 * ARCHITECTURE:
 * ─────────────
 * 1. Register onAuthStateChange listener FIRST (so no events are missed).
 * 2. Manually call getSession() to restore session on page load.
 * 3. `initialized` is set to true ONLY after the startup sequence finishes.
 * 4. Route guards MUST wait for `initialized` before making any redirect decision.
 * 5. Profile fetch uses DB as source of truth; metadata is the last-resort fallback.
 *
 * RULES THAT MUST NEVER BE VIOLATED:
 * ────────────────────────────────────
 * - NEVER call localStorage.clear() — it destroys the Supabase session token.
 * - NEVER define route guards inside a React component function body.
 * - NEVER redirect before `initialized` is true.
 * - NEVER block setInitialized(true) inside a `mountedRef` check in `finally`.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [initialized, setInitialized] = useState(false);

  const mountedRef = useRef(true);

  // ─── Derived role helpers ──────────────────────────────────────────────────
  const userRole         = userProfile?.role   ?? null;
  const userStatus       = userProfile?.status ?? null;
  const isAdmin          = userRole === 'admin';
  const isStudent        = userRole === 'student';
  const isApprovedAlumni = userRole === 'alumni' &&
    (userProfile?.is_approved === true || userStatus === 'approved');
  const isPendingAlumni  = userRole === 'alumni' && !isApprovedAlumni;

  // ─── fetchProfile ─────────────────────────────────────────────────────────
  // Fetches the profile row for the given session's user.
  // Always resolves — never throws to the caller.
  // Priority: DB row > metadata fallback (never leaves role as null if user exists).
  const fetchProfile = useCallback(async (currentSession) => {
    if (!currentSession?.user?.id) {
      if (mountedRef.current) setUserProfile(null);
      return;
    }

    const uid   = currentSession.user.id;
    const email = currentSession.user.email ?? '';
    const meta  = currentSession.user.user_metadata ?? {};

    console.log('[Auth] fetchProfile for uid:', uid);

    // ── Step 1: Try the database (via SECURITY DEFINER RPC to bypass RLS) ────
    try {
      // Use get_my_profile() RPC first — it's SECURITY DEFINER so RLS cannot block it.
      // Falls back to direct table query if the function doesn't exist yet.
      let data = null;
      let error = null;

      const rpcTimeout = new Promise((_, rej) =>
        setTimeout(() => rej(new Error('rpc-timeout')), 7000)
      );

      try {
        const rpcResult = await Promise.race([
          supabase.rpc('get_my_profile'),
          rpcTimeout,
        ]);
        data  = rpcResult.data?.[0] ?? rpcResult.data ?? null;
        error = rpcResult.error;
        if (error) console.warn('[Auth] RPC get_my_profile error:', error.message);
        else console.log('[Auth] RPC profile. role =', data?.role, '| id =', data?.id);
      } catch (rpcErr) {
        console.warn('[Auth] RPC failed, falling back to direct query:', rpcErr.message);
        // Fallback: direct table query
        const fallbackTimeout = new Promise((_, rej) =>
          setTimeout(() => rej(new Error('direct-timeout')), 7000)
        );
        const fallbackResult = await Promise.race([
          supabase.from('profiles').select('*').eq('id', uid).maybeSingle(),
          fallbackTimeout,
        ]);
        data  = fallbackResult.data;
        error = fallbackResult.error;
        console.log('[Auth] Direct query. role =', data?.role, '| error =', error?.message);
      }

      if (!mountedRef.current) return;

      if (error) {
        console.warn('[Auth] Profile DB error (will use fallback):', error.message);
      } else if (data) {
        // ✅ DB row found — this is the authoritative source of truth
        console.log('[Auth] Profile loaded from DB. role =', data.role, '| id =', data.id);
        setUserProfile(data);
        return;
      } else {
        // No row found by auth.uid() — check if there's a row with matching email
        // (This happens when admin was promoted via SQL UPDATE by email instead of UUID)
        console.warn('[Auth] No profile row for uid:', uid, '— trying email fallback:', email);

        const { data: emailMatch } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', email)
          .maybeSingle();

        if (emailMatch && mountedRef.current) {
          console.log('[Auth] Found profile by email. role =', emailMatch.role, '| profile_id =', emailMatch.id, '| auth_id =', uid);
          // Use the profile as-is (correct role) and silently fix the ID mismatch in DB
          if (emailMatch.id !== uid) {
            console.warn('[Auth] ID mismatch detected. profile.id =', emailMatch.id, 'auth.uid =', uid, '— fixing...');
            supabase
              .from('profiles')
              .update({ id: uid })
              .eq('email', email)
              .then(({ error: fixErr }) => {
                if (fixErr) console.warn('[Auth] Could not auto-fix ID mismatch:', fixErr.message);
                else console.log('[Auth] ID mismatch fixed successfully.');
              });
          }
          setUserProfile({ ...emailMatch, id: uid });
          return;
        }

        // Truly no profile anywhere — create one
        console.warn('[Auth] No profile found by email either. Auto-creating...');
        const meta = currentSession.user.user_metadata ?? {};
        const candidate = {
          id:        uid,
          email,
          full_name: meta.full_name ?? meta.name ?? email.split('@')[0] ?? 'User',
          role:      meta.role ?? 'student',
          status:    meta.role === 'alumni' ? 'pending' : 'approved',
        };

        const insertFence = new Promise((_, rej) =>
          setTimeout(() => rej(new Error('insert-timeout')), 5000)
        );

        const { data: created, error: insertErr } = await Promise.race([
          supabase.from('profiles').insert([candidate]).select('*').maybeSingle(),
          insertFence,
        ]);

        if (!insertErr && created && mountedRef.current) {
          console.log('[Auth] Auto-created profile. role =', created.role);
          setUserProfile(created);
          return;
        }

        if (insertErr) {
          console.warn('[Auth] Auto-create failed:', insertErr.message);
        }
      }
    } catch (err) {
      console.warn('[Auth] fetchProfile DB exception:', err.message);
    }

    if (!mountedRef.current) return;

    // ── Step 2: Metadata fallback ────────────────────────────────────────────
    // Only reached when the DB is unreachable. Use metadata as best-effort.
    const metaRole = meta.role ?? null;
    const name     = meta.full_name ?? meta.name ?? email.split('@')[0] ?? 'User';

    console.warn('[Auth] Using metadata fallback. metaRole =', metaRole);

    setUserProfile(
      metaRole
        ? {
            id:          uid,
            role:        metaRole,
            status:      metaRole === 'alumni' ? 'pending' : 'approved',
            is_approved: metaRole !== 'alumni',
            full_name:   name,
            email,
            avatar_url:  null,
          }
        : {
            id:          uid,
            role:        null,
            status:      null,
            is_approved: false,
            full_name:   name,
            email,
          }
    );
  }, []);

  // ─── Bootstrap ────────────────────────────────────────────────────────────
  useEffect(() => {
    // Reset mount flag on every effect run (StrictMode runs effects twice in dev)
    mountedRef.current = true;

    // ── Register listener first so we never miss SIGNED_IN events ─────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Only handle post-init events here. INITIAL_SESSION is handled below.
        if (event === 'INITIAL_SESSION') return;

        if (!mountedRef.current) return;

        console.log(`[Auth] Event: ${event} | user: ${newSession?.user?.id ?? 'none'}`);

        setSession(newSession ?? null);

        if (newSession) {
          await fetchProfile(newSession);
        } else {
          setUserProfile(null);
        }
      }
    );

    // ── Startup sequence ───────────────────────────────────────────────────────
    // Runs once per mount. StrictMode will run this twice in dev — that is fine
    // because the second run simply re-validates the same session.
    (async () => {
      try {
        const fence = new Promise((_, rej) =>
          setTimeout(() => rej(new Error('getSession-timeout')), 8000)
        );

        const { data: { session: initial }, error } = await Promise.race([
          supabase.auth.getSession(),
          fence,
        ]);

        if (error) throw error;

        console.log('[Auth] getSession done. user:', initial?.user?.id ?? 'none');

        if (!mountedRef.current) return;

        setSession(initial ?? null);

        if (initial) {
          await fetchProfile(initial);
        } else {
          setUserProfile(null);
        }
      } catch (err) {
        console.error('[Auth] Startup error:', err.message);
        if (mountedRef.current) {
          setSession(null);
          setUserProfile(null);
        }
      } finally {
        // ⚠️  CRITICAL: setInitialized MUST fire even if mountedRef is false.
        // If we guard this with mountedRef, StrictMode's first unmount will
        // prevent initialized from ever becoming true.
        setInitialized(true);
      }
    })();

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try { await supabase.removeAllChannels(); } catch (_) {}

    try {
      // scope:'local' clears only this browser's token — does not invalidate other sessions
      await supabase.auth.signOut({ scope: 'local' });
    } catch (e) {
      console.warn('[Auth] signOut error (non-fatal):', e.message);
    }

    window.location.replace('/login');
  }, []);

  // ─── Context ───────────────────────────────────────────────────────────────
  const value = {
    session,
    userProfile,
    userRole,
    userStatus,
    loading: !initialized,
    initialized,
    isAdmin,
    isStudent,
    isApprovedAlumni,
    isPendingAlumni,
    handleLogout,
    refetchProfile: () => session && fetchProfile(session),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('[useAuth] Must be used inside <AuthProvider>.');
  return ctx;
}
