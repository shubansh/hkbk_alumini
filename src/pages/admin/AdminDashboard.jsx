import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Users, GraduationCap, Calendar, Image as ImageIcon, Sparkles, TrendingUp, ShieldCheck, Activity } from 'lucide-react';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/dashboard/QuickActions';
import ActivityFeed from '../../components/dashboard/ActivityFeed';
import { ContentGrid, EmptyStateWidget, SystemStatusWidget } from '../../components/dashboard/DashboardWidgets';

export default function AdminDashboard() {
  const { userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalAlumni: 0,
    totalEvents: 0,
    totalImages: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    const { count: totalUsers } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: totalAlumni } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'alumni');
    const { count: totalEvents } = await supabase.from('events').select('*', { count: 'exact', head: true });
    const { count: totalImages } = await supabase.from('gallery_images').select('*', { count: 'exact', head: true });
    
    setStats({
      totalUsers: totalUsers || 0,
      totalAlumni: totalAlumni || 0,
      totalEvents: totalEvents || 0,
      totalImages: totalImages || 0
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();

    // Set up realtime updates for stats
    const profilesSub = supabase.channel('dashboard-profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .subscribe();
      
    const eventsSub = supabase.channel('dashboard-events')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, fetchStats)
      .subscribe();
      
    const gallerySub = supabase.channel('dashboard-gallery')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gallery_images' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(profilesSub);
      supabase.removeChannel(eventsSub);
      supabase.removeChannel(gallerySub);
    };
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-10 h-10 border-4 border-indigo-500/30 border-t-indigo-600 rounded-full animate-spin"></div>
    </div>
  );

  const statCards = [
    { name: 'Total Users', value: stats.totalUsers, icon: Users, color: 'from-blue-500 to-indigo-600', to: '/dashboard/users' },
    { name: 'Verified Alumni', value: stats.totalAlumni, icon: GraduationCap, color: 'from-emerald-500 to-teal-600', to: '/dashboard/users' },
    { name: 'Total Events', value: stats.totalEvents, icon: Calendar, color: 'from-purple-500 to-fuchsia-600', to: '/dashboard/events' },
    { name: 'Gallery Images', value: stats.totalImages, icon: ImageIcon, color: 'from-orange-500 to-rose-600', to: '/dashboard/gallery' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* SaaS Compact Header - Platform Control Center */}
      <div className="bg-theme-card backdrop-blur-2xl border border-theme-border rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between shadow-sm relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>
        
        {/* Left: User Info & Status */}
        <div className="flex items-center gap-5 relative z-10">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[2px] shadow-md">
              <div className="w-full h-full bg-theme-card rounded-[14px] overflow-hidden flex items-center justify-center">
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                   <span className="text-xl sm:text-2xl font-black text-theme-text">
                      {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
                   </span>
                )}
              </div>
            </div>
            {/* Animated Status Indicator */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-theme-card rounded-full animate-pulse shadow-sm"></div>
          </div>
          
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h1 className="text-xl sm:text-2xl font-black text-theme-text tracking-tight">
                {new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 18 ? 'Good Afternoon' : 'Good Evening'}, {userProfile?.full_name?.split(' ')?.[0] || 'Admin'}
              </h1>
              <span className="bg-indigo-500/10 text-theme-primary border border-theme-primary/20 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">
                Platform Control Center
              </span>
            </div>
            
            <div className="mt-2 inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">All Systems Operational</span>
            </div>
          </div>
        </div>

        {/* Right: Key Platform Metrics */}
        <div className="flex gap-6 sm:gap-8 lg:border-l lg:border-theme-border lg:pl-8 relative z-10">
          <div className="flex flex-col">
            <span className="text-3xl font-black text-theme-text tracking-tighter">{stats.totalUsers}</span>
            <span className="text-[10px] sm:text-xs font-bold text-theme-text-muted uppercase tracking-wider">Total Users</span>
          </div>
          <div className="w-px bg-theme-border"></div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-theme-text tracking-tighter">{stats.totalAlumni}</span>
            <span className="text-[10px] sm:text-xs font-bold text-theme-text-muted uppercase tracking-wider">Verified Alumni</span>
          </div>
          <div className="w-px bg-theme-border"></div>
          <div className="flex flex-col">
            <span className="text-3xl font-black text-theme-text tracking-tighter">{stats.totalEvents}</span>
            <span className="text-[10px] sm:text-xs font-bold text-theme-text-muted uppercase tracking-wider">Events Hosted</span>
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <QuickActions 
        title="Pending Actions & Management Shortcuts" 
        actions={[
          { title: 'Review Alumni', desc: 'Approve pending requests', icon: ShieldCheck, to: '/dashboard/admin/alumni-approval', colorClass: 'from-blue-500 to-indigo-600' },
          { title: 'Manage Faculty', desc: 'Add or update faculty profiles', icon: GraduationCap, to: '/dashboard/admin/faculty', colorClass: 'from-purple-500 to-fuchsia-600' },
          { title: 'System Users', desc: 'Manage platform access', icon: Users, to: '/dashboard/admin/users', colorClass: 'from-emerald-500 to-teal-600' },
          { title: 'Platform Gallery', desc: 'Moderate uploaded images', icon: ImageIcon, to: '/dashboard/admin/gallery', colorClass: 'from-orange-500 to-rose-600' }
        ]} 
      />

      {/* Main Content Grid */}
      <ContentGrid>
        <SystemStatusWidget />
        
        <EmptyStateWidget 
          title="User Growth Statistics"
          desc="Analytics engine is compiling user engagement and registration trends over time."
          icon={TrendingUp}
          colorClass="text-indigo-500 dark:text-indigo-400"
          bgClass="bg-indigo-100 dark:bg-indigo-900/30"
        />

        <ActivityFeed 
          title="Recent Activity Timeline"
          items={[]}
          emptyMessage="No recent system alerts or administrative actions to display."
          emptyIcon={Activity}
        />
      </ContentGrid>
    </div>
  );
}
