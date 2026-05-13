import { ExternalLink } from 'lucide-react';

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
import InstagramEmbed from './InstagramEmbed';
import LinkedInEmbed from './LinkedInEmbed';

export default function SocialCard({ post }) {
  const isInsta = post.platform === 'instagram';

  return (
    <div className="group relative w-full rounded-[2.5rem] overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200/50 dark:border-white/10 shadow-xl hover:shadow-2xl transition-all duration-700 ease-out hover:-translate-y-2 flex flex-col h-full">
      
      {/* Decorative Blur Glow */}
      <div className={`absolute -inset-20 z-0 blur-[100px] opacity-20 group-hover:opacity-40 transition-opacity duration-1000 rounded-full pointer-events-none ${isInsta ? 'bg-gradient-to-tr from-pink-500 to-purple-500' : 'bg-blue-500'}`} />

      {/* Header Bar */}
      <div className="relative z-10 flex items-center justify-between p-5 pb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${isInsta ? 'bg-gradient-to-tr from-pink-600 via-purple-600 to-orange-500 shadow-pink-500/30' : 'bg-[#0A66C2] shadow-blue-500/30'}`}>
            {isInsta ? <Instagram className="w-5 h-5" /> : <Linkedin className="w-5 h-5" />}
          </div>
          <div>
            <p className="font-bold text-sm text-gray-900 dark:text-white leading-none">HKBK Connect</p>
            <p className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">{isInsta ? 'Instagram' : 'LinkedIn'}</p>
          </div>
        </div>
        <a 
          href={post.post_url} 
          target="_blank" 
          rel="noreferrer" 
          className="p-2 rounded-full bg-white/50 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 text-gray-700 dark:text-gray-300 transition-colors"
          title="View Original Post"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Media Embed Area */}
      <div className="relative z-10 px-5 pb-5 flex-1 flex flex-col">
        <div className="w-full rounded-[2rem] overflow-hidden border border-gray-100 dark:border-white/5 bg-white dark:bg-slate-950 flex-1 relative">
          {isInsta ? (
            <InstagramEmbed embedUrl={post.embed_url} fallbackImage={post.thumbnail} />
          ) : (
            <LinkedInEmbed embedUrl={post.embed_url} />
          )}
        </div>
      </div>
    </div>
  );
}
