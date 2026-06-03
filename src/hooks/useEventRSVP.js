import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useEventRSVP(eventId) {
  const { session } = useAuth();
  const [rsvpStatus, setRsvpStatus] = useState(null); // 'going', 'interested', 'not_going', or null
  const [qrToken, setQrToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRSVP = useCallback(async () => {
    if (!session?.user?.id || !eventId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('event_rsvps')
      .select('status, qr_code_token')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!error && data) {
      setRsvpStatus(data.status);
      setQrToken(data.qr_code_token);
    } else {
      setRsvpStatus(null);
      setQrToken(null);
    }
    setLoading(false);
  }, [eventId, session]);

  useEffect(() => {
    fetchRSVP();
  }, [fetchRSVP]);

  const updateRSVP = async (status) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to RSVP.');
      return;
    }

    const payload = {
      event_id: eventId,
      user_id: session.user.id,
      status
    };

    const { error } = await supabase
      .from('event_rsvps')
      .upsert(payload, { onConflict: 'event_id, user_id' });

    if (error) {
      toast.error('Failed to save RSVP.');
      console.error(error);
    } else {
      toast.success(`RSVP updated: ${status.replace('_', ' ').toUpperCase()}`);
      fetchRSVP(); // Refetch to get QR token if generated
    }
  };

  return { rsvpStatus, qrToken, loading, updateRSVP };
}

export function useEventStats(eventId) {
  const [stats, setStats] = useState({ going: 0, interested: 0, total: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('event_rsvps')
      .select('status')
      .eq('event_id', eventId);

    if (!error && data) {
      const going = data.filter(r => r.status === 'going').length;
      const interested = data.filter(r => r.status === 'interested').length;
      setStats({ going, interested, total: data.length });
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchStats();
    const ch = supabase.channel(`stats-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_rsvps', filter: `event_id=eq.${eventId}` }, fetchStats)
      .subscribe();
      
    return () => supabase.removeChannel(ch);
  }, [fetchStats, eventId]);

  return { stats, loading };
}
