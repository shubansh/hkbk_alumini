import { supabase } from '../../lib/supabase';
import { instagramService } from './instagramService';

export const socialSyncService = {
  /**
   * Syncs Instagram posts. Pulls from API and upserts into Supabase.
   */
  async syncInstagram() {
    try {
      // 1. Fetch settings to get tokens
      const { data: settings, error: settingsErr } = await supabase
        .from('social_settings')
        .select('instagram_access_token, instagram_user_id, instagram_enabled')
        .single();
        
      if (settingsErr) throw new Error('Could not load social settings.');
      if (!settings?.instagram_enabled) throw new Error('Instagram sync is disabled in settings.');
      if (!settings?.instagram_access_token || !settings?.instagram_user_id) {
        throw new Error('Instagram API credentials are not configured.');
      }

      // 2. Fetch from Meta API
      const newPosts = await instagramService.fetchLatestPosts(
        settings.instagram_access_token,
        settings.instagram_user_id,
        20 // fetch up to 20 recent
      );

      if (!newPosts || newPosts.length === 0) return { count: 0 };

      // 3. Upsert into Supabase (match on post_url to avoid duplicates if possible, 
      // though Supabase might need a unique constraint. We'll check for existing first).
      
      // Fetch existing IG urls
      const { data: existing } = await supabase
        .from('social_posts')
        .select('post_url')
        .eq('platform', 'instagram');
        
      const existingUrls = new Set((existing || []).map(p => p.post_url));
      
      const toInsert = newPosts.filter(p => !existingUrls.has(p.post_url));

      if (toInsert.length > 0) {
        const { error: insertErr } = await supabase.from('social_posts').insert(toInsert);
        if (insertErr) throw insertErr;
      }

      return { count: toInsert.length };

    } catch (err) {
      console.error('[Sync Service] Instagram Sync Failed:', err);
      throw err;
    }
  }
};
