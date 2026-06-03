import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Briefcase, Calendar, MessageSquare, HeartHandshake, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useJobs } from '../../hooks/useJobs';
import { useAuth } from '../../contexts/AuthContext';
import QuickActions from '../../components/dashboard/QuickActions';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import { ContentGrid, EmptyStateWidget } from '../../components/dashboard/DashboardWidgets';
import { TrendingUp, Users } from 'lucide-react';

export default function AlumniDashboard() {
  const { session, userProfile: profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [stats, setStats] = useState({ jobsPosted: 0, messages: 0, connections: 0 });
  const [recentRequests, setRecentRequests] = useState([]);
  
  // Use the realtime jobs hook scoped to this alumni
  const { jobs: recentJobs } = useJobs({ postedBy: profile?.id, limit: 3 });

  useEffect(() => {
    let isMounted = true;
    
    // Safety fallback: if stats don't load in 5s, unblock UI
    const timeoutId = setTimeout(() => {
      if (isMounted && loading) setLoading(false);
    }, 5000);

    async function fetchStats() {
      if (!session) {
        if (isMounted) setLoading(false);
        return;
      }
      try {

          let msgCount = 0;
          let jobsCount = 0;
          let mentorshipsCount = 0;
          
          try {
            const { count: msgC } = await supabase.from('messages').select('*', { count: 'exact', head: true }).or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);
            msgCount = msgC || 0;
            const { count: jobsC } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('posted_by', session.user.id);
            jobsCount = jobsC || 0;
            const { count: mentorC } = await supabase.from('mentorship_requests').select('*', { count: 'exact', head: true }).eq('alumni_id', session.user.id).eq('status', 'pending');
            mentorshipsCount = mentorC || 0;
          } catch(e) { console.error("Stats fetch error:", e); }
          
          if (!isMounted) return;
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
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

          if (requestsError) console.error("Mentorship requests error:", requestsError);

          if (requestData && requestData.length > 0 && isMounted) {
            const senderIds = [...new Set(requestData.map(r => r.student_id))].slice(0, 3);
            if (senderIds.length > 0) {
              const { data: studentsData, error: studentsError } = await supabase
                .from('profiles')
                .select('*')
                .in('id', senderIds);
                
              if (studentsError) console.error("Students fetch error:", studentsError);
              if (studentsData && isMounted) setRecentRequests(studentsData);
            }
          }
      } catch (err) {
        console.error("Critical dashboard error:", err);
        if (isMounted) setError("Having trouble loading some data, but you can still use the dashboard.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    
    fetchStats();
    
    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [session]);

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
    { title: 'Post an Opportunity', desc: 'Hire talent from your alma mater', icon: Briefcase, to: '/jobs', color: 'from-blue-500 to-indigo-600' },
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

      {/* SaaS Compact Header - Alumni Impact Center */}
      <div className="bg-theme-card backdrop-blur-2xl border border-theme-border rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 dark:bg-emerald-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        {/* Left: User Info */}
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-[2px] shadow-md">
              <div className="w-full h-full bg-theme-card rounded-[14px] overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <span className="text-xl sm:text-2xl font-black text-theme-text">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                   </span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-theme-card rounded-full shadow-sm"></div>
          </div>
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-xl sm:text-2xl font-black text-theme-text tracking-tight">
                {profile?.full_name?.split(' ')?.[0] || 'Alumni'}
              </h1>
              <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                Alumni Impact Center
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-theme-text-muted flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span>{profile?.course_name || 'Alumni'} {profile?.passout_year ? `• Batch of ${profile.passout_year}` : ''}</span>
            </p>
            {profile?.designation && profile?.company && (
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mt-2 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-emerald-500" />
                {profile.designation} at {profile.company}
              </p>
            )}
          </div>
        </div>

        {/* Right: Key Metrics */}
        <div className="flex gap-6 sm:gap-8 lg:border-l lg:border-theme-border lg:pl-8 relative z-10">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-theme-text tracking-tighter">{stats.jobsPosted}</span>
            <span className="text-[10px] sm:text-xs font-bold text-theme-text-muted uppercase tracking-wider">Posts</span>
          </div>
          <div className="w-px bg-theme-border"></div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-theme-text tracking-tighter">{stats.connections}</span>
            <span className="text-[10px] sm:text-xs font-bold text-theme-text-muted uppercase tracking-wider">Mentees</span>
          </div>
          <div className="w-px bg-theme-border"></div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-theme-text tracking-tighter">{stats.messages}</span>
            <span className="text-[10px] sm:text-xs font-bold text-theme-text-muted uppercase tracking-wider">Network</span>
          </div>
        </div>
      </div>
      
      {/* Quick Actions Component */}
      <QuickActions actions={quickActions} title="Your Contributions" />

      {/* Main Content Grid */}
      <ContentGrid>
        <ActivityFeed 
          title="Mentorship Requests"
          items={recentRequests.map(req => ({
            id: req.id,
            title: req.full_name,
            desc: "Student seeking mentorship",
            avatarUrl: req.avatar_url,
            icon: HeartHandshake,
            iconColorClass: 'text-emerald-600 dark:text-emerald-400',
            iconBgClass: 'bg-emerald-100 dark:bg-emerald-900/30'
          }))}
          emptyMessage="No pending mentorship requests."
          emptyIcon={HeartHandshake}
          viewAllLink="/dashboard/mentorship"
        />

        <ActivityFeed 
          title="Your Opportunities"
          items={recentJobs.map(job => ({
            id: job.id,
            title: job.title,
            desc: `${job.company} • ${job.location}`,
            icon: Briefcase,
            iconColorClass: 'text-blue-600 dark:text-blue-400',
            iconBgClass: 'bg-blue-100 dark:bg-blue-900/30'
          }))}
          emptyMessage="You haven't posted any jobs yet."
          emptyIcon={Briefcase}
          viewAllLink="/jobs"
          viewAllText="Manage Posts"
        />

        <EmptyStateWidget 
          title="Upcoming Events"
          desc="No upcoming events scheduled. Stay tuned for alumni meetups and reunions!"
          icon={Calendar}
          colorClass="text-rose-500 dark:text-rose-400"
          bgClass="bg-rose-100 dark:bg-rose-900/30"
        />
      </ContentGrid>

      {/* Secondary Grid for Growth and Activity */}
      <ContentGrid className="mt-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        <EmptyStateWidget 
          title="Network Growth"
          desc="Your mentorship impact and network growth statistics are being calculated."
          icon={TrendingUp}
          colorClass="text-purple-500 dark:text-purple-400"
          bgClass="bg-purple-100 dark:bg-purple-900/30"
        />
        
        <EmptyStateWidget 
          title="Recent Alumni Activity"
          desc="Connect with other alumni to see their latest career updates and achievements."
          icon={Users}
          colorClass="text-blue-500 dark:text-blue-400"
          bgClass="bg-blue-100 dark:bg-blue-900/30"
        />
      </ContentGrid>
    </div>
  );
}
