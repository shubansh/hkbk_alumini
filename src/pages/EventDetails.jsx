import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, MapPin, Clock, Users, ArrowLeft, GraduationCap, Briefcase, Mail } from 'lucide-react';
import EventCountdown from '../components/events/EventCountdown';

export default function EventDetails() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEventDetails() {
      setLoading(true);
      // Fetch Event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', id)
        .single();
      
      if (!eventError) setEvent(eventData);

      // Fetch Attendees
      const { data: attendeeData, error: attendeeError } = await supabase
        .from('event_registrations')
        .select('*, profiles(full_name, avatar_url, role, company, job_title)')
        .eq('event_id', id)
        .eq('registration_status', 'registered');

      if (!attendeeError && attendeeData) {
        setAttendees(attendeeData);
      }

      setLoading(false);
    }
    fetchEventDetails();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  if (!event) return (
    <div className="text-center py-20">
      <h2 className="text-2xl font-bold">Event Not Found</h2>
      <Link to="/events" className="text-blue-500 hover:underline mt-4 inline-block">Back to Events</Link>
    </div>
  );

  const eventDate = new Date(event.date);
  const isPast = eventDate.getTime() < Date.now();
  
  const alumni = attendees.filter(a => a.profiles?.role === 'alumni');
  const students = attendees.filter(a => a.profiles?.role === 'student');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-500">
      <Link to="/events" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      {/* Hero Section */}
      <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm mb-12 relative">
        {event.image_url ? (
          <div className="w-full h-[400px] relative">
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">{event.title}</h1>
              <div className="flex flex-wrap gap-6 text-white/90">
                <div className="flex items-center gap-2 font-medium">
                  <Calendar className="w-5 h-5 text-blue-400" />
                  {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="w-5 h-5 text-blue-400" />
                  {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  {event.location}
                </div>
              </div>
            </div>
            {!isPast && (
              <div className="absolute top-8 right-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-xl rounded-2xl p-4">
                <EventCountdown date={event.date} />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full bg-gradient-to-br from-blue-900 to-indigo-900 p-12 md:p-20 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <h1 className="text-4xl md:text-6xl font-black text-white mb-6 relative z-10">{event.title}</h1>
            <div className="flex flex-wrap justify-center gap-6 text-blue-100 relative z-10">
              <div className="flex items-center gap-2 font-medium text-lg">
                <Calendar className="w-5 h-5 text-blue-300" />
                {eventDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </div>
              <div className="flex items-center gap-2 font-medium text-lg">
                <Clock className="w-5 h-5 text-blue-300" />
                {eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
            {!isPast && (
              <div className="mt-12 flex justify-center relative z-10">
                <div className="bg-white/10 border border-white/20 backdrop-blur shadow-xl rounded-2xl p-4 inline-block">
                  <EventCountdown date={event.date} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-10">
          <section>
            <h2 className="text-2xl font-bold mb-4">About the Event</h2>
            <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-lg">
              {event.description}
            </p>
          </section>

          {/* Networking Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
              <Users className="w-6 h-6 text-blue-500" /> 
              Networking Directory ({attendees.length} Registered)
            </h2>
            
            <div className="space-y-8">
              {/* Alumni */}
              {alumni.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <GraduationCap className="w-5 h-5" /> Alumni Attendees
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {alumni.map(a => (
                      <AttendeeCard key={a.id} profile={a.profiles} />
                    ))}
                  </div>
                </div>
              )}

              {/* Students */}
              {students.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Users className="w-5 h-5" /> Student Attendees
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {students.map(a => (
                      <AttendeeCard key={a.id} profile={a.profiles} />
                    ))}
                  </div>
                </div>
              )}

              {attendees.length === 0 && (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-800/50 rounded-2xl border border-gray-100 dark:border-slate-700">
                  <p className="text-gray-500 dark:text-gray-400 font-medium">Be the first to register for this event!</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="font-bold text-lg mb-4 border-b border-gray-100 dark:border-slate-800 pb-2">Event Details</h3>
            <div className="space-y-4 text-sm font-medium text-gray-600 dark:text-gray-300">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <span>{event.location}</span>
              </div>
              {event.capacity && (
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500 shrink-0" />
                  <span>Capacity: {event.capacity} seats</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AttendeeCard({ profile }) {
  if (!profile) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-shadow">
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt={profile.full_name} className="w-12 h-12 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
          <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">{profile.full_name?.charAt(0) || 'U'}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 dark:text-white truncate">{profile.full_name}</h4>
        <p className="text-xs text-blue-600 dark:text-blue-400 truncate">
          {profile.role === 'alumni' ? (
            <span className="flex items-center gap-1"><Briefcase className="w-3 h-3" /> {profile.job_title || 'Alumni'} @ {profile.company || 'Unknown'}</span>
          ) : (
            <span className="flex items-center gap-1"><GraduationCap className="w-3 h-3" /> Student</span>
          )}
        </p>
      </div>
      <Link to="/dashboard/messages" className="p-2 text-gray-400 hover:text-blue-500 bg-gray-50 dark:bg-slate-900 rounded-full transition-colors shrink-0">
        <Mail className="w-4 h-4" />
      </Link>
    </div>
  );
}
