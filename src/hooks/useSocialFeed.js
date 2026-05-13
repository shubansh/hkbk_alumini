import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { socialSyncService } from '../services/social/socialSyncService';
import { linkedinService } from '../services/social/linkedinService';
import { instagramService } from '../services/social/instagramService';

export function useSocialFeed(publicOnly = true, limit = 20) {
  const [posts, setPosts] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [isSetupNeeded, setIsSetupNeeded] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('social_posts').select('*').order('created_at', { ascending: false });
    
    if (publicOnly) {
      query = query.eq('is_visible', true);
    }
    if (limit) {
      query = query.limit(limit);
    }

    const { data, error: err } = await query;
    if (err) {
      // PGRST205 indicates the table or view doesn't exist
      if (err.code === 'PGRST205' || err.message?.includes('does not exist')) {
        setIsSetupNeeded(true);
        setPosts([]);
      } else {
        setError(err.message);
      }
    } else {
      setPosts(data || []);
      setIsSetupNeeded(false);
    }
    
    setLoading(false);
  }, [publicOnly, limit]);

  const fetchSettings = useCallback(async () => {
    const { data, error: err } = await supabase.from('social_settings').select('*').single();
    if (err) {
      if (err.code === 'PGRST205' || err.message?.includes('does not exist')) {
        setIsSetupNeeded(true);
      }
    } else if (data) {
      setSettings(data);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
    if (!publicOnly) fetchSettings();

    const channel = supabase.channel('social-feed-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'social_posts' }, fetchPosts)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [fetchPosts, fetchSettings, publicOnly]);

  // Admin Mutations
  const updateSettings = async (payload) => {
    const { error: err } = await supabase.from('social_settings').update(payload).eq('id', settings.id);
    if (err) throw err;
    await fetchSettings();
  };

  const syncInstagram = async () => {
    setSyncing(true);
    try {
      const res = await socialSyncService.syncInstagram();
      await fetchPosts();
      return res.count;
    } finally {
      setSyncing(false);
    }
  };

  const addManualPost = async (platform, url) => {
    let embedUrl = null;
    if (platform === 'linkedin') embedUrl = linkedinService.parseEmbedUrl(url);
    if (platform === 'instagram') embedUrl = instagramService.getEmbedUrl(url);

    const { error: err } = await supabase.from('social_posts').insert([{
      platform,
      post_url: url,
      embed_url: embedUrl,
      is_visible: true,
      is_auto_fetched: false
    }]);
    if (err) throw err;
    await fetchPosts();
  };

  const deletePost = async (id) => {
    const { error: err } = await supabase.from('social_posts').delete().eq('id', id);
    if (err) throw err;
    await fetchPosts();
  };

  const toggleVisibility = async (id, current) => {
    const { error: err } = await supabase.from('social_posts').update({ is_visible: !current }).eq('id', id);
    if (err) throw err;
  };

  const toggleFeatured = async (id, current) => {
    const { error: err } = await supabase.from('social_posts').update({ is_featured: !current }).eq('id', id);
    if (err) throw err;
  };

  return {
    posts,
    settings,
    loading,
    syncing,
    error,
    isSetupNeeded,
    updateSettings,
    syncInstagram,
    addManualPost,
    deletePost,
    toggleVisibility,
    toggleFeatured,
    refetch: fetchPosts
  };
}
