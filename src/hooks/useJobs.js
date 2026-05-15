import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useJobs — Centralized hook for fetching and subscribing to jobs.
 *
 * Options:
 *   status   — filter by status field (e.g. 'approved')
 *   postedBy — filter by posted_by (alumni UUID)
 *   limit    — max number of results
 */
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
        if (isMounted) setLoading(true);

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
          // Limit to non-expired jobs (last 30 days) when listing all
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
          // Normalize each row for safe rendering:
          // - job_type defaults to 'Full-time' for old rows before migration
          // - skills can be TEXT (string) or TEXT[] (array) depending on migration
          const normalized = (data || []).map(job => ({
            ...job,
            job_type: job.job_type || 'Full-time',
            skills: Array.isArray(job.skills)
              ? job.skills
              : typeof job.skills === 'string' && job.skills
                ? job.skills.split(',').map(s => s.trim()).filter(Boolean)
                : [],
          }));
          setJobs(normalized);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error('[useJobs] Error fetching jobs:', err);
          setError(err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchJobs();

    // Realtime: jobs table must already be in publication (supabase_realtime_setup.sql)
    channel = supabase
      .channel(`jobs_realtime_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'jobs' }, () => {
        fetchJobs();
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, postedBy, limit]);

  return { jobs, loading, error, setJobs };
}
