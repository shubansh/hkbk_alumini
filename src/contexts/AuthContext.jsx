/**
 * AuthContext.jsx — Production-grade centralized authentication provider.
 *
 * ARCHITECTURE (Production-safe):
 * ────────────────────────────────
 * Phase 1 — Initial load:
 *   Call getSession() directly. This synchronously reads localStorage and is
 *   the most reliable way to restore a session on hard refresh on Vercel.
 *
 * Phase 2 — Subscribe to future changes:
 *   Register onAuthStateChange AFTER getSession() resolves.
 *   Skip the INITIAL_SESSION event (we already handled it in Phase 1).
 *   Only react to SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED, etc.
 *
 * TIMEOUT STRATEGY:
 *   A hard 8s timeout covers the ENTIRE init sequence (getSession + profile fetch).
 *   It is NEVER cancelled early — only the component unmount cancels it.
 *   If it fires, loading is forced to false so the UI unblocks.
 *
 * PROFILE FETCH:
 *   Uses Promise.race with a 6s timeout so a slow/cold Supabase DB never
 *   causes a permanent hang, even after the global timeout is absorbed.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session,     setSession]     = useState(undefined); // undefined = not yet known
  const [userProfile, setUserProfile] = useState(null);
  const [loading,     setLoading]     = useState(true);

  const mountedRef       = useRef(true);
  const deviceChannelRef = useRef(null);
  // Track whether init has completed so the listener skips the INITIAL_SESSION dupe
  const initDoneRef      = useRef(false);

  // ─── Derived helpers ──────────────────────────────────────────────────────
  const userRole         = userProfile?.role   ?? null;
  const userStatus       = userProfile?.status ?? null;
  const isAdmin          = userRole === 'admin';
  const isStudent        = userRole === 'student';
  const isApprovedAlumni = userRole === 'alumni' &&
    (userProfile?.is_approved === true || userStatus === 'approved');
  const isPendingAlumni  = userRole === 'alumni' && !isApprovedAlumni;

  // ─── Profile fetch (with per-fetch timeout) ───────────────────────────────
  const fetchUserProfile = useCallback(async (currentSession) => {
    if (!currentSession?.user?.id) {
      if (mountedRef.current) { setUserProfile(null); setLoading(false); }
      return;
    }

    try {
      // Race DB fetch against a 6-second timeout so cold-start DBs can't hang forever
      const dbFetch = supabase
        .from('profiles')
        .select('id, role, status, is_approved, full_name, avatar_url, current_session_token')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Profile fetch timed out after 6s')), 6000)
      );

      const { data, error } = await Promise.race([dbFetch, timeoutPromise]);

      if (!mountedRef.current) return;

      if (error) {
        console.error('[Auth] DB profile error:', error.message);
        // Don't return — fall through to metadata fallback below
      } else if (data !== null && data !== undefined) {
        // Row found — use it even if role is null (that case shows AccountErrorPage)
        setUserProfile(data);
        setLoading(false);
        return;
      } else {
        console.warn('[Auth] No profile row in DB for user:', currentSession.user.id);
        // Fall through to metadata fallback
      }

    } catch (err) {
      // Covers both DB errors and the timeout rejection
      console.warn('[Auth] Profile fetch failed:', err.message);
      if (!mountedRef.current) return;
    }

    // ── Fallback: user_metadata written at signup ──────────────────────────
    const meta     = currentSession.user.user_metadata;
    const metaRole = meta?.role;

    if (mountedRef.current) {
      if (metaRole) {
        setUserProfile({
          id:          currentSession.user.id,
          role:        metaRole,
          status:      metaRole === 'alumni' ? 'pending' : 'approved',
          is_approved: metaRole !== 'alumni',
          full_name:   meta?.full_name ?? currentSession.user.email?.split('@')[0] ?? 'User',
          avatar_url:  null,
        });
      } else {
        setUserProfile({ id: currentSession.user.id, role: null, status: null, is_approved: false });
      }
      setLoading(false);
    }
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    // Clean up device channel first
    if (deviceChannelRef.current) {
      try { await supabase.removeChannel(deviceChannelRef.current); } catch (_) {}
      deviceChannelRef.current = null;
    }

    // Clear all local state FIRST so nothing re-triggers
    try { localStorage.clear();   } catch (_) {}
    try { sessionStorage.clear(); } catch (_) {}

    try {
      // Use global scope (default) — this invalidates the refresh token on the
      // Supabase server so autoRefreshToken cannot silently restore the session.
      // scope:'local' only clears localStorage but leaves the server session live.
      await supabase.auth.signOut();
      await supabase.removeAllChannels();
    } catch (e) {
      console.warn('[Auth] Signout error (non-fatal):', e);
    } finally {
      // Hard redirect — kills all in-memory React state
      window.location.replace('/login');
    }
  }, []);


  // ─── Bootstrap (Phase 1 + Phase 2) ───────────────────────────────────────
  useEffect(() => {
    mountedRef.current  = true;
    initDoneRef.current = false;

    // ── HARD TIMEOUT ────────────────────────────────────────────────────────
    // Covers the ENTIRE init sequence. Never cleared early — only unmount
    // cancels it. This guarantees the app NEVER freezes forever.
    const hardTimeoutId = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('[Auth] Hard timeout (8s) fired. Forcing loading=false.');
        setLoading(false);
        setSession(prev => (prev === undefined ? null : prev));
      }
    }, 8000);

    // ── PHASE 1: getSession() ───────────────────────────────────────────────
    // Most reliable way to restore a session on hard refresh / Vercel deploy.
    // Reads synchronously from localStorage then validates with Supabase.
    const initialize = async () => {
      try {
        const { data: { session: restored }, error } = await supabase.auth.getSession();

        if (!mountedRef.current) return;
        if (error) throw error;

        setSession(restored);

        if (restored) {
          await fetchUserProfile(restored);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('[Auth] getSession() failed:', err);
        if (mountedRef.current) {
          setSession(null);
          setLoading(false);
        }
      } finally {
        // Mark that Phase 1 is done so the listener can ignore INITIAL_SESSION
        initDoneRef.current = true;
      }
    };

    // ── PHASE 2: onAuthStateChange ──────────────────────────────────────────
    // Handles everything AFTER initial load:
    //   SIGNED_IN      → user just logged in from Login page
    //   SIGNED_OUT     → logout or token invalidation
    //   TOKEN_REFRESHED → Supabase auto-refreshed the JWT
    // We intentionally SKIP INITIAL_SESSION because Phase 1 handles that.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return;

        // Skip the initial event — Phase 1 already handled session restoration
        if (event === 'INITIAL_SESSION') return;

        console.log(`[Auth] ${event}`, newSession ? `user=${newSession.user.id}` : 'no session');

        setSession(newSession);

        if (newSession) {
          if (event === 'SIGNED_IN') {
            // Write device token for single-device enforcement
            try {
              const token = crypto.randomUUID();
              localStorage.setItem('device_token', token);
              await supabase
                .from('profiles')
                .update({ current_session_token: token })
                .eq('id', newSession.user.id);
            } catch (e) {
              console.warn('[Auth] Device token write failed:', e);
            }
          }
          await fetchUserProfile(newSession);
        } else {
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    // Start Phase 1 after registering the listener (avoids missing events)
    initialize();

    return () => {
      mountedRef.current = false;
      clearTimeout(hardTimeoutId);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // ─── Single Device Enforcement Channel ───────────────────────────────────
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Always clean up old channel before creating a new one
    if (deviceChannelRef.current) {
      supabase.removeChannel(deviceChannelRef.current).catch(() => {});
      deviceChannelRef.current = null;
    }

    const ch = supabase
      .channel(`device_guard_${userId}`) // Stable name — no Date.now() — prevents channel accumulation
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const dbToken    = payload.new?.current_session_token;
          const localToken = localStorage.getItem('device_token');
          if (dbToken && localToken && dbToken !== localToken) {
            toast.error('Signed in on another device — logging you out.');
            handleLogout();
          }
        }
      )
      .subscribe();

    deviceChannelRef.current = ch;

    return () => {
      if (deviceChannelRef.current) {
        supabase.removeChannel(deviceChannelRef.current).catch(() => {});
        deviceChannelRef.current = null;
      }
    };
  }, [session?.user?.id, handleLogout]);

  // ─── Context value ────────────────────────────────────────────────────────
  const value = {
    session:         session ?? null,
    userProfile,
    userRole,
    userStatus,
    loading,
    isAdmin,
    isStudent,
    isApprovedAlumni,
    isPendingAlumni,
    handleLogout,
    refetchProfile: () => session && fetchUserProfile(session),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('[useAuth] Must be used inside <AuthProvider>.');
  }
  return ctx;
}
