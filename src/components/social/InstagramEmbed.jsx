import { useState, useEffect } from 'react';

export default function InstagramEmbed({ embedUrl, fallbackImage }) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-gray-50 dark:bg-slate-900 rounded-[2rem] overflow-hidden flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-slate-900 z-10 animate-pulse">
          <div className="w-8 h-8 border-4 border-pink-400 border-t-pink-600 rounded-full animate-spin" />
        </div>
      )}
      
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full border-0"
        allowTransparency="true"
        allow="encrypted-media"
        onLoad={() => setLoading(false)}
        title="Instagram Post Embed"
      />
      
      {/* If iframe completely fails or is blocked by privacy tools, we fallback */}
      {fallbackImage && (
        <img 
          src={fallbackImage} 
          alt="Instagram Post" 
          className="absolute inset-0 w-full h-full object-cover -z-10 opacity-0 transition-opacity" 
          onError={(e) => e.currentTarget.style.display = 'none'}
        />
      )}
    </div>
  );
}
