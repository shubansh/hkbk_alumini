/**
 * OptimizedImage — Drop-in <img> replacement with:
 *  - Lazy loading (native browser lazy + eager option for above-fold)
 *  - Configurable fallback when primary src fails (404 / missing file)
 *  - object-cover by default — no distortion, no overflow
 *  - Smooth fade-in on load
 *  - Animated skeleton placeholder while loading
 *  - Dev-mode console logging of actual src being rendered
 *  - Focal-point positioning via objectPosition prop
 *  - Optional Ken Burns slow-zoom animation for hero use
 *
 * Props:
 *  src              — primary path (from siteImages.js)
 *  fallbackSrc      — shown if src 404s (defaults to FALLBACKS.generic)
 *  alt              — accessibility label
 *  className        — extra classes on the <img> itself
 *  wrapperClassName — classes on the outer <div> (controls size / aspect)
 *  fit              — 'cover' (default) | 'contain' | 'fill'
 *  objectPosition   — CSS object-position value, e.g. "center 70%"
 *                     Controls which part of the image stays visible when cropped.
 *                     Defaults to "center center".
 *  kenBurns         — true | false (default). Adds a subtle 22s slow-zoom loop.
 *                     Ideal for hero backgrounds. Uses GPU transform only.
 *  lazy             — true (default) | false  (set false for above-fold hero)
 *  showSkeleton     — animate placeholder while loading (default true)
 */

import { useState, useEffect } from 'react';
import { FALLBACKS } from '../config/siteImages';

const IS_DEV = import.meta.env.DEV;

export default function OptimizedImage({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  wrapperClassName = '',
  fit = 'cover',
  objectPosition = 'center center',
  kenBurns = false,
  lazy = true,
  showSkeleton = true,
  ...rest
}) {
  const [imgSrc, setImgSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  // Re-sync when parent updates src (e.g. after cache-version bump)
  useEffect(() => {
    setImgSrc(src);
    setLoaded(false);
    setErrored(false);
  }, [src]);

  // Dev: log what URL the browser actually fetches
  useEffect(() => {
    if (IS_DEV) {
      console.log(`[OptimizedImage] src → ${imgSrc}  position → ${objectPosition}`);
    }
  }, [imgSrc, objectPosition]);

  const fitClass = { cover: 'object-cover', contain: 'object-contain', fill: 'object-fill' }[fit] ?? 'object-cover';

  const handleError = () => {
    if (!errored) {
      setErrored(true);
      const fb = fallbackSrc || FALLBACKS.generic;
      if (IS_DEV) console.warn(`[OptimizedImage] Failed to load "${imgSrc}" — falling back to: ${fb}`);
      setImgSrc(fb);
    }
  };

  return (
    <div className={`relative overflow-hidden ${wrapperClassName}`}>
      {/* Skeleton — hidden once image loads */}
      {showSkeleton && !loaded && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 bg-gray-200 dark:bg-slate-700 animate-pulse rounded-[inherit]"
        />
      )}

      <img
        src={imgSrc}
        alt={alt}
        loading={lazy ? 'lazy' : 'eager'}
        decoding="async"
        onError={handleError}
        onLoad={() => setLoaded(true)}
        style={{ objectPosition }}
        className={[
          'w-full h-full',
          fitClass,
          kenBurns ? 'hero-ken-burns' : '',
          'transition-opacity duration-700',
          loaded ? 'opacity-100' : 'opacity-0',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      />
    </div>
  );
}
