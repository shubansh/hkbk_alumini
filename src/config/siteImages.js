/**
 * siteImages.js — Centralized image path config for HKBK Connect
 *
 * ══════════════════════════════════════════════════════════════
 * HOW TO REPLACE AN IMAGE  (zero code changes required):
 *
 *   1. Drop new file into the correct /public/images/ folder
 *   2. Give it the EXACT same filename shown below
 *   3. Bump IMAGE_VERSION by 1  (forces browser to reload)
 *   4. Refresh browser → new image appears instantly
 *
 * SUPPORTED FORMATS:  .jpg  .jpeg  .png  .webp
 * ══════════════════════════════════════════════════════════════
 *
 * FOLDER MAP:
 *  /public/images/hero/     — large hero / banner images
 *  /public/images/campus/   — about section, campus shots
 *  /public/images/contact/  — contact section images
 *  /public/images/about/    — additional about-page images
 *  /public/images/gallery/  — static (non-Supabase) gallery images
 */

// ─── Cache-bust version ────────────────────────────────────────────────────────
// Increment this number EVERY TIME you replace an image file.
// This forces the browser to download the new file instead of using its cache.
const V = 2;   // ← bump this after each image replacement

// ─── Image paths ──────────────────────────────────────────────────────────────
// NOTE: paths must exactly match the filenames inside /public/images/

export const HERO_IMAGE    = `/images/hero/main.jpg?v=${V}`;

// Focal point for the hero image — controls which part stays visible when cropped.
// Format: "X% Y%"  — 50% 50% = dead center, 50% 70% = center-lower area.
// Adjust Y upward (lower %) to reveal the top, downward (higher %) to reveal the bottom.
// Focal point for the hero image
// X = 50% keeps landmark centered, Y = 72% targets the I ❤️ HKBK area.
export const HERO_FOCAL_POINT = '50% 72%';
export const ABOUT_IMAGE   = `/images/campus/about.png?v=${V}`;
export const CONTACT_IMAGE = `/images/contact/contact.jpg?v=${V}`;

// ─── Fallback images ──────────────────────────────────────────────────────────
// Shown ONLY when the primary image above fails to load (file missing / 404).
export const FALLBACKS = {
  hero:    'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=2070&auto=format&fit=crop',
  campus:  'https://images.unsplash.com/photo-1541339907198-e08756ebafe1?q=80&w=2070&auto=format&fit=crop',
  contact: 'https://images.unsplash.com/photo-1577412647305-991150c7d163?q=80&w=2070&auto=format&fit=crop',
  generic: 'https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2070&auto=format&fit=crop',
};
