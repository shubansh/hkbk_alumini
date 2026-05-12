import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// ─── Internal helper ──────────────────────────────────────────────────────────
function useQuery(queryFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    queryFn()
      .then(result => { if (!cancelled) { setData(result); setLoading(false); } })
      .catch(err  => { if (!cancelled) { setError(err); setLoading(false); } });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useCampusImage()
 * Fetches one random "campus" image from gallery_images.
 * Used by AuthBackground for Login/Signup dynamic backgrounds.
 */
export function useCampusImage() {
  const [imageUrl, setImageUrl] = useState(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function fetch() {
      try {
        const { data } = await supabase
          .from('gallery_images')
          .select('image_url')
          .eq('category', 'campus')
          .order('created_at', { ascending: false })
          .limit(6);

        if (!cancelled) {
          if (data && data.length > 0) {
            // Pick a random image from the latest 6
            const pick = data[Math.floor(Math.random() * data.length)];
            setImageUrl(pick.image_url);
          }
          setLoading(false);
        }
      } catch (_) {
        if (!cancelled) setLoading(false);
      }
    }
    fetch();
    return () => { cancelled = true; };
  }, []);

  return { imageUrl, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * usePlatformStats()
 * Live counts for Hero stat cards.
 */
export function usePlatformStats() {
  const [stats,   setStats]   = useState({ alumni: 0, jobs: 0, mentors: 0, events: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [
          { count: alumniCount },
          { count: jobsCount },
          { count: eventsCount },
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true })
            .eq('role', 'alumni').eq('is_approved', true),
          supabase.from('jobs').select('*', { count: 'exact', head: true })
            .eq('status', 'approved'),
          supabase.from('events').select('*', { count: 'exact', head: true }),
        ]);
        if (!cancelled) {
          const al = alumniCount ?? 0;
          setStats({ alumni: al, jobs: jobsCount ?? 0, mentors: Math.round(al * 0.2), events: eventsCount ?? 0 });
          setLoading(false);
        }
      } catch (_) {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  return { ...stats, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useFeaturedAlumni(limit)
 * Returns approved alumni profiles for homepage spotlight.
 */
export function useFeaturedAlumni(limit = 6) {
  const [alumni,  setAlumni]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await supabase
          .from('profiles')
          .select('id,full_name,avatar_url,company,job_title,course_name')
          .eq('role', 'alumni')
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!cancelled) { setAlumni(data ?? []); setLoading(false); }
      } catch (_) {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { alumni, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useFeaturedFaculty(limit)
 *
 * BUG FIX: Previously filtered is_visible AND is_featured — too restrictive.
 * Now fetches ALL visible faculty, sorted so featured ones appear first.
 * A faculty member only needs is_visible=true to appear on the homepage.
 */
export function useFeaturedFaculty(limit = 6) {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await supabase
          .from('faculty')
          .select('*')
          .eq('is_visible', true)          // ← FIXED: removed is_featured filter
          .order('is_featured', { ascending: false }) // featured first
          .order('name', { ascending: true })
          .limit(limit);
        if (!cancelled) { setFaculty(data ?? []); setLoading(false); }
      } catch (_) {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { faculty, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useGalleryImages(limit, category)
 * Fetches gallery images for the homepage gallery section.
 * category: 'all' | 'campus' | 'events'
 */
export function useGalleryImages(limit = 8, category = 'all') {
  const [images,  setImages]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        let query = supabase
          .from('gallery_images')
          .select('id,title,image_url,category,created_at')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (category !== 'all') query = query.eq('category', category);

        const { data, error } = await query;
        if (!cancelled) { 
          if (error) {
            console.error('[useGalleryImages] Error:', error);
            setImages([]);
          } else {
            setImages(Array.isArray(data) ? data : []); 
          }
          setLoading(false); 
        }
      } catch (_) {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit, category]);

  return { images, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useLatestJobs(limit)
 */
export function useLatestJobs(limit = 4) {
  const [jobs,    setJobs]    = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'approved')
          .order('created_at', { ascending: false })
          .limit(limit);
        if (!cancelled) { setJobs(data ?? []); setLoading(false); }
      } catch (_) {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { jobs, loading };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useUpcomingEvents(limit)
 */
export function useUpcomingEvents(limit = 3) {
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data } = await supabase
          .from('events')
          .select('*')
          .gte('date', new Date().toISOString())
          .order('date', { ascending: true })
          .limit(limit);
        if (!cancelled) { setEvents(data ?? []); setLoading(false); }
      } catch (_) {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { events, loading };
}
