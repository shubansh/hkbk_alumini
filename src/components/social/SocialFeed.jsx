import { useState } from 'react';
import { useSocialFeed } from '../../hooks/useSocialFeed';
import SocialCard from './SocialCard';
import { Rss } from 'lucide-react';

const Instagram = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
  </svg>
);

const Linkedin = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function SocialFeed() {
  const { posts, loading, isSetupNeeded } = useSocialFeed(true, 6);
  const [activeFilter, setActiveFilter] = useState('all');

  // Filter posts based on active tab
  const filteredPosts = activeFilter === 'all' 
    ? posts 
    : posts.filter(p => p.platform === activeFilter);

  if (isSetupNeeded || (!loading && posts.length === 0)) {
    return null; // Don't render section if no posts exist or DB isn't setup
  }

  return (
    <section className="py-32 relative bg-gray-50/50 dark:bg-slate-900/30 overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 -mr-40 -mt-40 w-[500px] h-[500px] bg-gradient-to-br from-pink-500/10 to-orange-400/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-40 -mb-40 w-[500px] h-[500px] bg-gradient-to-tr from-blue-600/10 to-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-16">
          <div className="text-center md:text-left space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              Latest from <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">HKBK</span>
            </h2>
            <p className="text-lg font-medium text-gray-500 dark:text-gray-400 max-w-xl">
              Stay connected with our vibrant community. Live updates from our official social channels.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm shrink-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeFilter === 'all' ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
              }`}
            >
              <Rss className="w-4 h-4" /> All
            </button>
            <button
              onClick={() => setActiveFilter('instagram')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeFilter === 'instagram' ? 'bg-gradient-to-r from-pink-600 to-orange-500 text-white shadow-md' : 'text-gray-500 hover:text-pink-600 dark:text-gray-400 hover:bg-pink-50 dark:hover:bg-pink-900/20'
              }`}
            >
              <Instagram className="w-4 h-4" /> Instagram
            </button>
            <button
              onClick={() => setActiveFilter('linkedin')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeFilter === 'linkedin' ? 'bg-[#0A66C2] text-white shadow-md' : 'text-gray-500 hover:text-[#0A66C2] dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <Linkedin className="w-4 h-4" /> LinkedIn
            </button>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {loading ? (
            // Loading Skeletons
            [...Array(3)].map((_, i) => (
              <div key={i} className="w-full h-[500px] bg-white/50 dark:bg-slate-800/50 rounded-[3rem] border border-gray-100 dark:border-slate-700 animate-pulse flex flex-col p-6">
                 <div className="flex items-center gap-4 mb-6">
                   <div className="w-12 h-12 bg-gray-200 dark:bg-slate-700 rounded-xl" />
                   <div className="space-y-2">
                     <div className="w-24 h-4 bg-gray-200 dark:bg-slate-700 rounded-md" />
                     <div className="w-16 h-3 bg-gray-200 dark:bg-slate-700 rounded-md" />
                   </div>
                 </div>
                 <div className="flex-1 bg-gray-200 dark:bg-slate-700 rounded-[2rem]" />
              </div>
            ))
          ) : filteredPosts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-500">
              No recent updates available for this platform.
            </div>
          ) : (
            filteredPosts.map(post => (
              <div key={post.id} className="animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both" style={{ animationDelay: `${Math.random() * 200}ms` }}>
                <SocialCard post={post} />
              </div>
            ))
          )}
        </div>

      </div>
    </section>
  );
}
