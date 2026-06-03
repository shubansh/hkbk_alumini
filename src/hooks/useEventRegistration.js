import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export function useEventRegistration(eventId) {
  const { session } = useAuth();
  const [registrationStatus, setRegistrationStatus] = useState(null); // 'registered', 'cancelled', or null
  const [qrToken, setQrToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchRegistration = useCallback(async () => {
    if (!session?.user?.id || !eventId) return;
    setLoading(true);
    
    const { data, error } = await supabase
      .from('event_registrations')
      .select('registration_status, qr_code')
      .eq('event_id', eventId)
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (!error && data) {
      setRegistrationStatus(data.registration_status);
      setQrToken(data.qr_code);
    } else {
      setRegistrationStatus(null);
      setQrToken(null);
    }
    setLoading(false);
  }, [eventId, session]);

  useEffect(() => {
    fetchRegistration();
  }, [fetchRegistration]);

  const updateRegistration = async (status) => {
    if (!session?.user?.id) {
      toast.error('You must be logged in to register.');
      return;
    }

    const payload = {
      event_id: eventId,
      user_id: session.user.id,
      registration_status: status
    };

    const { error } = await supabase
      .from('event_registrations')
      .upsert(payload, { onConflict: 'event_id, user_id' });

    if (error) {
      toast.error('Failed to save registration.');
      console.error(error);
    } else {
      toast.success(status === 'registered' ? 'Successfully registered!' : 'Registration cancelled.');
      fetchRegistration(); // Refetch to get QR token if generated
    }
  };

  return { registrationStatus, qrToken, loading, updateRegistration };
}

export function useEventStats(eventId) {
  const [stats, setStats] = useState({ registered: 0, capacity: null });
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    
    // Fetch registered count
    const { data: regData, error: regError } = await supabase
      .from('event_registrations')
      .select('registration_status')
      .eq('event_id', eventId);

    // Fetch capacity
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('capacity')
      .eq('id', eventId)
      .single();

    if (!regError && !eventError) {
      const registered = regData?.filter(r => r.registration_status === 'registered').length || 0;
      setStats({ registered, capacity: eventData?.capacity });
    }
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    fetchStats();
    
    const ch = supabase.channel(`stats-${eventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'event_registrations', filter: `event_id=eq.${eventId}` }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events', filter: `id=eq.${eventId}` }, fetchStats)
      .subscribe();
      
    return () => supabase.removeChannel(ch);
  }, [fetchStats, eventId]);

  return { stats, loading };
}
