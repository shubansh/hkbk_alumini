import { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { useLinkedInPosts } from '../hooks/useLinkedInFeed';

// ─── Inline LinkedIn SVG ───────────────────────────────────────────────────────
const LinkedInSVG = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

// ─── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex-shrink-0 w-[min(520px,85vw)] rounded-[1.75rem] bg-gray-100 dark:bg-slate-800 animate-pulse" style={{ height: 590 }} />
);

// ─── Fallback card (shown when embed_url is null) ──────────────────────────────
function FallbackCard({ post }) {
  return (
    <div className="flex-shrink-0 w-[min(520px,85vw)] bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 rounded-[1.75rem] overflow-hidden shadow-xl flex flex-col" style={{ height: 590 }}>
      {/* Gradient top */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 p-10">
        <div className="w-20 h-20 rounded-3xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-xl">
          <LinkedInSVG className="w-10 h-10 text-white" />
        </div>
        <p className="text-white/70 text-sm font-semibold uppercase tracking-widest text-center">HKBK on LinkedIn</p>
        {post.title && <p className="text-white text-xl font-bold text-center leading-snug line-clamp-3">{post.title}</p>}
      </div>
      {/* CTA */}
      <div className="p-6 flex flex-col items-center gap-3">
        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">LinkedIn embed unavailable — view the original post</p>
        <a href={post.post_url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-bold hover:opacity-90 transition shadow-lg shadow-blue-500/20 w-full justify-center">
          View on LinkedIn <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

// ─── Embed card (real LinkedIn iframe) ────────────────────────────────────────
function EmbedCard({ post, isFirst }) {
  const wrapperRef = useRef(null);
  const [visible,  setVisible]  = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const [failed,   setFailed]   = useState(false);
  const [scale,    setScale]    = useState(1);

  // IntersectionObserver — lazy load iframe when card enters viewport
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scale iframe to fit container width on smaller screens
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const measure = () => {
      const containerW = el.offsetWidth;
      setScale(containerW < 504 ? containerW / 504 : 1);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (failed) return <FallbackCard post={post} />;

  const IFRAME_H = 570;
  const scaledH  = Math.round(IFRAME_H * scale);

  return (
    <div className="flex-shrink-0 w-[min(520px,85vw)] rounded-[1.75rem] overflow-hidden shadow-xl bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-white/10 flex flex-col">
      {/* Featured badge */}
      {isFirst && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
          <div className="flex items-center gap-2">
            <LinkedInSVG className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">HKBK on LinkedIn</span>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">★ Featured</span>
        </div>
      )}

      {/* iframe container — scales on mobile */}
      <div ref={wrapperRef} className="relative flex-1 overflow-hidden bg-gray-50 dark:bg-slate-800" style={{ height: scaledH + (isFirst ? 48 : 0) }}>
        {!loaded && visible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-slate-800 z-10">
            <div className="w-8 h-8 border-3 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading LinkedIn post…</p>
          </div>
        )}

        {visible && (
          <div style={{
            width: 504,
            height: IFRAME_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            position: 'absolute',
            top: 0,
            left: 0,
          }}>
            <iframe
              src={post.embed_url}
              width={504}
              height={IFRAME_H}
              frameBorder="0"
              allowFullScreen
              loading="lazy"
              title={`LinkedIn post by HKBK`}
              onLoad={() => setLoaded(true)}
              onError={() => setFailed(true)}
              style={{ border: 'none', display: 'block' }}
            />
          </div>
        )}

        {/* Placeholder before visible */}
        {!visible && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
            <LinkedInSVG className="w-10 h-10 text-blue-400 dark:text-blue-500" />
            <p className="text-xs text-gray-400 font-medium">LinkedIn post</p>
          </div>
        )}
      </div>

      {/* View on LinkedIn footer link */}
      <a href={post.post_url} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 px-5 py-3.5 border-t border-gray-100 dark:border-slate-700 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
        <LinkedInSVG className="w-3.5 h-3.5" /> View on LinkedIn <ExternalLink className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────────
const fadeIn = {
  hidden:  { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};

export default function LinkedInFeedSection() {
  const { posts, loading } = useLinkedInPosts(8);
  const scrollRef  = useRef(null);
  const [isHover,  setIsHover]  = useState(false);
  const [canLeft,  setCanLeft]  = useState(false);
  const [canRight, setCanRight] = useState(true);

  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 10);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
  }, []);

  // Auto-scroll every 5s
  useEffect(() => {
    if (isHover || loading || posts.length <= 1) return;
    const id = setInterval(() => {
      const el = scrollRef.current;
      if (!el) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 20) {
        el.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        el.scrollBy({ left: 540, behavior: 'smooth' });
      }
      setTimeout(updateArrows, 500);
    }, 5000);
    return () => clearInterval(id);
  }, [isHover, loading, posts.length, updateArrows]);

  const scroll = useCallback((dir) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -540 : 540, behavior: 'smooth' });
    setTimeout(updateArrows, 500);
  }, [updateArrows]);

  // Hidden when no posts
  if (!loading && posts.length === 0) return null;

  return (
    <section
      className="py-24 relative overflow-hidden"
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
    >
      {/* Soft background blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violet-500/5 dark:bg-violet-600/10 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial="hidden" whileInView="visible" variants={fadeIn} viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12"
        >
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
              <LinkedInSVG className="w-3.5 h-3.5" /> Official LinkedIn
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Latest From{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-violet-400">
                HKBK LinkedIn
              </span>
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-xl text-lg font-medium">
              Live posts straight from HKBK's official LinkedIn page.
            </p>
          </div>

          {/* Arrow controls */}
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={() => scroll('left')} disabled={!canLeft} aria-label="Scroll left"
              className="w-12 h-12 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all active:scale-90 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button onClick={() => scroll('right')} disabled={!canRight} aria-label="Scroll right"
              className="w-12 h-12 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center transition-all active:scale-90 hover:bg-blue-600 hover:text-white hover:border-blue-600 disabled:opacity-30 disabled:cursor-not-allowed">
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>

        {/* Scroll track */}
        {loading ? (
          <div className="flex gap-5 overflow-hidden">
            {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div
            ref={scrollRef}
            onScroll={updateArrows}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {posts.map((post, idx) =>
              post.embed_url
                ? <EmbedCard key={post.id} post={post} isFirst={idx === 0} />
                : <FallbackCard key={post.id} post={post} />
            )}
          </div>
        )}

        {/* Dot indicators */}
        {!loading && posts.length > 1 && (
          <div className="flex justify-center gap-1.5 mt-6">
            {posts.slice(0, Math.min(posts.length, 8)).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600" />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
