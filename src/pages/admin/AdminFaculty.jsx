import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff, Loader2, X, Save, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../../components/ImageUpload';

const EMPTY_FORM = {
  name: '', department: '', designation: '', type: 'faculty',
  image_url: '', bio: '', email: '', linkedin_url: '',
  is_visible: true, is_featured: false,
};

export default function AdminFaculty() {
  const [faculty, setFaculty]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState(null); // id of row being edited
  const [form, setForm]         = useState(EMPTY_FORM);
  const [saving, setSaving]     = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('faculty')
      .select('*')
      .order('is_featured', { ascending: false })
      .order('name');
    if (error) toast.error('Failed to load faculty: ' + error.message);
    else setFaculty(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (member) => {
    setEditing(member.id);
    setForm({ ...EMPTY_FORM, ...member });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);

    const payload = { ...form };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;

    let error;
    if (editing) {
      ({ error } = await supabase.from('faculty').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing));
    } else {
      ({ error } = await supabase.from('faculty').insert([payload]));
    }

    setSaving(false);
    if (error) { toast.error('Save failed: ' + error.message); return; }
    toast.success(editing ? 'Faculty updated!' : 'Faculty added!');
    setShowForm(false);
    load();
  };

  const handleDelete = async (member) => {
    if (!confirm('Delete this faculty member?')) return;
    const { error } = await supabase.from('faculty').delete().eq('id', member.id);
    if (error) {
      toast.error('Delete failed: ' + error.message);
    } else {
      // Storage cleanup
      if (member.image_url) {
        try {
          const parts = member.image_url.split('/');
          const file = parts[parts.length - 1];
          await supabase.storage.from('faculty').remove([`images/${file}`]);
        } catch (_) {}
      }
      toast.success('Deleted');
      load();
    }
  };

  const toggleField = async (id, field, current) => {
    const { error } = await supabase.from('faculty').update({ [field]: !current }).eq('id', id);
    if (error) toast.error('Update failed');
    else setFaculty(prev => prev.map(f => f.id === id ? { ...f, [field]: !current } : f));
  };

  const TYPE_COLORS = {
    faculty:        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    alumni_faculty: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    mentor:         'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-blue-600" /> Faculty Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Add, edit, and manage faculty, alumni-faculty, and mentors.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 transition shadow-lg shadow-blue-500/20"
        >
          <Plus className="w-4 h-4" /> Add Faculty
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <tr>
                  {['Member', 'Type', 'Department', 'Visible', 'Featured', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {faculty.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/20 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 dark:bg-slate-700 shrink-0 flex items-center justify-center">
                          {f.image_url
                            ? <img src={f.image_url} alt={f.name} className="w-full h-full object-cover" />
                            : <span className="text-sm font-bold text-gray-400">{f.name.charAt(0)}</span>
                          }
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white text-sm">{f.name}</p>
                          {f.designation && <p className="text-xs text-gray-500 dark:text-gray-400">{f.designation}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${TYPE_COLORS[f.type] ?? TYPE_COLORS.faculty}`}>
                        {f.type === 'alumni_faculty' ? 'Alumni Faculty' : f.type.charAt(0).toUpperCase() + f.type.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-400">{f.department || '—'}</td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleField(f.id, 'is_visible', f.is_visible)}
                        className={`p-1.5 rounded-lg transition ${f.is_visible ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-gray-400 bg-gray-50 dark:bg-slate-700'}`}
                        title={f.is_visible ? 'Visible' : 'Hidden'}
                      >
                        {f.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => toggleField(f.id, 'is_featured', f.is_featured)}
                        className={`p-1.5 rounded-lg transition ${f.is_featured ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20' : 'text-gray-400 bg-gray-50 dark:bg-slate-700'}`}
                        title={f.is_featured ? 'Featured' : 'Not Featured'}
                      >
                        {f.is_featured ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(f)} className="p-1.5 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 transition">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(f)} className="p-1.5 rounded-lg text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 transition">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {faculty.length === 0 && (
              <div className="py-16 text-center text-gray-500 dark:text-gray-400">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="font-medium">No faculty added yet.</p>
                <p className="text-sm mt-1">Click "Add Faculty" to get started.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700">
              <h2 className="text-lg font-bold">{editing ? 'Edit Faculty' : 'Add Faculty'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Type</label>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                    <option value="faculty">Faculty</option>
                    <option value="alumni_faculty">Alumni Faculty</option>
                    <option value="mentor">Mentor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Department</label>
                  <input value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Designation / Title</label>
                  <input value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))}
                    placeholder="e.g. Professor, HOD, Senior Engineer"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <ImageUpload
                    bucket="faculty"
                    folder="images"
                    currentUrl={form.image_url || null}
                    onUpload={(url) => setForm(p => ({ ...p, image_url: url ?? '' }))}
                    label="Profile Image"
                    maxSizeMB={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">LinkedIn URL</label>
                  <input value={form.linkedin_url} onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))}
                    placeholder="https://linkedin.com/in/..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold mb-1">Bio</label>
                  <textarea value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                    rows={3} placeholder="Brief description..."
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_visible" checked={form.is_visible} onChange={e => setForm(p => ({ ...p, is_visible: e.target.checked }))} className="w-4 h-4 rounded" />
                  <label htmlFor="is_visible" className="text-sm font-medium">Visible on site</label>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="is_featured" checked={form.is_featured} onChange={e => setForm(p => ({ ...p, is_featured: e.target.checked }))} className="w-4 h-4 rounded" />
                  <label htmlFor="is_featured" className="text-sm font-medium">Featured on homepage</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-800 transition">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold hover:opacity-90 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {saving ? 'Saving...' : (editing ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
