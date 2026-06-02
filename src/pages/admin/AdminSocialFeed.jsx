import { useState } from 'react';
import { 
  Plus, ExternalLink, Trash2, Eye, EyeOff
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAdminLinkedInPosts, parseLinkedInEmbedUrl } from '../../hooks/useLinkedInFeed';

const Linkedin = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

export default function AdminSocialFeed() {
  const { 
    posts, loading, insertPost, 
    deletePost, toggleActive 
  } = useAdminLinkedInPosts();

  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddPost = async () => {
    if (!newUrl) return toast.error('Enter a LinkedIn URL first');
    
    if (!newUrl.includes('linkedin.com')) {
      return toast.error('Invalid LinkedIn URL.');
    }
    
    setAdding(true);
    try {
      await insertPost({
        post_url: newUrl,
        is_active: true,
      });
      toast.success('LinkedIn post added successfully');
      setNewUrl('');
    } catch (e) {
      toast.error(e.message || 'Failed to add post');
    } finally {
      setAdding(false);
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-gray-500">Loading Social Feed Manager...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-[#0A66C2] p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
            <Linkedin className="w-3.5 h-3.5" /> LinkedIn Feed
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Social Feed Manager</h1>
          <p className="text-blue-100 max-w-xl text-sm leading-relaxed">
            Manage your official LinkedIn posts. Posts added here will automatically render as interactive embeds on the university homepage.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Action Bar */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex w-full items-center gap-2">
            <input 
              type="url" 
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              placeholder="Paste LinkedIn Post URL..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-[#0A66C2]"
            />
            <button 
              onClick={handleAddPost}
              disabled={adding}
              className="px-6 py-2.5 bg-[#0A66C2] text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors whitespace-nowrap flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {adding ? 'Adding...' : 'Add Post'}
            </button>
          </div>
        </div>

        {/* Feed Grid */}
        {!posts || posts.length === 0 ? (
           <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 border-dashed rounded-3xl">
             <Linkedin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
             <p className="text-gray-500 font-medium">No LinkedIn posts found. Add one above!</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map(post => (
              <div key={post.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-xl flex flex-col">
                
                {/* Media Embed Preview */}
                <div className="bg-gray-50 dark:bg-slate-900 relative flex items-center justify-center overflow-hidden" style={{ height: '380px' }}>
                  {parseLinkedInEmbedUrl(post.post_url) ? (
                    <iframe
                      src={parseLinkedInEmbedUrl(post.post_url)}
                      width="504"
                      height="570"
                      frameBorder="0"
                      allowFullScreen
                      title="LinkedIn Preview"
                      style={{ border: 'none', display: 'block' }}
                      className="origin-top scale-[0.67]"
                    />
                  ) : (
                    <div className="flex flex-col items-center">
                      <Linkedin className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-2" />
                      <span className="text-xs text-gray-400">Invalid LinkedIn Post URL</span>
                    </div>
                  )}
                  <div className="absolute top-4 left-4 pointer-events-none">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#0A66C2] text-white shadow-md"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</span>
                  </div>
                </div>

                {/* Body */}
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
                    {format(new Date(post.created_at), 'MMM dd, yyyy')} • Manual
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-4 flex-1">
                    {post.title || "No title available. The embed will show the original content."}
                  </p>
                  <a href={post.post_url} target="_blank" rel="noreferrer" className="text-xs text-[#0A66C2] hover:underline inline-flex items-center gap-1 w-fit mb-6">
                    View Original <ExternalLink className="w-3 h-3" />
                  </a>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-slate-700/50 mt-auto">
                    <button 
                      onClick={() => toggleActive(post.id, post.is_active)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                        post.is_active 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                      }`}
                    >
                      {post.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      {post.is_active ? 'Visible' : 'Hidden'}
                    </button>
                    
                    <button 
                      onClick={() => { if(confirm('Delete post?')) deletePost(post.id) }}
                      className="p-2 rounded-xl bg-red-50 text-red-500 dark:bg-red-900/20 hover:bg-red-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
