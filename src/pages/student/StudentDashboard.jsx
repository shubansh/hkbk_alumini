import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Briefcase, Users, Search, Calendar, ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const { session } = useAuth();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ jobs: 0, events: 0, connections: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reusable realtime jobs hook replacing local fetch
  const { jobs: recentJobs } = useJobs({ status: 'approved', limit: 3 });

  useEffect(() => {
    async function fetchProfileAndStats() {
      try {
        if (session) {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (error) {
            console.error("Profile fetch error:", error);
          }
          
          if (data) {
            setProfile(data);
          } else {
            // Fallback if profile not found yet
            setProfile({ 
              full_name: session.user.user_metadata?.full_name || 'User',
              role: session.user.user_metadata?.role || 'student',
              course_name: session.user.user_metadata?.course_name
            });
          }

          // Fetch stats safely
          const { count: eventsCount, error: eventsError } = await supabase.from('events').select('*', { count: 'exact', head: true }).gte('date', new Date().toISOString());
          if (eventsError) console.error("Events stats error:", eventsError);
          
          const { count: jobsCount, error: jobsError } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
          if (jobsError) console.error("Jobs stats error:", jobsError);

          const { count: mentorCount } = await supabase.from('mentorship_requests').select('*', { count: 'exact', head: true }).eq('student_id', session.user.id);
          
          setStats({
            jobs: jobsCount || 0,
            events: eventsCount || 0,
            connections: mentorCount || 0,
          });


          // Fetch recent events safely
          const { data: eventsData, error: recentEventsError } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true })
            .limit(3);

          if (recentEventsError) console.error("Events error:", recentEventsError);
          if (eventsData) setRecentEvents(eventsData);
        }
      } catch (err) {
        console.error("Critical dashboard error:", err);
        setError("Having trouble loading some data, but you can still use the dashboard.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfileAndStats();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  const quickActions = [
    { title: 'Jobs & Internships', desc: 'Explore opportunities posted by alumni', icon: Briefcase, to: '/jobs', color: 'from-blue-500 to-indigo-600' },
    { title: 'Find a Mentor', desc: 'Connect with alumni for guidance', icon: Users, to: '/dashboard/mentorship', color: 'from-purple-500 to-fuchsia-600' },
    { title: 'Alumni Directory', desc: 'Search past graduates', icon: Search, to: '/directory', color: 'from-emerald-500 to-teal-600' },
    { title: 'Campus Events', desc: 'Join reunions & tech talks', icon: Calendar, to: '/events', color: 'from-orange-500 to-rose-600' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200 p-6 rounded-2xl dark:bg-red-900/20 dark:border-red-800/30 shadow-lg">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 p-8 sm:p-12 shadow-2xl shadow-indigo-500/20 flex flex-col md:flex-row items-center gap-10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-10 -mb-10 w-64 h-64 bg-purple-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex-shrink-0">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[6px] border-white/20 overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm relative group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
                <span className="text-4xl font-bold text-white shadow-sm">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                </span>
              </div>
            )}
            <Link to="/dashboard/settings" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">Edit</span>
            </Link>
          </div>
        </div>

        <div className="relative z-10 flex-1 text-center md:text-left">
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-3 tracking-tight">
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {profile?.full_name?.split(' ')?.[0] || 'Student'} 👋
          </h1>
          <p className="text-blue-100 font-semibold text-lg sm:text-xl mb-4 flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" /> 
            {profile?.course_name ? `${profile.course_name} ${profile.year_of_study ? `• ${profile.year_of_study}` : ''}` : 'HKBK CE Connect Student'}
          </p>
          <p className="text-blue-50/80 max-w-2xl text-base sm:text-lg leading-relaxed">
            Your hub for career growth. Connect with alumni mentors, discover exclusive job postings, and join upcoming university events.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Opportunities</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.jobs}</p>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Upcoming Events</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.events}</p>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Network Connections</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.connections}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Quick Explore
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, idx) => (
            <Link 
              key={idx} 
              to={action.to}
              className="group relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/10 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 from-blue-500 to-indigo-600"></div>
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg mb-5 group-hover:scale-110 transition-transform duration-300 ${action.color}`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{action.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{action.desc}</p>
              <div className="flex items-center text-sm font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                Explore <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Real Data Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Jobs */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Briefcase className="w-5 h-5 text-indigo-500" /> Recent Opportunities</h2>
            <Link to="/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">View All</Link>
          </div>
          
          {recentJobs.length > 0 ? (
            <div className="space-y-4 flex-1">
              {recentJobs.map(job => (
                <div key={job.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 hover:border-blue-500/30 transition-colors">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{job.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{job.company} • {job.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex-1">
              <Briefcase className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No job postings available.</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for new opportunities.</p>
            </div>
          )}
        </div>

        {/* Upcoming Events */}
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Calendar className="w-5 h-5 text-rose-500"/> Upcoming Events</h2>
            <Link to="/events" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">View Calendar</Link>
          </div>
          
          {recentEvents.length > 0 ? (
            <div className="space-y-4 flex-1">
              {recentEvents.map(event => (
                <div key={event.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 hover:border-rose-500/30 transition-colors">
                  <h3 className="font-bold text-gray-900 dark:text-white truncate">{event.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{new Date(event.date).toLocaleDateString()} • {event.location}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex-1">
              <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No upcoming events this week.</p>
              <p className="text-sm text-gray-400 mt-1">Check back later for new schedules.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
