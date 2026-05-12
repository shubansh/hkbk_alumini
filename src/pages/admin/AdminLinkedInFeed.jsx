import { useState, useCallback } from 'react';
import {
  Plus, X, Trash2, Loader2, Eye, EyeOff,
  ExternalLink, CheckCircle2, AlertTriangle,
  ToggleLeft, ToggleRight, AlertCircle, Link as LinkIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { useAdminLinkedInPosts, parseLinkedInEmbedUrl } from '../../hooks/useLinkedInFeed';

// ─── Inline LinkedIn SVG ───────────────────────────────────────────────────────
const LinkedInSVG = ({ className = 'w-5 h-5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/>
    <rect x="2" y="9" width="4" height="12"/>
    <circle cx="4" cy="4" r="2"/>
  </svg>
);

// ─── URL Status Badge ─────────────────────────────────────────────────────────
function EmbedStatusBadge({ url }) {
  const embedUrl = parseLinkedInEmbedUrl(url);
  if (!url) return null;
  if (embedUrl) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3.5 h-3.5" /> Embed ready
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
      <AlertTriangle className="w-3.5 h-3.5" /> Fallback mode
    </span>
  );
}

// ─── Add / Edit Modal ─────────────────────────────────────────────────────────
function PostModal({ initial, onSave, onClose, submitting }) {
  const [postUrl,   setPostUrl]   = useState(initial?.post_url ?? '');
  const [isActive,  setIsActive]  = useState(initial?.is_active ?? true);
  const isEdit    = !!initial?.id;
  const embedUrl  = parseLinkedInEmbedUrl(postUrl);
  const urlValid  = postUrl.trim().length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!postUrl.trim()) { toast.error('LinkedIn post URL is required'); return; }
    try { new URL(postUrl.trim()); } catch { toast.error('Enter a valid URL'); return; }
    await onSave({ post_url: postUrl.trim(), embed_url: embedUrl || null, is_active: isActive });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 border-b border-gray-200 dark:border-slate-700 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
              <LinkedInSVG className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {isEdit ? 'Edit Post' : 'Add LinkedIn Post'}
              </h2>
              <p className="text-xs text-gray-400">Paste the public LinkedIn post URL</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-6 space-y-5">
          {/* URL Field */}
          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <LinkIcon className="w-4 h-4 text-blue-500" />
              LinkedIn Post URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={postUrl}
              onChange={e => setPostUrl(e.target.value)}
              placeholder="https://www.linkedin.com/posts/..."
              autoFocus
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 dark:text-white placeholder-gray-400 transition"
            />
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {urlValid && <EmbedStatusBadge url={postUrl} />}
              {urlValid && !embedUrl && (
                <p className="text-xs text-gray-400">
                  URL format not recognised — post will show as a link card.
                </p>
              )}
            </div>
          </div>

          {/* Embed preview info */}
          {embedUrl && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1">Embed URL generated:</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-300 font-mono break-all">{embedUrl}</p>
            </div>
          )}

          {/* How to get URL tip */}
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-gray-400 space-y-1">
            <p className="font-semibold text-gray-700 dark:text-gray-300">💡 How to get the URL</p>
            <p>1. Open the LinkedIn post → click <strong>⋯</strong> menu</p>
            <p>2. Click <strong>"Copy link to post"</strong></p>
            <p>3. Paste it here. Post must be set to <strong>public</strong>.</p>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Show on homepage</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {isActive ? 'Visible in LinkedIn feed section' : 'Hidden from homepage'}
              </p>
            </div>
            <button type="button" onClick={() => setIsActive(v => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-gray-200 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
              }`}>
              {isActive ? <><ToggleRight className="w-5 h-5" /> Active</> : <><ToggleLeft className="w-5 h-5" /> Inactive</>}
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 px-5 py-3 rounded-xl border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 disabled:opacity-60 transition shadow-lg shadow-blue-500/20">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                : <><Plus className="w-4 h-4" /> {isEdit ? 'Save' : 'Add Post'}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Post Row Card ────────────────────────────────────────────────────────────
function PostCard({ post, onEdit, onDelete, onToggle }) {
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const embedUrl = post.embed_url || parseLinkedInEmbedUrl(post.post_url);

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(post.id, post.is_active); toast.success(post.is_active ? 'Post hidden' : 'Post live'); }
    catch (e) { toast.error(e.message); }
    finally { setToggling(false); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return;
    setDeleting(true);
    try { await onDelete(post.id); toast.success('Deleted'); }
    catch (e) { toast.error(e.message); }
    finally { setDeleting(false); }
  };

  return (
    <div className="bg-white dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 hover:shadow-md transition-shadow">
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shrink-0">
        <LinkedInSVG className="w-5 h-5 text-white" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
            post.is_active
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
              : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
          }`}>
            {post.is_active ? '● Live' : '● Hidden'}
          </span>
          {embedUrl
            ? <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">✓ Embed</span>
            : <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">⚠ Fallback</span>
          }
        </div>
        <a href={post.post_url} target="_blank" rel="noopener noreferrer"
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium truncate block max-w-xs sm:max-w-md"
          onClick={e => e.stopPropagation()}>
          <ExternalLink className="w-3.5 h-3.5 inline mr-1 shrink-0" />{post.post_url}
        </a>
        <p className="text-xs text-gray-400">{format(new Date(post.created_at), 'dd MMM yyyy, h:mm a')}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={handleToggle} disabled={toggling}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
            post.is_active
              ? 'text-amber-700 bg-amber-50 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-400'
              : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400'
          }`}>
          {toggling ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : post.is_active ? <><EyeOff className="w-3.5 h-3.5" />Hide</> : <><Eye className="w-3.5 h-3.5" />Show</>}
        </button>
        <button onClick={() => onEdit(post)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
          Edit
        </button>
        <button onClick={handleDelete} disabled={deleting}
          className="p-2 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function AdminLinkedInFeed() {
  const { posts, loading, error, submitting, insertPost, updatePost, deletePost, toggleActive } = useAdminLinkedInPosts();
  const [showModal, setShowModal] = useState(false);
  const [editPost,  setEditPost]  = useState(null);

  const activeCount = posts.filter(p => p.is_active).length;
  const embedCount  = posts.filter(p => p.embed_url || parseLinkedInEmbedUrl(p.post_url)).length;

  const handleSave = useCallback(async (form) => {
    try {
      if (editPost) { await updatePost(editPost.id, form); toast.success('Updated!'); }
      else          { await insertPost(form);               toast.success('Post added!'); }
      setShowModal(false); setEditPost(null);
    } catch (e) { toast.error('Failed: ' + e.message); }
  }, [editPost, insertPost, updatePost]);

  const openAdd    = ()     => { setEditPost(null);  setShowModal(true); };
  const openEdit   = (post) => { setEditPost(post);  setShowModal(true); };
  const closeModal = ()     => { setShowModal(false); setEditPost(null); };

  return (
    <div className="max-w-5xl mx-auto space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 p-8 shadow-2xl shadow-blue-500/20">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-52 h-52 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-white text-xs font-bold uppercase tracking-wider mb-3">
              <LinkedInSVG className="w-3.5 h-3.5" /> LinkedIn Feed Manager
            </div>
            <h1 className="text-3xl font-extrabold text-white mb-1">Social Feed</h1>
            <p className="text-blue-100 max-w-lg text-sm">
              Paste any public LinkedIn post URL — it embeds automatically on the homepage using LinkedIn's official embed system.
            </p>
          </div>
          <button onClick={openAdd}
            className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-blue-700 font-extrabold hover:bg-blue-50 transition shadow-xl shrink-0">
            <Plus className="w-5 h-5" /> Add Post
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Posts',  value: posts.length,  color: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-900/20'       },
          { label: 'Live on Site', value: activeCount,   color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/20'  },
          { label: 'Embed Ready',  value: embedCount,    color: 'text-indigo-600 dark:text-indigo-400',   bg: 'bg-indigo-50 dark:bg-indigo-900/20'    },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl px-5 py-4 border border-gray-100 dark:border-slate-700`}>
            <p className={`text-3xl font-extrabold ${s.color}`}>{s.value}</p>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mt-0.5 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Auto-sync note */}
      <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">About auto-sync</p>
          <p className="text-amber-700 dark:text-amber-400 mt-0.5">
            LinkedIn's API requires business verification & approval to auto-fetch posts. For now, paste the URL here — the embed appears on the homepage instantly. Each post needs to be <strong>public</strong> ("Anyone" visibility) on LinkedIn.
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {loading
          ? [...Array(3)].map((_, i) => <div key={i} className="h-24 rounded-2xl bg-gray-100 dark:bg-slate-800 animate-pulse" />)
          : posts.length === 0
            ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
                  <LinkedInSVG className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No posts yet</h3>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mb-5 text-sm">Add a LinkedIn post URL to start showing real embedded posts on the homepage.</p>
                <button onClick={openAdd}
                  className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:opacity-90 transition shadow-lg shadow-blue-500/20">
                  <Plus className="w-4 h-4" /> Add First Post
                </button>
              </div>
            )
            : posts.map(post => (
              <PostCard key={post.id} post={post} onEdit={openEdit} onDelete={deletePost} onToggle={toggleActive} />
            ))
        }
      </div>

      {showModal && <PostModal initial={editPost} onSave={handleSave} onClose={closeModal} submitting={submitting} />}
    </div>
  );
}
