import { useState } from 'react';

export default function LinkedInEmbed({ embedUrl }) {
  const [loading, setLoading] = useState(true);

  if (!embedUrl) {
    return (
      <div className="w-full h-[400px] bg-blue-50 dark:bg-slate-800 rounded-[2rem] flex flex-col items-center justify-center p-8 text-center border border-blue-100 dark:border-slate-700">
        <span className="text-4xl mb-4">🔗</span>
        <h3 className="font-bold text-gray-900 dark:text-white">LinkedIn Post</h3>
        <p className="text-sm text-gray-500 mt-2">This post could not be embedded automatically. Click the view button below to read it on LinkedIn.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[450px] bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-slate-900 z-10 animate-pulse">
          <div className="w-8 h-8 border-4 border-blue-400 border-t-blue-600 rounded-full animate-spin" />
        </div>
      )}
      
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full border-0"
        allowFullScreen
        title="Embedded LinkedIn Post"
        onLoad={() => setLoading(false)}
      />
    </div>
  );
}
