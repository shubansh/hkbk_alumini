import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Briefcase, Users, Search, Calendar, Sparkles, Activity } from 'lucide-react';
import { useJobs } from '../../hooks/useJobs';
import { useAuth } from '../../contexts/AuthContext';

import DashboardHero from '../../components/dashboard/DashboardHero'; // Kept import for safety if needed later
import StatsGrid from '../../components/dashboard/StatsGrid'; // Kept import for safety if needed later
import QuickActions from '../../components/dashboard/QuickActions';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import CountdownWidget from '../../components/dashboard/CountdownWidget';
import { ContentGrid, EmptyStateWidget } from '../../components/dashboard/DashboardWidgets';

export default function StudentDashboard() {
  const { session, userProfile: profile } = useAuth();
  const [stats, setStats] = useState({ jobs: 0, events: 0, connections: 0 });
  const [recentEvents, setRecentEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reusable realtime jobs hook replacing local fetch
  const { jobs: recentJobs } = useJobs({ status: 'approved', limit: 3 });

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

          // Fetch stats safely
          const { count: eventsCount, error: eventsError } = await supabase.from('events').select('*', { count: 'exact', head: true }).gte('date', new Date().toISOString());
          if (eventsError) console.error("Events stats error:", eventsError);
          
          const { count: jobsCount, error: jobsError } = await supabase.from('jobs').select('*', { count: 'exact', head: true });
          if (jobsError) console.error("Jobs stats error:", jobsError);

          const { count: mentorCount } = await supabase.from('mentorship_requests').select('*', { count: 'exact', head: true }).eq('student_id', session.user.id);
          
          if (!isMounted) return;
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
          if (eventsData && isMounted) setRecentEvents(eventsData);
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
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  const greetingTime = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening';
  const nextEvent = recentEvents.find(e => new Date(e.date) > new Date());

  const quickActions = [
    { title: 'Browse Jobs', desc: 'Explore opportunities', icon: Briefcase, to: '/jobs', colorClass: 'from-blue-500 to-indigo-600' },
    { title: 'Find a Mentor', desc: 'Connect with alumni', icon: Users, to: '/dashboard/mentorship', colorClass: 'from-purple-500 to-fuchsia-600' },
    { title: 'Alumni Directory', desc: 'Search past graduates', icon: Search, to: '/directory', colorClass: 'from-emerald-500 to-teal-600' },
    { title: 'Explore Events', desc: 'Join reunions & talks', icon: Calendar, to: '/events', colorClass: 'from-orange-500 to-rose-600' }
  ];

  const statItems = [
    { label: 'New Opportunities', value: stats.jobs, icon: Briefcase, colorClass: 'from-blue-500 to-indigo-600', to: '/jobs' },
    { label: 'Upcoming Events', value: stats.events, icon: Calendar, colorClass: 'from-rose-500 to-orange-500', to: '/events' },
    { label: 'Alumni Connections', value: stats.connections, icon: Users, colorClass: 'from-emerald-500 to-teal-600', to: '/dashboard/mentorship' }
  ];

  // Map recent jobs and events into an activity feed
  const activities = [
    ...recentJobs.map(j => ({
      id: `job-${j.id}`,
      title: 'New Job Posted',
      desc: `${j.title} at ${j.company}`,
      icon: Briefcase,
      date: new Date(j.created_at).toLocaleDateString(),
      iconColorClass: 'text-blue-500',
      iconBgClass: 'bg-blue-100 dark:bg-blue-900/30'
    })),
    ...recentEvents.map(e => ({
      id: `event-${e.id}`,
      title: 'Event Registration Open',
      desc: e.title,
      icon: Calendar,
      date: new Date(e.created_at).toLocaleDateString(),
      iconColorClass: 'text-rose-500',
      iconBgClass: 'bg-rose-100 dark:bg-rose-900/30'
    }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {error && (
        <div className="bg-red-50/80 backdrop-blur-md border border-red-200 p-6 rounded-2xl dark:bg-red-900/20 dark:border-red-800/30 shadow-lg">
          <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* SaaS Compact Header - Career Growth Hub */}
      <div className="bg-theme-card backdrop-blur-2xl border border-theme-border rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 dark:bg-blue-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        {/* Left: User Info */}
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-[2px] shadow-md">
              <div className="w-full h-full bg-theme-card rounded-[14px] overflow-hidden flex items-center justify-center">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <span className="text-xl sm:text-2xl font-black text-theme-text">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'S'}
                   </span>
                )}
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-theme-card rounded-full shadow-sm"></div>
          </div>
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-xl sm:text-2xl font-black text-theme-text tracking-tight">
                {greetingTime}, {profile?.full_name?.split(' ')?.[0] || 'Student'}
              </h1>
              <span className="bg-blue-500/10 text-theme-primary border border-theme-primary/20 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                Career Growth Hub
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-theme-text-muted flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span>{profile?.course_name || 'Student'}</span>
              <span className="hidden sm:inline">•</span>
              <span>Semester {profile?.current_semester || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Right: Key Metrics */}
        <div className="flex gap-6 sm:gap-8 lg:border-l lg:border-theme-border lg:pl-8 relative z-10">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-theme-text tracking-tighter">{stats.jobs}</span>
            <span className="text-[10px] sm:text-xs font-bold text-theme-text-muted uppercase tracking-wider">Opportunities</span>
          </div>
          <div className="w-px bg-theme-border"></div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-theme-text tracking-tighter">{stats.events}</span>
            <span className="text-[10px] sm:text-xs font-bold text-theme-text-muted uppercase tracking-wider">Events</span>
          </div>
          <div className="w-px bg-theme-border"></div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-theme-text tracking-tighter">{stats.connections}</span>
            <span className="text-[10px] sm:text-xs font-bold text-theme-text-muted uppercase tracking-wider">Network</span>
          </div>
        </div>
      </div>

      {/* Countdown Widget Placed Logically */}
      {nextEvent && (
        <div className="flex justify-end -mt-4">
          <CountdownWidget date={nextEvent.date} title="Next Upcoming Event" />
        </div>
      )}

      
      {/* Quick Actions Grid */}
      <QuickActions actions={quickActions} />

      {/* Main Content Grid */}
      <ContentGrid>
        <ActivityFeed 
          title="Recent Opportunities"
          items={recentJobs.map(j => ({
            id: `job-${j.id}`,
            title: j.title,
            desc: j.company,
            icon: Briefcase,
            date: new Date(j.created_at).toLocaleDateString(),
            iconColorClass: 'text-blue-500 dark:text-blue-400',
            iconBgClass: 'bg-blue-100 dark:bg-blue-900/30'
          }))}
          emptyMessage="No new opportunities."
          emptyIcon={Briefcase}
          viewAllLink="/jobs"
        />

        <ActivityFeed 
          title="Upcoming Events"
          items={recentEvents.map(e => ({
            id: `event-${e.id}`,
            title: e.title,
            desc: new Date(e.date).toLocaleDateString(),
            icon: Calendar,
            date: new Date(e.created_at).toLocaleDateString(),
            iconColorClass: 'text-rose-500 dark:text-rose-400',
            iconBgClass: 'bg-rose-100 dark:bg-rose-900/30'
          }))}
          emptyMessage="No upcoming events."
          emptyIcon={Calendar}
          viewAllLink="/events"
        />

        <EmptyStateWidget 
          title="Recommended Alumni"
          desc="We are analyzing your profile to suggest the best mentors for your career path."
          icon={Users}
          colorClass="text-emerald-500 dark:text-emerald-400"
          bgClass="bg-emerald-100 dark:bg-emerald-900/30"
        />
      </ContentGrid>

      {/* Full Width Activity Feed Section */}
      <div className="grid grid-cols-1 gap-8 mt-8">
        <ActivityFeed 
          title="Recent Activity Timeline"
          items={activities}
          emptyMessage="No recent activities."
          emptyIcon={Activity}
        />
      </div>
    </div>
  );
}
