import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Calendar } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import EventCard from '../components/events/EventCard';

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
          {events?.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
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
