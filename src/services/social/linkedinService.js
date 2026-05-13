/**
 * LinkedIn Service
 * Handles parsing and extraction of public LinkedIn posts into embed URLs.
 * Works entirely client-side without API tokens using LinkedIn's standard embed format.
 */

export const linkedinService = {
  /**
   * Converts any standard LinkedIn post URL into the official iframe embed URL.
   *
   * Supported patterns:
   *  1. /posts/company_title_activity-1234567890-XYZ  → urn:li:activity:1234567890
   *  2. /feed/update/urn:li:activity:1234567890       → direct extraction
   *  3. /posts/company_ugcPost:1234567890             → urn:li:ugcPost:1234567890
   *  4. Already an embed URL                          → returned as-is
   *
   * @param {string} rawUrl 
   * @returns {string|null} embed URL or null if invalid
   */
  parseEmbedUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const url = rawUrl.trim();
    try {
      const u = new URL(url);
      if (!u.hostname.endsWith('linkedin.com')) return null;

      if (u.pathname.startsWith('/embed/feed/update/')) {
        return `https://www.linkedin.com${u.pathname}`;
      }

      const feedMatch = u.pathname.match(/\/feed\/update\/(urn:li:[a-zA-Z]+:\d+)/);
      if (feedMatch) {
        return `https://www.linkedin.com/embed/feed/update/${feedMatch[1]}`;
      }

      const activityMatch = url.match(/activity[-:](\d{10,})/i);
      if (activityMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:activity:${activityMatch[1]}`;
      }

      const ugcMatch = url.match(/ugcPost[-:](\d{10,})/i);
      if (ugcMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:ugcPost:${ugcMatch[1]}`;
      }

      const shareMatch = url.match(/\/share\/(\d{10,})/);
      if (shareMatch) {
        return `https://www.linkedin.com/embed/feed/update/urn:li:share:${shareMatch[1]}`;
      }

      return null;
    } catch {
      return null;
    }
  },

  /**
   * Simple validation check
   */
  isValidUrl(url) {
    return this.parseEmbedUrl(url) !== null;
  }
};
