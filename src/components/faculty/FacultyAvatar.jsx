import { useState } from 'react';

export default function FacultyAvatar({ 
  src, 
  name, 
  className = "w-32 h-32",
  imagePosition = "center 15%" // Prioritize face/upper body
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Faculty')}&background=6366f1&color=fff&size=256&font-size=0.4&bold=true`;

  return (
    <div className={`relative rounded-[2rem] overflow-hidden bg-slate-100 dark:bg-slate-800 border-4 border-white/10 shadow-inner group-hover:border-blue-500/30 transition-all duration-500 ${className}`}>
      {/* Loading Skeleton */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-200 dark:bg-slate-700 animate-pulse" />
      )}
      
      <img
        src={error || !src ? fallbackUrl : src}
        alt={name || 'Faculty Member'}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true);
          setLoaded(true);
        }}
        style={{ objectPosition: imagePosition }}
        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Inner Glow/Shadow Overlay to prevent harsh edges */}
      <div className="absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-black/10 dark:ring-white/10 pointer-events-none" />
    </div>
  );
}
