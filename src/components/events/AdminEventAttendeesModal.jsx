import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Users, CheckCircle2, User, Loader2, CalendarCheck2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminEventAttendeesModal({ event, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'registered', 'attended', 'cancelled'

  useEffect(() => {
    fetchAttendees();
  }, [event.id]);

  const fetchAttendees = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*, profiles(full_name, email, role, avatar_url, phone)')
      .eq('event_id', event.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAttendees(data);
    } else {
      toast.error('Failed to load attendees');
    }
    setLoading(false);
  };

  const handleManualCheckIn = async (regId) => {
    const { error } = await supabase
      .from('event_registrations')
      .update({ attendance_status: 'attended', scanned_at: new Date().toISOString() })
      .eq('id', regId);
      
    if (!error) {
      toast.success('Attendee checked in manually!');
      setAttendees(attendees.map(a => a.id === regId ? { ...a, attendance_status: 'attended' } : a));
    } else {
      toast.error('Failed to check in attendee.');
    }
  };

  const filteredAttendees = attendees.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'attended') return a.attendance_status === 'attended';
    return a.registration_status === filter;
  });

  const stats = {
    registered: attendees.filter(a => a.registration_status === 'registered').length,
    cancelled: attendees.filter(a => a.registration_status === 'cancelled').length,
    attended: attendees.filter(a => a.attendance_status === 'attended').length,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-1">{event.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <Users className="w-4 h-4" /> Guest List & Analytics
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-blue-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Total Registered</p>
            <p className="text-3xl font-black text-blue-600 dark:text-blue-400">{stats.registered}</p>
          </div>
          <div className="bg-green-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-green-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Actually Attended</p>
            <p className="text-3xl font-black text-green-600 dark:text-green-400">{stats.attended} <span className="text-sm opacity-50 font-medium">({stats.registered ? Math.round((stats.attended/stats.registered)*100) : 0}%)</span></p>
          </div>
          <div className="bg-red-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-red-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">Cancelled</p>
            <p className="text-3xl font-black text-red-600 dark:text-red-400">{stats.cancelled}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {['all', 'registered', 'attended', 'cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-bold capitalize whitespace-nowrap transition-colors ${
                filter === f 
                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' 
                : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {f === 'all' ? 'All Registrations' : f} ({f === 'all' ? attendees.length : f === 'attended' ? stats.attended : stats[f]})
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-slate-700 p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-500">Loading guests...</p>
            </div>
          ) : filteredAttendees.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <Users className="w-8 h-8 mb-2 opacity-50" />
              <p>No registrations found for this filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredAttendees.map(reg => (
                <div key={reg.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    {reg.profiles.avatar_url ? (
                      <img src={reg.profiles.avatar_url} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-700 flex items-center justify-center">
                        <User className="w-6 h-6 text-blue-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 dark:text-white truncate">{reg.profiles.full_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{reg.profiles.email}</p>
                      <div className="flex gap-2 mt-1">
                        <span className={`text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full ${
                          reg.registration_status === 'registered' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {reg.registration_status}
                        </span>
                        {reg.attendance_status === 'attended' && (
                          <span className="text-[10px] uppercase tracking-wider font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Attended
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {reg.registration_status === 'registered' && reg.attendance_status !== 'attended' && (
                    <button 
                      onClick={() => handleManualCheckIn(reg.id)}
                      className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <CalendarCheck2 className="w-4 h-4" /> Manual Check-in
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
