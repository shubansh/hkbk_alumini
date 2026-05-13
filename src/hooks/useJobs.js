import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useJobs(options = {}) {
  const { status, postedBy, limit } = options;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let channel;

    const fetchJobs = async () => {
      try {
        setLoading(true);
        let query = supabase
          .from('jobs')
          .select('*, profiles(full_name, course_name, course_category)')
          .order('created_at', { ascending: false });

        if (status) {
          query = query.eq('status', status);
        }
        
        if (postedBy) {
          query = query.eq('posted_by', postedBy);
        } else {
          // If not filtering by specific user, usually we want non-expired jobs
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          query = query.gte('created_at', thirtyDaysAgo.toISOString());
        }

        if (limit) {
          query = query.limit(limit);
        }

        const { data, error: fetchError } = await query;
        
        if (fetchError) throw fetchError;
        
        if (isMounted) {
          setJobs(data || []);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Error fetching jobs:", err);
          setError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJobs();

    // Setup realtime subscription
    channel = supabase
      .channel(`jobs_realtime_${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'jobs'
      }, async (payload) => {
        // When a job changes, simplest is to refetch to ensure profiles join is fresh
        // For pure inserts without join we could append, but we need profiles info.
        fetchJobs();
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [status, postedBy, limit]);

  return { jobs, loading, error, setJobs };
}
