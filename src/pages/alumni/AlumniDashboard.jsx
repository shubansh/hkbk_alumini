import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Briefcase, Calendar, MessageSquare, ChevronRight, Sparkles, HeartHandshake } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';

export default function AlumniDashboard() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({ jobsPosted: 0, messages: 0, connections: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  
  // Use the realtime jobs hook scoped to this alumni
  const { jobs: recentJobs } = useJobs({ postedBy: profile?.id, limit: 3 });

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
              full_name: session.user.user_metadata?.full_name || 'Alumni',
              role: session.user.user_metadata?.role || 'alumni',
              course_name: session.user.user_metadata?.course_name,
              is_approved: false // Always default to false until we can read from db
            });
          }

          let msgCount = 0;
          let jobsCount = 0;
          let mentorshipsCount = 0;
          
          try {
            const { count: msgC } = await supabase.from('messages').select('*', { count: 'exact', head: true }).or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
            msgCount = msgC || 0;
            const { count: jobsC } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('posted_by', session.user.id);
            jobsCount = jobsC || 0;
            const { count: mentorC } = await supabase.from('mentorship_requests').select('*', { count: 'exact', head: true }).eq('alumni_id', session.user.id);
            mentorshipsCount = mentorC || 0;
          } catch(e) { console.error("Stats fetch error:", e); }
          
          setStats({
            jobsPosted: jobsCount,
            messages: msgCount,
            connections: mentorshipsCount,
          });

          // Fetch mentorship requests safely
          const { data: requestData, error: requestsError } = await supabase
            .from('mentorship_requests')
            .select('student_id')
            .eq('alumni_id', session.user.id)
            .order('created_at', { ascending: false });

          if (requestsError) console.error("Mentorship requests error:", requestsError);

          if (requestData && requestData.length > 0) {
            const senderIds = [...new Set(requestData.map(r => r.student_id))].slice(0, 3);
            if (senderIds.length > 0) {
              const { data: studentsData, error: studentsError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', senderIds);
                
              if (studentsError) console.error("Students fetch error:", studentsError);
              if (studentsData) setRecentRequests(studentsData);
            }
          }
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
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  if (profile?.is_approved === false) {
    return (
      <div className="bg-yellow-50/80 backdrop-blur-md border border-yellow-200 p-6 rounded-3xl dark:bg-yellow-900/20 dark:border-yellow-800/30 shadow-lg animate-in fade-in duration-500">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center shrink-0">
            <span className="text-xl">⏳</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-yellow-800 dark:text-yellow-500 mb-1">Account Pending Approval</h3>
            <p className="text-sm text-yellow-700 dark:text-yellow-400 leading-relaxed">
              Welcome to HKBK CE Connect! Your account is currently being reviewed by an administrator to verify your alumni status. You will unlock all features once approved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    { title: 'Post a Job', desc: 'Hire talent from your alma mater', icon: Briefcase, to: '/jobs', color: 'from-blue-500 to-indigo-600' },
    { title: 'Upcoming Events', desc: 'Join reunions & networking', icon: Calendar, to: '/events', color: 'from-orange-500 to-rose-600' },
    { title: 'Mentorship', desc: 'Guide students in their career', icon: MessageSquare, to: '/dashboard/mentorship', color: 'from-emerald-500 to-teal-600' }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200 p-6 rounded-2xl dark:bg-red-900/20 dark:border-red-800/30 shadow-lg">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 sm:p-12 shadow-2xl shadow-blue-900/20 flex flex-col md:flex-row items-center gap-10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-blue-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 -mb-10 w-40 h-40 bg-indigo-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex-shrink-0">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[6px] border-white/20 overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm relative group">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
                <span className="text-4xl font-bold text-white shadow-sm">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
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
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {profile?.full_name?.split(' ')?.[0] || 'Alumni'} 👋
          </h1>
          <p className="text-blue-200 font-semibold text-lg sm:text-xl mb-4 flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" /> 
            {profile?.course_name ? `${profile.course_name} Alumni ${profile.passout_year ? `• Batch ${profile.passout_year}` : ''}` : 'Verified Alumni'}
          </p>
          <p className="text-blue-50/80 max-w-2xl text-base sm:text-lg leading-relaxed">
            Thank you for being part of our legacy. Share your journey, mentor the next generation, and stay connected with your peers.
          </p>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Jobs Posted</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.jobsPosted}</p>
          </div>
        </div>
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Mentorship Requests</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.connections}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          Your Contributions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                Manage <ChevronRight className="w-4 h-4 ml-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recommended Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><HeartHandshake className="w-5 h-5 text-emerald-500"/> Mentorship Requests</h2>
            <Link to="/dashboard/mentorship" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">View All</Link>
          </div>
          
          {recentRequests.length > 0 ? (
            <div className="space-y-4 flex-1">
              {recentRequests.map(req => (
                <div key={req.id} className="p-4 rounded-2xl bg-gray-50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 hover:border-emerald-500/30 transition-colors flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden">
                    {req.avatar_url ? <img src={req.avatar_url} alt="Avatar" className="w-full h-full object-cover"/> : <span className="text-emerald-600 font-bold">{req.full_name?.charAt(0)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{req.full_name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">Student seeking mentorship</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex-1">
              <HeartHandshake className="w-10 h-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400 font-medium">No pending mentorship requests.</p>
              <p className="text-sm text-gray-400 mt-1">Students will reach out to you here.</p>
            </div>
          )}
        </div>

        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl border border-gray-200/50 dark:border-white/10 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-500"/> Your Job Postings</h2>
            <Link to="/jobs" className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">Manage Posts</Link>
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
              <p className="text-gray-500 dark:text-gray-400 font-medium">You haven't posted any jobs yet.</p>
              <p className="text-sm text-gray-400 mt-1">Share opportunities with the network.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
