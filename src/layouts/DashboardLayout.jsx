import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Calendar, 
  MessageSquare, 
  LogOut,
  Menu,
  X,
  Image,
  HeartHandshake,
  Search,
  ShieldCheck,
  Settings,
  GraduationCap,
  ExternalLink as LinkedinIcon,
  Mail
} from 'lucide-react';
import ProfileAvatar from '../components/ProfileAvatar';
import NotificationBell from '../components/NotificationBell';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';


// ─── Role-based nav configuration ────────────────────────────────────────────
const NAV_CONFIG = {
  student: [
    { name: 'Dashboard',        path: '',              icon: LayoutDashboard },
    { name: 'Jobs & Internships', path: '/jobs',         icon: Briefcase,       external: true },
    { name: 'Find a Mentor',    path: '/mentorship',   icon: HeartHandshake },
    { name: 'Messages',         path: '/messages',     icon: MessageSquare },
    { name: 'Alumni Directory', path: '/directory',    icon: Search,          external: true },
    { name: 'Events',           path: '/events',       icon: Calendar,        external: true },
  ],
  alumni: [
    { name: 'Dashboard',          path: '',            icon: LayoutDashboard },
    { name: 'Jobs & Internships', path: '/jobs',       icon: Briefcase,       external: true },
    { name: 'Mentorship',         path: '/mentorship', icon: HeartHandshake },
    { name: 'Messages',           path: '/messages',   icon: MessageSquare },
    { name: 'Events',             path: '/events',     icon: Calendar,        external: true },
  ],
  admin: [
    { name: 'Dashboard',          path: '',                    icon: LayoutDashboard },
    { name: 'Alumni Approval',    path: '/alumni-approval',    icon: ShieldCheck },
    { name: 'User Management',    path: '/users',              icon: Users },

    { name: 'Faculty Management', path: '/faculty',            icon: GraduationCap },
    { name: 'Faculty (People)',   path: '/people',             icon: Users },
    { name: 'Gallery',            path: '/gallery',            icon: Image },
    { name: 'Events',             path: '/events',             icon: Calendar },
    { name: 'Inbound Messages',   path: '/messages',           icon: MessageSquare },
    { name: 'Support Messages',   path: '/contact-messages',   icon: Mail },
    { name: 'Social Feed',        path: '/social-feed',        icon: LinkedinIcon },
    { name: 'Settings',           path: '/settings',           icon: Settings },
  ],
};

const ROLE_LABELS = {
  student: 'Student Dashboard',
  alumni:  'Alumni Dashboard',
  admin:   'Admin Panel',
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardLayout({ role, basePath = '/dashboard' }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { userProfile, handleLogout: authLogout } = useAuth();
  // local avatar state for optimistic upload preview
  const [avatarUrl, setAvatarUrl] = useState(userProfile?.avatar_url ?? null);
  const location = useLocation();
  const navigate = useNavigate();
  const mainRef = useRef(null);

  const isMessageRoute = location.pathname === '/dashboard/messages';

  useEffect(() => {
    // Reset scroll position on route change
    if (mainRef.current) {
      mainRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  // Keep avatar in sync if userProfile changes
  useEffect(() => {
    setAvatarUrl(userProfile?.avatar_url ?? null);
  }, [userProfile?.avatar_url]);

  // Unread Messages Logic
  useEffect(() => {
    let isMounted = true;
    let channel = null;

    if (!userProfile?.id) return;

    const fetchUnread = async () => {
      try {
        const { count, error } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('receiver_id', userProfile.id)
          .eq('is_read', false);
        
        if (!error && isMounted) {
          setUnreadCount(count || 0);
        }
      } catch (err) {
        console.error('Failed to fetch unread messages', err);
      }
    };

    fetchUnread();

    channel = supabase
      .channel(`unread_messages_${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userProfile.id}` }, () => {
        fetchUnread();
      })
      .subscribe();

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe();
        supabase.removeChannel(channel);
      }
    };
  }, [userProfile?.id]);

  const handleLogout = async () => {
    await authLogout();
    navigate('/login');
  };


  // Build nav items for this role
  const roleNav = NAV_CONFIG[role] ?? NAV_CONFIG.student;
  const navItems = roleNav.map(item => ({
    ...item,
    // External links (outside dashboard) use their own path
    // Internal links are relative to basePath
    href: item.external ? item.path : `${basePath}${item.path}`,
  }));

  const portalLabel = ROLE_LABELS[role] ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950 flex font-sans text-gray-900 dark:text-gray-100">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div 
        onMouseLeave={() => setUserMenuOpen(false)}
        className={`fixed inset-y-0 left-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-white/10 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 flex flex-col shadow-2xl shadow-blue-900/5 group/sidebar overflow-hidden ${
          sidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:w-[5.5rem] md:hover:w-72 w-72'
        }`}
      >
        <div className="flex-1 flex flex-col h-full">

          {/* Logo */}
          <div className="h-20 flex items-center px-5 border-b border-gray-200/50 dark:border-white/5 whitespace-nowrap">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0">
                <img src="/logos/college/logo.png" className="w-10 h-10 object-contain drop-shadow-md dark:drop-shadow-[0_2px_4px_rgba(255,255,255,0.2)]" alt="HKBK Logo" />
              </div>
              <div className="min-w-0 transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100">
                <p className="text-base font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight leading-tight">
                  HKBK CE Connect
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">{portalLabel}</p>
              </div>
            </div>
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors absolute right-4" 
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex-1 overflow-y-auto py-6 custom-scrollbar">
            <nav className="px-4 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.external
                  ? location.pathname === item.href
                  : location.pathname === item.href || 
                    (item.href !== basePath && location.pathname.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`group flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 relative overflow-hidden ${
                      isActive
                        ? 'text-white shadow-md shadow-blue-500/20'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-white/5'
                    }`}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 dark:from-blue-600/20 dark:to-indigo-600/20" />}
                    {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-600 to-indigo-600 rounded-r-full" />}
                    <div className="flex items-center justify-center w-6 h-6 flex-shrink-0 ml-1">
                      <Icon className={`w-5 h-5 relative z-10 transition-colors ${isActive ? 'text-blue-600 dark:text-blue-400 drop-shadow-md' : 'text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`} />
                    </div>
                    <span className={`ml-3 relative z-10 flex-1 whitespace-nowrap transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 ${isActive ? 'text-blue-700 dark:text-blue-300 font-bold' : ''}`}>
                      {item.name}
                    </span>
                    
                    {/* Unread Messages Badge */}
                    {item.name === 'Messages' && unreadCount > 0 && (
                      <span className={`relative z-10 px-1.5 py-0.5 min-w-[20px] text-center rounded-full text-[10px] font-black transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-red-500 text-white shadow-md shadow-red-500/20'}`}>
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* User Dropdown */}
            <div className="mx-4 mt-6 mb-4 relative whitespace-nowrap">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center p-3 rounded-2xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700 hover:shadow-md hover:bg-white dark:hover:bg-slate-800 transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden w-full">
                  <div className="flex-shrink-0 ml-[-2px]">
                    <ProfileAvatar 
                      userId={userProfile?.id}
                      url={avatarUrl}
                      name={userProfile?.full_name}
                      size="sm"
                      editable={false}
                    />
                  </div>
                  <div className="text-left min-w-0 transition-opacity duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 flex-1">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userProfile?.full_name || 'User'}</p>
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 capitalize truncate">{role}</p>
                  </div>
                  <div className={`text-gray-400 transition-all duration-300 md:opacity-0 md:group-hover/sidebar:opacity-100 ${userMenuOpen ? 'rotate-180' : ''}`}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                  </div>
                </div>
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 z-50">
                  <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                    <Settings className="w-4 h-4" /> Profile Settings
                  </Link>
                  <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content area - Offsets the fixed collapsed sidebar on desktop */}
      <div className="flex-1 flex flex-col min-w-0 relative z-0 overflow-hidden md:ml-[5.5rem]">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full filter blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-600/10 rounded-full filter blur-[140px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

        {/* Mobile header */}
        <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-gray-200/50 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-20">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="ml-3 text-base font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              {portalLabel}
            </span>
          </div>
          <NotificationBell />
        </div>

        {/* Desktop top right actions */}
        {!isMessageRoute && (
          <div className="hidden md:flex absolute top-0 right-0 p-6 z-20">
            <NotificationBell />
          </div>
        )}

        <main 
          ref={mainRef}
          className={`flex-1 relative z-10 custom-scrollbar ${isMessageRoute ? 'p-0 overflow-hidden' : 'p-5 md:p-8 lg:p-10 overflow-y-auto'}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
