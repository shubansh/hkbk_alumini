/**
 * AuthContext.jsx — Centralized, production-grade authentication provider.
 *
 * Architecture decisions:
 * - Single `onAuthStateChange` listener registered once at mount, never duplicated.
 * - `getSession()` is NOT called separately; we rely solely on `onAuthStateChange`
 *   which fires `INITIAL_SESSION` on mount with the restored session (Supabase v2 behavior).
 * - A hard 8-second timeout ensures the app never freezes indefinitely.
 * - Profile fetch is guarded by a `mounted` flag to prevent setState-after-unmount.
 * - The single-device enforcement channel is managed here (not in child components).
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession]       = useState(undefined); // undefined = not yet initialized
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]       = useState(true);

  // Use a ref to track mount state safely across async boundaries
  const mountedRef = useRef(true);
  // Track the single-device channel so we can clean it up on logout
  const deviceChannelRef = useRef(null);

  // ─── Derived values ──────────────────────────────────────────────────────
  const userRole         = userProfile?.role   ?? null;
  const userStatus       = userProfile?.status ?? null;
  const isAdmin          = userRole === 'admin';
  const isStudent        = userRole === 'student';
  const isApprovedAlumni = userRole === 'alumni' && (userProfile?.is_approved === true || userStatus === 'approved');
  const isPendingAlumni  = userRole === 'alumni' && !isApprovedAlumni;

  // ─── Profile fetch ────────────────────────────────────────────────────────
  const fetchUserProfile = useCallback(async (currentSession) => {
    if (!currentSession?.user?.id) {
      if (mountedRef.current) {
        setUserProfile(null);
        setLoading(false);
      }
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, role, status, is_approved, full_name, avatar_url, current_session_token')
        .eq('id', currentSession.user.id)
        .maybeSingle();

      if (!mountedRef.current) return;

      if (data?.role) {
        setUserProfile(data);
        setLoading(false);
        return;
      }

      if (error) {
        console.error('[Auth] Profile fetch DB error:', error.message);
      } else {
        console.warn('[Auth] Profile row not found for user:', currentSession.user.id);
      }

      // Fallback: use auth metadata embedded during signup
      const meta = currentSession.user.user_metadata;
      const metaRole = meta?.role;

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
        // Profile genuinely missing — set null role so AccountErrorPage shows
        setUserProfile({ id: currentSession.user.id, role: null, status: null, is_approved: false });
      }
    } catch (err) {
      console.error('[Auth] Unexpected profile fetch error:', err);
      if (mountedRef.current) {
        setUserProfile({ role: null, status: null, is_approved: false });
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []); // No deps — stable function, uses ref for mounted check

  // ─── Logout ───────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    // Clean up device channel first
    if (deviceChannelRef.current) {
      try {
        await supabase.removeChannel(deviceChannelRef.current);
      } catch (_) {}
      deviceChannelRef.current = null;
    }

    try {
      await supabase.auth.signOut({ scope: 'local' });
      // Remove all other realtime channels
      await supabase.removeAllChannels();
    } catch (e) {
      console.warn('[Auth] Signout error:', e);
    } finally {
      // Clear all stored state
      try { localStorage.clear(); } catch (_) {}
      try { sessionStorage.clear(); } catch (_) {}

      // Reset React state before redirect
      if (mountedRef.current) {
        setUserProfile(null);
        setSession(null);
      }

      // Hard redirect — kills all stale component state
      window.location.replace('/login');
    }
  }, []);

  // ─── Core Auth Listener (single, stable, registered once) ────────────────
  useEffect(() => {
    mountedRef.current = true;

    // Hard timeout: if auth initialization takes >8 seconds, unblock the UI.
    // Uses a ref-based flag so we don't read stale `loading` state from closure.
    const timeoutId = setTimeout(() => {
      if (mountedRef.current) {
        console.warn('[Auth] Session initialization timed out after 8s. Unblocking UI.');
        setLoading(false);
        // If session is still undefined after timeout, set it to null
        setSession(prev => prev === undefined ? null : prev);
      }
    }, 8000);

    /**
     * `onAuthStateChange` is the SINGLE source of truth.
     * On page load, Supabase fires `INITIAL_SESSION` with the restored session
     * (or null if logged out). We do NOT call `getSession()` separately to
     * avoid the race condition where two concurrent calls both set state.
     */
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mountedRef.current) return;

        console.log(`[Auth] Event: ${event}`, newSession ? 'session exists' : 'no session');

        // Clear the timeout since auth has responded
        clearTimeout(timeoutId);

        // Update session state
        setSession(newSession);

        if (newSession) {
          if (event === 'SIGNED_IN') {
            // Enforce single-device login: write a unique token to the profile
            try {
              const newToken = crypto.randomUUID();
              localStorage.setItem('device_token', newToken);
              await supabase
                .from('profiles')
                .update({ current_session_token: newToken })
                .eq('id', newSession.user.id);
            } catch (e) {
              console.warn('[Auth] Could not write device token:', e);
            }
          }
          // Fetch the full profile for every auth event that has a session
          await fetchUserProfile(newSession);
        } else {
          // Signed out or session expired
          setUserProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]); // fetchUserProfile is stable (no deps in useCallback)

  // ─── Single Device Login Enforcement (separate effect, clean lifecycle) ───
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    // Remove old channel if session user changed
    if (deviceChannelRef.current) {
      supabase.removeChannel(deviceChannelRef.current).catch(() => {});
      deviceChannelRef.current = null;
    }

    const channel = supabase
      .channel(`device_guard_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` },
        (payload) => {
          const dbToken    = payload.new?.current_session_token;
          const localToken = localStorage.getItem('device_token');

          if (dbToken && localToken && dbToken !== localToken) {
            toast.error('Your account was signed in on another device. You have been logged out.');
            handleLogout();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.warn('[Auth] Device guard channel error');
        }
      });

    deviceChannelRef.current = channel;

    return () => {
      if (deviceChannelRef.current) {
        supabase.removeChannel(deviceChannelRef.current).catch(() => {});
        deviceChannelRef.current = null;
      }
    };
  }, [session?.user?.id, handleLogout]);

  // ─── Context value ────────────────────────────────────────────────────────
  const value = {
    session:         session ?? null, // normalize undefined → null for consumers
    userProfile,
    userRole,
    userStatus,
    loading,
    isAdmin,
    isStudent,
    isApprovedAlumni,
    isPendingAlumni,
    handleLogout,
    refetchProfile:  () => session && fetchUserProfile(session),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('[useAuth] Must be used inside <AuthProvider>. Check your component tree.');
  }
  return context;
}
