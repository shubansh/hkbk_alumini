import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Briefcase, Users, Search, Calendar, ChevronRight, Sparkles, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ jobs: 0, messages: 0, connections: 0 });
  
  const [recentJobs, setRecentJobs] = useState([]);
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    async function fetchProfileAndStats() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
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
          const { count: msgCount, error: msgError } = await supabase.from('messages').select('*', { count: 'exact', head: true }).or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
          if (msgError) console.error("Messages stats error:", msgError);
          
          const { count: jobsCount, error: jobsError } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
          if (jobsError) console.error("Jobs stats error:", jobsError);

          const { count: mentorCount } = await supabase.from('mentorship_requests').select('*', { count: 'exact', head: true }).eq('student_id', session.user.id);
          
          setStats({
            jobs: jobsCount || 0,
            messages: msgCount || 0,
            connections: mentorCount || 0,
          });


          // Fetch recent jobs safely
          const { data: jobsData, error: recentJobsError } = await supabase
            .from('jobs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
          
          if (recentJobsError) console.error("Recent jobs error:", recentJobsError);
          if (jobsData) setRecentJobs(jobsData);

          // Fetch recent events safely
          const { data: eventsData, error: eventsError } = await supabase
            .from('events')
            .select('*')
            .order('date', { ascending: true })
            .limit(3);

          if (eventsError) console.error("Events error:", eventsError);
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
    { title: 'Find a Job', desc: 'Explore opportunities posted by alumni', icon: Briefcase, to: '/jobs', color: 'from-blue-500 to-indigo-600' },
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
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 sm:p-10 shadow-2xl shadow-indigo-500/20 flex flex-col md:flex-row items-center gap-8">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-10 -mb-8 w-40 h-40 bg-purple-400 opacity-20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 flex-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3 h-3" /> Student Dashboard
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Welcome back, {profile?.full_name?.split(' ')?.[0] || 'User'}!
          </h1>
          {profile?.course_name && (
            <p className="text-blue-200 font-medium text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> {profile.course_name} {profile.year_of_study ? `— ${profile.year_of_study}` : ''}
            </p>
          )}
          <p className="text-blue-100 max-w-xl text-lg opacity-90">
            Ready to take the next step in your career? Connect with mentors, discover jobs, and explore upcoming events.
          </p>
        </div>
        
        <div className="relative z-10 flex-shrink-0">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-white/20 overflow-hidden shadow-xl">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <Users className="w-12 h-12 text-white/50" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Jobs</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.jobs}</p>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Messages</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.messages}</p>
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
            <h2 className="text-xl font-bold flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-500"/> Latest Jobs</h2>
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
