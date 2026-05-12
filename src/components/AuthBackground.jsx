import { GraduationCap } from 'lucide-react';
import { useCampusImage } from '../hooks/useHomeData';

/**
 * AuthBackground — Left panel for Login & Signup pages.
 *
 * Fetches a random campus image from gallery_images table.
 * Falls back to gradient-only if no images have been uploaded yet.
 *
 * Props:
 *   title    — Main heading text
 *   subtitle — Subheading text
 */
export default function AuthBackground({ title, subtitle }) {
  const { imageUrl, loading } = useCampusImage();

  return (
    <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden">
      {/* Dynamic campus image — z-0 so overlay sits above it */}
      {!loading && imageUrl && (
        <img
          src={imageUrl}
          alt="HKBK Campus"
          className="absolute inset-0 w-full h-full object-cover z-0 blur-[2px] scale-105"
          loading="eager"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Skeleton shimmer while loading */}
      {loading && (
        <div className="absolute inset-0 z-0 bg-slate-800 animate-pulse" />
      )}

      {/* Dark overlay — z-10 above image, below content */}
      <div className="absolute inset-0 z-10 bg-slate-950/40 backdrop-blur-[1px]" />
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent" />
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-blue-600/30 via-transparent to-transparent" />

      {/* Decorative blur orbs — z-10 */}
      <div className="absolute top-[-10%] left-[-10%] w-80 h-80 bg-blue-500 rounded-full blur-[100px] opacity-20 pointer-events-none z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-80 h-80 bg-purple-500 rounded-full blur-[100px] opacity-20 pointer-events-none z-10" />

      {/* Content */}
      <div className="relative z-20 flex flex-col justify-between w-full p-10 text-white">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-blue-300" />
          </div>
          <div>
            <p className="font-black text-white text-lg leading-none">HKBK</p>
            <p className="text-blue-300 text-xs font-medium">Connect</p>
          </div>
        </div>

        {/* Middle text */}
        <div>
          <h1 className="text-4xl font-black leading-tight mb-4">{title}</h1>
          <p className="text-blue-100/80 text-lg leading-relaxed">{subtitle}</p>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3 mt-8">
            {['10K+ Alumni', '500+ Jobs', '200+ Mentors'].map(b => (
              <span key={b} className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-semibold text-blue-100 backdrop-blur-sm">
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-blue-300/60 text-xs">
          © {new Date().getFullYear()} HKBK College of Engineering. All rights reserved.
        </p>
      </div>
    </div>
  );
}
