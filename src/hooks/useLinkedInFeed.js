import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────────────────────
/**
 * parseLinkedInEmbedUrl(rawUrl)
 *
 * Converts any standard LinkedIn post URL into the official embed iframe URL.
 *
 * Supported patterns:
 *  1. /posts/company_title_activity-1234567890-XYZ  → urn:li:activity:1234567890
 *  2. /feed/update/urn:li:activity:1234567890       → direct extraction
 *  3. /posts/company_ugcPost:1234567890             → urn:li:ugcPost:1234567890
 *  4. Already an embed URL                          → returned as-is
 *
 * Returns null if URL cannot be parsed (triggers fallback card).
 */
export function parseLinkedInEmbedUrl(rawUrl) {
  if (!rawUrl || typeof rawUrl !== 'string') return null;
  const url = rawUrl.trim();
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('linkedin.com')) return null;

    // Already an embed URL — return as-is
    if (u.pathname.startsWith('/embed/feed/update/')) {
      return `https://www.linkedin.com${u.pathname}`;
    }

    // Pattern: /feed/update/urn:li:TYPE:ID
    const feedMatch = u.pathname.match(/\/feed\/update\/(urn:li:[a-zA-Z]+:\d+)/);
    if (feedMatch) {
      return `https://www.linkedin.com/embed/feed/update/${feedMatch[1]}`;
    }

    // Pattern: activity-ID or activity:ID  (most common in /posts/ URLs)
    const activityMatch = url.match(/activity[-:](\d{10,})/i);
    if (activityMatch) {
      return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityMatch[1]}`;
    }

    // Pattern: ugcPost:ID or ugcPost-ID
    const ugcMatch = url.match(/ugcPost[-:](\d{10,})/i);
    if (ugcMatch) {
      return `https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:${ugcMatch[1]}`;
    }

    // Pattern: share:ID  (older LinkedIn share links)
    const shareMatch = url.match(/\/share\/(\d{10,})/);
    if (shareMatch) {
      return `https://www.linkedin.com/embed/feed/update/urn:li:share:${shareMatch[1]}`;
    }

    return null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useLinkedInPosts(limit)
 * Public hook — fetches active posts for the homepage section.
 */
export function useLinkedInPosts(limit = 10) {
  const [posts,   setPosts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('linkedin_posts')
          .select('id, post_url, embed_url, title, is_active, created_at')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (cancelled) return;
        if (err) { setError(err.message); setPosts([]); }
        else {
          // For posts without embed_url stored, compute it client-side
          const enriched = (data ?? []).map(p => ({
            ...p,
            embed_url: p.embed_url || parseLinkedInEmbedUrl(p.post_url),
          }));
          setPosts(enriched);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [limit]);

  return { posts, loading, error };
}

// ─────────────────────────────────────────────────────────────────────────────
/**
 * useAdminLinkedInPosts()
 * Admin hook — all posts with real-time updates + mutations.
 */
export function useAdminLinkedInPosts() {
  const [posts,      setPosts]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('linkedin_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) setError(err.message);
    else setPosts(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel('linkedin-posts-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'linkedin_posts' }, fetchAll)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, [fetchAll]);

  const insertPost = useCallback(async (payload) => {
    setSubmitting(true);
    const { error: err } = await supabase.from('linkedin_posts').insert([payload]);
    setSubmitting(false);
    if (err) throw err;
    await fetchAll();
  }, [fetchAll]);

  const updatePost = useCallback(async (id, payload) => {
    setSubmitting(true);
    const { error: err } = await supabase.from('linkedin_posts').update(payload).eq('id', id);
    setSubmitting(false);
    if (err) throw err;
    await fetchAll();
  }, [fetchAll]);

  const deletePost = useCallback(async (id) => {
    const { error: err } = await supabase.from('linkedin_posts').delete().eq('id', id);
    if (err) throw err;
    await fetchAll();
  }, [fetchAll]);

  const toggleActive = useCallback(async (id, current) => {
    const { error: err } = await supabase
      .from('linkedin_posts').update({ is_active: !current }).eq('id', id);
    if (err) throw err;
    await fetchAll();
  }, [fetchAll]);

  return { posts, loading, error, submitting, refetch: fetchAll, insertPost, updatePost, deletePost, toggleActive };
}
