import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Calendar, MapPin, Trash2, Image as ImageIcon, Loader2, Plus, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import ImageUpload from '../../components/ImageUpload';

const EMPTY_FORM = { title: '', description: '', date: '', location: '', image_url: '' };

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (!error && data) {
      setEvents(data);
    } else if (error) {
      toast.error('Failed to load events: ' + error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchEvents();
    
    const subscription = supabase
      .channel('public:events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchEvents)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const handleEditEvent = (event) => {
    setForm({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().slice(0, 16),
      location: event.location,
      image_url: event.image_url || ''
    });
    setEditingId(event.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error('You must be logged in.');
      setIsSubmitting(false);
      return;
    }

    const payload = { 
      ...form,
      organizer_id: session.user.id 
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from('events').update(payload).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('events').insert([payload]));
    }
    
    if (!error) {
      toast.success(editingId ? 'Event updated!' : 'Event created!');
      setShowForm(false);
      setEditingId(null);
      setForm(EMPTY_FORM);
      fetchEvents();
    } else {
      toast.error(error.message);
    }
    setIsSubmitting(false);
  };

  const handleDeleteEvent = async (event) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', event.id);
    
    if (!error) {
      // Storage cleanup
      if (event.image_url) {
        try {
          const parts = event.image_url.split('/');
          const file = parts[parts.length - 1];
          await supabase.storage.from('event-images').remove([file]);
        } catch (_) {}
      }
      toast.success('Event deleted');
      fetchEvents();
    } else {
      toast.error(error.message);
    }
  };

  if (loading && events.length === 0) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" /> Manage Events
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Create and manage upcoming college events.</p>
        </div>
        <button 
          onClick={() => {
            setShowForm(!showForm);
            if (!showForm) {
              setEditingId(null);
              setForm(EMPTY_FORM);
            }
          }}
          className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          {showForm ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Create Event</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-bold mb-4">{editingId ? 'Edit Event' : 'Create New Event'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Title</label>
                <input 
                  required
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({...form, title: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                />
              </div>
              
              <div className="col-span-2">
                <ImageUpload
                  bucket="event-images"
                  currentUrl={form.image_url}
                  onUpload={(url) => setForm({...form, image_url: url})}
                  label="Event Header Image"
                  maxSizeMB={2}
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea 
                  required
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Date & Time</label>
                <input 
                  required
                  type="datetime-local" 
                  value={form.date}
                  onChange={(e) => setForm({...form, date: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input 
                  required
                  type="text" 
                  value={form.location}
                  onChange={(e) => setForm({...form, location: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-md bg-gray-50 dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-md font-medium flex items-center gap-2 hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {isSubmitting ? 'Saving...' : (editingId ? 'Update Event' : 'Save Event')}
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events?.map((event) => (
          <div key={event.id} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden flex flex-col group hover:shadow-lg transition-all duration-300">
            {event.image_url ? (
              <div className="w-full h-48 overflow-hidden bg-gray-100 dark:bg-slate-900">
                <img 
                  src={event.image_url} 
                  alt={event.title} 
                  className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" 
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="w-full h-48 bg-gray-100 dark:bg-slate-900 flex items-center justify-center"><span class="text-sm text-gray-500 dark:text-gray-400">No Image</span></div>';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-48 bg-gray-100 dark:bg-slate-900 flex items-center justify-center">
                <ImageIcon className="w-12 h-12 text-gray-300 dark:text-gray-600" />
              </div>
            )}
            <div className="p-6 flex-1">
              <h3 className="text-xl font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{event.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-3">{event.description}</p>
              
              <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {new Date(event.date).toLocaleString()}
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {event.location}
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 p-4 border-t border-gray-200 dark:border-slate-700 flex justify-end gap-2">
              <button 
                onClick={() => handleEditEvent(event)}
                className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 px-3 py-2 rounded-md transition-colors text-sm font-medium"
              >
                Edit
              </button>
              <button 
                onClick={() => handleDeleteEvent(event)}
                className="text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 px-3 py-2 rounded-md flex items-center gap-2 transition-colors text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            </div>
          </div>
        ))}
        {events.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
            No events scheduled. Create one above!
          </div>
        )}
      </div>
    </div>
  );
}
