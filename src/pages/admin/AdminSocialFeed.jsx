import { useState } from 'react';
import { 
  Settings, RefreshCw, 
  Plus, ExternalLink, Trash2, Eye, EyeOff, Star, AlertCircle, CheckCircle2 
} from 'lucide-react';

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
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useSocialFeed } from '../../hooks/useSocialFeed';

// Simple platform badges
const PlatformBadge = ({ platform }) => {
  if (platform === 'instagram') {
    return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-pink-50 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400 border border-pink-200 dark:border-pink-800"><Instagram className="w-3.5 h-3.5" /> Instagram</span>;
  }
  return <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800"><Linkedin className="w-3.5 h-3.5" /> LinkedIn</span>;
};

// Main Admin Component
export default function AdminSocialFeed() {
  const { 
    posts, settings, loading, syncing, error, isSetupNeeded,
    updateSettings, syncInstagram, addManualPost, 
    deletePost, toggleVisibility, toggleFeatured 
  } = useSocialFeed(false, 100);

  const [activeTab, setActiveTab] = useState('all');
  const [newUrl, setNewUrl] = useState('');
  const [adding, setAdding] = useState(false);

  const handleAddPost = async (platform) => {
    if (!newUrl) return toast.error('Enter a URL first');
    
    // Validate Instagram URL
    if (platform === 'instagram' && !newUrl.includes('instagram.com')) {
      return toast.error('Invalid Instagram URL. Please use a valid Instagram post link.');
    }
    
    setAdding(true);
    try {
      await addManualPost(platform, newUrl);
      toast.success('Post added successfully');
      setNewUrl('');
    } catch (e) {
      toast.error(e.message || 'Failed to add post');
    } finally {
      setAdding(false);
    }
  };

  const handleSyncInstagram = async () => {
    try {
      const count = await syncInstagram();
      toast.success(`Synced ${count} new posts`);
    } catch (e) {
      toast.error(e.message || 'Sync failed');
    }
  };

  if (loading) return <div className="p-8 text-center animate-pulse text-gray-500">Loading Social Feed Manager...</div>;

  if (isSetupNeeded) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 mt-10">
        <div className="p-8 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-3xl text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-black text-red-700 dark:text-red-400 mb-2">Database Tables Missing</h2>
          <p className="text-red-600 dark:text-red-300 max-w-lg mx-auto mb-6">
            The required Supabase tables for the Social Media Feed (`social_posts` and `social_settings`) have not been created yet.
          </p>
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl text-left border border-red-100 dark:border-red-800/50 shadow-inner inline-block w-full max-w-2xl">
            <h3 className="font-bold text-gray-900 dark:text-white mb-2">How to fix this:</h3>
            <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2">
              <li>Open the <span className="font-mono text-xs bg-gray-100 dark:bg-slate-800 px-1 py-0.5 rounded">supabase_social_feed.sql</span> file located in the root of your project.</li>
              <li>Copy the entire SQL script.</li>
              <li>Go to your Supabase Dashboard &rarr; SQL Editor.</li>
              <li>Paste the code and click <strong>RUN</strong>.</li>
              <li>Refresh this page.</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  const filteredPosts = activeTab === 'all' ? posts : posts.filter(p => p.platform === activeTab);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 p-8 shadow-2xl border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3">
            <RefreshCw className="w-3.5 h-3.5" /> Live Unified Feed
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">Social Feed Manager</h1>
          <p className="text-blue-200 max-w-xl text-sm leading-relaxed">
            Manage your official Instagram and LinkedIn posts. Posts configured here will automatically render as interactive embeds on the university homepage.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 w-fit shadow-sm">
        {['all', 'instagram', 'linkedin', 'settings'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-gray-100 dark:border-slate-700 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-gray-100 dark:border-slate-700 pb-4">
            <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">API Configuration</h2>
          </div>
          
          <div className="space-y-4 max-w-2xl">
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Instagram Long-Lived Access Token</label>
              <input 
                type="password"
                value={settings?.instagram_access_token || ''}
                onChange={e => updateSettings({ instagram_access_token: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50"
                placeholder="IGQW..."
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1">Instagram User ID</label>
              <input 
                type="text"
                value={settings?.instagram_user_id || ''}
                onChange={e => updateSettings({ instagram_user_id: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50"
                placeholder="178414..."
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <input 
                type="checkbox" 
                checked={settings?.instagram_enabled}
                onChange={e => updateSettings({ instagram_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-blue-600"
              />
              <label className="font-semibold text-gray-900 dark:text-white">Enable Instagram Sync</label>
            </div>
            
            <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-2xl flex gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-sm text-amber-800 dark:text-amber-300">
                <p className="font-bold mb-1">How to get these tokens?</p>
                <p>Check the <code>INSTAGRAM_SETUP.md</code> file in your project root for full instructions on setting up the Meta Graph API.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Posts Tabs (All, IG, LI) */}
      {activeTab !== 'settings' && (
        <div className="space-y-6">
          
          {/* Action Bar */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex w-full md:w-auto items-center gap-2">
              <input 
                type="url" 
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="Paste Instagram or LinkedIn URL..."
                className="flex-1 md:w-80 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-900/50 text-sm focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={() => handleAddPost(activeTab === 'instagram' ? 'instagram' : 'linkedin')}
                disabled={adding}
                className="px-4 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {adding ? 'Adding...' : 'Add Manual'}
              </button>
            </div>

            {(activeTab === 'all' || activeTab === 'instagram') && (
              <button 
                onClick={handleSyncInstagram}
                disabled={syncing}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-pink-500/20"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing API...' : 'Sync Latest IG Posts'}
              </button>
            )}
          </div>

          {/* Feed Grid */}
          {filteredPosts.length === 0 ? (
             <div className="text-center py-20 bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 border-dashed rounded-3xl">
               <p className="text-gray-500 font-medium">No posts found for this tab.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map(post => (
                <div key={post.id} className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-gray-100 dark:border-slate-700 shadow-xl hover:shadow-2xl transition-all group flex flex-col">
                  
                  {/* Media / Fallback */}
                  <div className="aspect-video bg-gray-100 dark:bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {post.thumbnail ? (
                      <img src={post.thumbnail} alt="" className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700" />
                    ) : (
                      <PlatformBadge platform={post.platform} />
                    )}
                    <div className="absolute top-4 left-4">
                      <PlatformBadge platform={post.platform} />
                    </div>
                    {post.is_featured && (
                      <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 p-1.5 rounded-full shadow-lg">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
                      {format(new Date(post.created_at), 'MMM dd, yyyy')} • {post.is_auto_fetched ? 'Auto-synced' : 'Manual'}
                    </p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 mb-4 flex-1">
                      {post.caption || "No caption available. The embed will show the original content."}
                    </p>
                    <a href={post.post_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 w-fit mb-6">
                      View Original <ExternalLink className="w-3 h-3" />
                    </a>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-slate-700/50 mt-auto">
                      <button 
                        onClick={() => toggleVisibility(post.id, post.is_visible)}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                          post.is_visible 
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400'
                            : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                        }`}
                      >
                        {post.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        {post.is_visible ? 'Visible' : 'Hidden'}
                      </button>
                      
                      <button 
                        onClick={() => toggleFeatured(post.id, post.is_featured)}
                        className={`p-2 rounded-xl transition-colors ${
                          post.is_featured 
                            ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                            : 'bg-gray-100 text-gray-400 dark:bg-slate-700 hover:text-amber-500'
                        }`}
                        title="Feature Post"
                      >
                        <Star className="w-4 h-4" />
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
      )}
    </div>
  );
}
