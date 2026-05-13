/**
 * Instagram Service
 * Handles integration with the Meta Graph API for fetching Instagram posts.
 */

const API_VERSION = 'v19.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

export const instagramService = {
  /**
   * Generates the official Instagram embed URL from a standard shortcode permalink
   * Example: https://www.instagram.com/p/C1234567890/ -> https://www.instagram.com/p/C1234567890/embed
   */
  getEmbedUrl(permalink) {
    if (!permalink) return null;
    try {
      const u = new URL(permalink);
      if (u.pathname.endsWith('embed') || u.pathname.endsWith('embed/')) {
        return permalink;
      }
      return `${u.origin}${u.pathname}${u.pathname.endsWith('/') ? '' : '/'}embed`;
    } catch {
      return null;
    }
  },

  /**
   * Fetches the latest media posts from the connected Instagram Business account.
   * Requires VITE_INSTAGRAM_ACCESS_TOKEN and VITE_INSTAGRAM_USER_ID.
   * 
   * @param {string} token 
   * @param {string} userId 
   * @param {number} limit 
   * @returns {Promise<Array>} Array of posts or throws error
   */
  async fetchLatestPosts(token, userId, limit = 10) {
    if (!token || !userId) {
      throw new Error('Instagram API credentials are missing. Check your Settings.');
    }

    try {
      // Fetch media edges
      const url = `${BASE_URL}/${userId}/media?fields=id,caption,media_type,media_url,thumbnail_url,permalink,timestamp&limit=${limit}&access_token=${token}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Meta Graph API Error');
      }

      // Map graph data to our social_posts structure
      return (data.data || []).map(item => ({
        platform: 'instagram',
        post_url: item.permalink,
        embed_url: this.getEmbedUrl(item.permalink),
        caption: item.caption || '',
        thumbnail: item.media_type === 'VIDEO' ? item.thumbnail_url : item.media_url,
        is_auto_fetched: true,
        created_at: new Date(item.timestamp).toISOString()
      }));

    } catch (err) {
      console.error('[Instagram Service] Error fetching posts:', err);
      throw err;
    }
  }
};
