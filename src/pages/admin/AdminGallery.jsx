import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trash2, Loader2, Plus, X, Image as ImageIcon, Tag } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../../components/ImageUpload';

export default function AdminGallery() {
  const [images, setImages]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm]           = useState({ title: '', category: 'campus' });
  const [uploadedUrl, setUploadedUrl] = useState(null);

  const fetchImages = async () => {
    const { data, error } = await supabase
      .from('gallery_images')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) toast.error('Failed to load gallery');
    else setImages(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchImages();
    const ch = supabase.channel('gallery-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_images' }, fetchImages)
      .subscribe();
    return () => supabase.removeChannel(ch);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!uploadedUrl) { toast.error('Please upload an image first'); return; }
    if (!form.title.trim()) { toast.error('Title is required'); return; }

    setSubmitting(true);
    const { error } = await supabase.from('gallery_images').insert([{
      title: form.title.trim(),
      category: form.category,
      image_url: uploadedUrl,
    }]);
    setSubmitting(false);

    if (error) { toast.error('Save failed: ' + error.message); return; }
    toast.success('Image added to gallery!');
    setShowForm(false);
    setForm({ title: '', category: 'campus' });
    setUploadedUrl(null);
    fetchImages();
  };

  const handleDelete = async (img) => {
    if (!confirm(`Delete "${img.title}"?`)) return;
    const { error } = await supabase.from('gallery_images').delete().eq('id', img.id);
    if (error) { toast.error(error.message); return; }
    // Best-effort storage cleanup
    try {
      const parts = img.image_url.split('/');
      const file  = parts[parts.length - 1];
      await supabase.storage.from('gallery').remove([`images/${file}`]);
    } catch (_) {}
    toast.success('Deleted');
    fetchImages();
  };

  const CAT_COLORS = {
    campus: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    events: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-blue-600" /> Gallery Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Upload and manage campus &amp; event images.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-blue-500/20"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Add Image</>}
        </button>
      </div>

      {/* Upload Form */}
      {showForm && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-bold mb-5">Upload New Image</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <ImageUpload
              bucket="gallery"
              folder="images"
              currentUrl={uploadedUrl}
              onUpload={setUploadedUrl}
              label="Gallery Image"
              maxSizeMB={4}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Title *</label>
                <input
                  required
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Main Campus Building"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Category</label>
                <select
                  value={form.category}
                  onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value="campus">Campus</option>
                  <option value="events">Events</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={submitting || !uploadedUrl}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 disabled:opacity-50 transition shadow-lg shadow-blue-500/20"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {submitting ? 'Saving...' : 'Add to Gallery'}
            </button>
          </form>
        </div>
      )}

      {/* Gallery Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-200 dark:bg-slate-700 h-48 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {images.map(img => (
            <div key={img.id} className="group relative bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/60 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="w-full h-44 overflow-hidden bg-gray-100 dark:bg-slate-900">
                <img
                  src={img.image_url}
                  alt={img.title}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={e => { e.target.onerror = null; e.target.src = ''; e.target.parentElement.classList.add('bg-gray-200'); }}
                />
              </div>
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{img.title}</p>
                  <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${CAT_COLORS[img.category] ?? CAT_COLORS.campus}`}>
                    {img.category}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(img)}
                  className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {images.length === 0 && (
            <div className="col-span-full text-center py-20 text-gray-400 dark:text-gray-600">
              <ImageIcon className="w-14 h-14 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No images yet. Upload one above!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


