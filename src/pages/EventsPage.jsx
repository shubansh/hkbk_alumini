import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });
        
        if (!error && data) {
          setEvents(data);
        }
      } catch (err) {
        console.error('Error fetching events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Upcoming Events</h1>
        <p className="text-gray-500 dark:text-gray-400">Join reunions, workshops, and networking events.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="p-6">
                <Skeleton className="h-6 w-24 rounded-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6 mb-4" />
                <div className="space-y-2 mt-4">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 p-4 border-t border-gray-200 dark:border-slate-700">
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map((event) => {
            const eventDate = event.date ? new Date(event.date) : null;
            const isValidDate = eventDate && !isNaN(eventDate.getTime());
            
            return (
              <div key={event.id} className="bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 flex flex-col group backdrop-blur-sm">
                {event.image_url ? (
                  <div className="w-full h-56 overflow-hidden bg-gray-100 dark:bg-slate-900">
                    <img 
                      src={event.image_url} 
                      alt={event.title} 
                      className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 flex flex-col items-center justify-center p-6 text-center"><span class="text-sm text-blue-600 dark:text-blue-400 font-bold opacity-70">HKBK Event</span></div>';
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 flex flex-col items-center justify-center p-6 text-center">
                    <Calendar className="w-12 h-12 text-blue-300 dark:text-blue-500/30 mb-2" />
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-bold opacity-70 uppercase tracking-widest">HKBK Event</span>
                  </div>
                )}
                <div className="p-8 flex-1">
                  <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black px-4 py-2 rounded-full inline-block mb-6 uppercase tracking-widest">
                    {isValidDate ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
                  </div>
                  <h3 className="text-2xl font-black mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">{event.title || 'Untitled Event'}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 line-clamp-3 leading-relaxed">{event.description || 'No description provided.'}</p>
                  
                  <div className="space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
                        <Clock className="w-4 h-4 text-blue-500" />
                      </div>
                      {isValidDate ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
                        <MapPin className="w-4 h-4 text-blue-500" />
                      </div>
                      {event.location || 'Location TBD'}
                    </div>
                  </div>
                </div>
                <div className="p-8 pt-0 mt-auto">
                  <button className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black py-4 rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 shadow-xl shadow-blue-500/5 group-hover:bg-blue-600 group-hover:text-white">
                    RSVP Now
                  </button>
                </div>
              </div>
            );
          })}
          {events.length === 0 && (
            <div className="col-span-full">
              <EmptyState 
                icon={Calendar}
                title="No upcoming events"
                description="There are currently no events scheduled. Check back later for updates on college events and reunions."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
