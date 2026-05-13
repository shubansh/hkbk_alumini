import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Users, GraduationCap, Calendar, Image as ImageIcon, Sparkles, TrendingUp, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

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
      
      {/* Welcome Hero */}
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 p-8 sm:p-12 shadow-2xl shadow-indigo-900/20 flex flex-col md:flex-row items-center gap-10">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-purple-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 -mb-10 w-40 h-40 bg-blue-400 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex-shrink-0">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-[6px] border-white/20 overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm relative group">
            {userProfile?.avatar_url ? (
              <img src={userProfile.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
                <span className="text-4xl font-bold text-white shadow-sm">
                  {userProfile?.full_name?.charAt(0)?.toUpperCase() || 'A'}
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
            Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}, {userProfile?.full_name?.split(' ')?.[0] || 'Administrator'} 👋
          </h1>
          <p className="text-purple-200 font-semibold text-lg sm:text-xl mb-4 flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="w-5 h-5 text-amber-300" /> System Command Center
          </p>
          <p className="text-blue-50/80 max-w-2xl text-base sm:text-lg leading-relaxed mb-6">
            Manage users, approve alumni requests, and orchestrate platform content across the university network.
          </p>
          
          <div className="inline-flex items-center gap-3 bg-white/10 border border-white/20 px-4 py-2 rounded-2xl backdrop-blur-md w-fit mx-auto md:mx-0">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> All Systems Operational
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <div key={stat.name} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/50 dark:border-white/10 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 overflow-hidden relative group">
            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${stat.color}`}></div>
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <Link to={stat.to} className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-200 dark:hover:bg-slate-700">
                <ChevronRight className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </Link>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{stat.name}</p>
              <p className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          Management Hub
        </h2>
        <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl p-8 shadow-sm">
          <p className="text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl mb-6">
            Welcome to the centralized dashboard. Use the sidebar to navigate through specific administrative modules. Ensure you review pending alumni requests regularly to maintain network integrity.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link to="/admin/alumni-approval" className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 flex items-center gap-2">
              <GraduationCap className="w-5 h-5" /> Review Pending Alumni
            </Link>
            <Link to="/admin/people" className="px-6 py-3 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-white font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
              <Users className="w-5 h-5" /> Manage Faculty Leaders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
