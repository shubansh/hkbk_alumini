import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useAuth — Central authentication hook.
 * Single source of truth for session, profile, role, and status.
 * Used by App.jsx and any component needing auth state.
 */
export function useAuth() {
  const [session, setSession]       = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading]       = useState(true);

  // ─── Derived values ──────────────────────────────────────────────────────
  const userRole         = userProfile?.role   ?? null;
  const userStatus       = userProfile?.status ?? null;
  const isAdmin          = userRole === 'admin';
  const isStudent        = userRole === 'student';
  const isApprovedAlumni = userRole === 'alumni' && (userProfile?.is_approved === true || userStatus === 'approved');
  const isPendingAlumni  = userRole === 'alumni' && !isApprovedAlumni;

  // ─── Profile fetch with retry + metadata fallback ────────────────────────
  const fetchUserProfile = useCallback(async (session, attempt = 1) => {
    const MAX = 3;
    try {
      const userId = session.user.id;
      console.log(`[Auth] Fetching profile attempt ${attempt}/${MAX} uid:${userId}`);

      const { data, error } = await supabase
        .from('profiles')
        .select('role, status, is_approved, full_name, avatar_url, current_session_token')
        .eq('id', userId)
        .maybeSingle();

      if (data?.role) {
        console.log(`[Auth] DB → role:${data.role} status:${data.status} is_approved:${data.is_approved}`);
        setUserProfile(data);
        setLoading(false);
        return;
      }

      if (error) console.error(`[Auth] DB error (attempt ${attempt}):`, error.message);
      else console.warn(`[Auth] Profile row not found (attempt ${attempt})`);

      // Retry with backoff
      if (attempt < MAX) {
        await new Promise(r => setTimeout(r, attempt * 1200));
        await fetchUserProfile(session, attempt + 1);
        return;
      }

      // Final fallback: auth metadata
      const meta     = session.user.user_metadata;
      const metaRole = meta?.role;
      if (metaRole) {
        const metaStatus = metaRole === 'alumni' ? 'pending' : 'approved';
        console.log(`[Auth] Metadata fallback → role:${metaRole}`);
        setUserProfile({
          role:        metaRole,
          status:      metaStatus,
          is_approved: metaRole !== 'alumni',
          full_name:   meta?.full_name ?? session.user.email?.split('@')[0] ?? 'User',
          avatar_url:  null,
        });
      } else {
        console.error('[Auth] No role found anywhere');
        setUserProfile({ role: null, status: null, is_approved: false });
      }
    } catch (err) {
      console.error('[Auth] Unexpected error:', err);
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, attempt * 1200));
        await fetchUserProfile(session, attempt + 1);
        return;
      }
      setUserProfile({ role: null, status: null, is_approved: false });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut({ scope: 'local' });
      await supabase.removeAllChannels(); // Clean all realtime listeners
    } catch (e) {
      console.warn('Signout error', e);
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      setUserProfile(null);
      setSession(null);
      window.location.href = '/login'; // Hard redirect kills all stale state
    }
  }, []);

  // ─── Hard Timeout Fallback ───────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // ─── Bootstrap ───────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      if (session) fetchUserProfile(session);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      setSession(session);
      
      if (session) {
        if (_event === 'SIGNED_IN') {
          // Generate a new device token for single-device login enforcement
          const newToken = crypto.randomUUID();
          localStorage.setItem('device_token', newToken);
          await supabase.from('profiles').update({ current_session_token: newToken }).eq('id', session.user.id);
        }
        fetchUserProfile(session);
      } else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  // ─── Single Device Login Enforcement ─────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) return;

    const profileChannel = supabase
      .channel(`single_device_login_${session.user.id}_${Date.now()}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${session.user.id}` }, (payload) => {
        const dbToken = payload.new.current_session_token;
        const localToken = localStorage.getItem('device_token');
        
        if (dbToken && localToken && dbToken !== localToken) {
          import('react-hot-toast').then(toast => {
            toast.default.error('Your account was logged in on another device. You have been logged out.');
          });
          handleLogout();
        }
      })
      .subscribe();

    return () => {
      profileChannel.unsubscribe();
      supabase.removeChannel(profileChannel);
    };
  }, [session?.user?.id, handleLogout]);

  return {
    session,
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
}
