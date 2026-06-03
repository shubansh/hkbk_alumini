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
import { useAuth } from '../contexts/AuthContext';


// ─── Role-based nav configuration ────────────────────────────────────────────
const NAV_CONFIG = {
  student: [
    {
      category: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      category: 'CAREER',
      items: [
        { name: 'Jobs & Internships', path: '/jobs', icon: Briefcase },
        { name: 'Find a Mentor', path: '/dashboard/mentorship', icon: HeartHandshake }
      ]
    },
    {
      category: 'NETWORK',
      items: [
        { name: 'Alumni Directory', path: '/directory', icon: Search },
        { name: 'Messages', path: '/dashboard/messages', icon: MessageSquare }
      ]
    },
    {
      category: 'EVENTS',
      items: [
        { name: 'My Events', path: '/dashboard/events', icon: Calendar },
        { name: 'All Events', path: '/events', icon: Calendar }
      ]
    }
  ],
  alumni: [
    {
      category: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard }
      ]
    },
    {
      category: 'CONTRIBUTE',
      items: [
        { name: 'Post Opportunity', path: '/jobs', icon: Briefcase },
        { name: 'Mentorship', path: '/dashboard/mentorship', icon: HeartHandshake }
      ]
    },
    {
      category: 'NETWORK',
      items: [
        { name: 'Messages', path: '/dashboard/messages', icon: MessageSquare }
      ]
    },
    {
      category: 'EVENTS',
      items: [
        { name: 'My Events', path: '/dashboard/events', icon: Calendar },
        { name: 'All Events', path: '/events', icon: Calendar }
      ]
    }
  ],
  admin: [
    {
      category: 'MAIN',
      items: [
        { name: 'Dashboard', path: '/dashboard/admin', icon: LayoutDashboard }
      ]
    },
    {
      category: 'MANAGEMENT',
      items: [
        { name: 'Alumni Approval', path: '/dashboard/admin/alumni-approval', icon: ShieldCheck },
        { name: 'User Management', path: '/dashboard/admin/users', icon: Users },
        { name: 'Faculty', path: '/dashboard/admin/faculty', icon: GraduationCap }
      ]
    },
    {
      category: 'CONTENT',
      items: [
        { name: 'Gallery', path: '/dashboard/admin/gallery', icon: Image },
        { name: 'Events', path: '/dashboard/admin/events', icon: Calendar },
        { name: 'Social Feed', path: '/dashboard/admin/social-feed', icon: LinkedinIcon }
      ]
    },
    {
      category: 'COMMUNICATION',
      items: [
        { name: 'Messages', path: '/dashboard/messages', icon: MessageSquare },
        { name: 'Support Messages', path: '/dashboard/admin/contact-messages', icon: Mail }
      ]
    },
    {
      category: 'SETTINGS',
      items: [
        { name: 'Settings', path: '/dashboard/admin/settings', icon: Settings }
      ]
    }
  ]
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
    // authLogout() already does window.location.replace('/login') — no navigate needed
  };


  // Build nav items — all paths are now absolute, no joining needed
  const roleNav  = NAV_CONFIG[role] ?? NAV_CONFIG.student;
  const navItems = roleNav;

  const portalLabel = ROLE_LABELS[role] ?? 'Dashboard';

  return (
    <div className="flex-1 w-full min-h-screen flex font-sans">
      
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Premium SaaS Sidebar */}
      <div 
        onMouseLeave={() => setUserMenuOpen(false)}
        className={`fixed inset-y-0 left-0 z-50 bg-theme-sidebar backdrop-blur-2xl border-r border-theme-border transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col shadow-2xl shadow-black/5 group/sidebar
          ${sidebarOpen ? 'translate-x-0 w-[280px]' : '-translate-x-full w-[280px]'} 
          md:translate-x-0 md:w-[80px] 
          xl:w-[280px]
        `}
      >
        <div className="flex-1 flex flex-col h-full relative">

          {/* Logo & Header */}
          <div className="h-20 flex items-center justify-center xl:justify-start px-0 xl:px-6 border-b border-theme-border whitespace-nowrap">
            <div className={`flex items-center gap-3 transition-all ${sidebarOpen ? 'px-6 w-full' : 'w-full justify-center xl:justify-start'}`}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-theme-card shadow-sm border border-theme-border">
                <img src="/logos/college/logo.png" className="w-7 h-7 object-contain" alt="HKBK Logo" />
              </div>
              <div className={`flex-col min-w-0 md:hidden xl:flex ${sidebarOpen ? 'flex' : 'hidden'}`}>
                <p className="text-base font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight leading-tight">
                  HKBK CE Connect
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest truncate">{portalLabel}</p>
              </div>
            </div>
            
            <button 
              className="md:hidden p-2 mr-4 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors absolute right-0" 
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Navigation Area */}
          <div className="flex-1 overflow-y-auto py-6 no-scrollbar relative">
            <nav className="px-3 xl:px-4 space-y-6">
              {navItems.map((group, gIdx) => (
                <div key={gIdx} className="space-y-1.5">
                  <div className={`px-2 mb-2 text-[10px] font-black tracking-widest text-gray-400 dark:text-gray-500 uppercase transition-all md:hidden xl:block ${sidebarOpen ? '!block' : 'hidden'} text-center xl:text-left`}>
                    {group.category}
                  </div>
                  {/* Tablet Divider (when category labels are hidden) */}
                  <div className={`mx-auto w-6 h-px bg-gray-200 dark:bg-slate-700 my-4 md:block xl:hidden ${sidebarOpen ? '!hidden' : 'hidden'}`}></div>
                  
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = location.pathname === item.path ||
                      (item.path !== '/dashboard' && item.path !== '/dashboard/admin' &&
                        location.pathname.startsWith(item.path));

                    return (
                      <div key={item.name} className="relative group/navitem">
                        <Link
                          to={item.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`flex items-center rounded-xl transition-all duration-300 relative ${
                            isActive
                              ? 'bg-black/5 dark:bg-white/10 shadow-[inset_0px_1px_0px_0px_rgba(255,255,255,0.05)] ring-1 ring-white/5'
                              : 'hover:bg-black/5 dark:hover:bg-white/5'
                          } ${sidebarOpen ? 'px-4 py-2.5 justify-start' : 'px-0 py-2.5 justify-center xl:px-4 xl:justify-start'}`}
                        >
                          {/* Active Indicator Line */}
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 rounded-r-full shadow-lg" style={{ backgroundColor: 'var(--theme-primary)' }} />
                          )}
                          
                          <div className={`flex items-center justify-center w-8 h-8 flex-shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/navitem:scale-110'}`}>
                            <Icon className="w-5 h-5 transition-colors" style={{ color: isActive ? 'var(--theme-primary)' : 'var(--theme-text-muted)' }} />
                          </div>
                          
                          <span className={`ml-3 font-semibold text-sm whitespace-nowrap transition-all md:hidden xl:block ${sidebarOpen ? '!block' : 'hidden'} ${isActive ? 'text-theme-primary' : 'text-theme-text-muted group-hover/navitem:text-theme-text'}`}>
                            {item.name}
                          </span>
                          
                          {/* Unread Messages Badge */}
                          {item.name === 'Messages' && unreadCount > 0 && (
                            <span className={`absolute right-3 px-1.5 py-0.5 min-w-[20px] text-center rounded-full text-[10px] font-black md:hidden xl:block ${sidebarOpen ? '!block' : 'hidden'} ${isActive ? 'bg-blue-600 text-white' : 'bg-red-500 text-white shadow-md shadow-red-500/20'}`}>
                              {unreadCount}
                            </span>
                          )}
                          
                          {/* Tablet Mini Badge Dot */}
                          {item.name === 'Messages' && unreadCount > 0 && (
                            <span className={`absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 shadow-md shadow-red-500/50 md:block xl:hidden ${sidebarOpen ? '!hidden' : 'block'}`}></span>
                          )}
                        </Link>
                        
                        {/* Premium Hover Tooltip (Tablet Mode Only) */}
                        <div className={`absolute left-full ml-4 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-theme-card backdrop-blur-md text-theme-text text-xs font-bold rounded-lg shadow-xl border border-theme-border opacity-0 invisible group-hover/navitem:opacity-100 group-hover/navitem:visible transition-all whitespace-nowrap z-50 md:block xl:hidden ${sidebarOpen ? '!hidden' : 'block'}`}>
                           {item.name}
                           <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-y-4 border-y-transparent border-r-4 border-r-theme-card"></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 relative z-0 transition-all duration-300 md:ml-[80px] xl:ml-[280px]`}>
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full filter blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-600/10 rounded-full filter blur-[140px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

        {/* Mobile header */}
        <div className="md:hidden h-16 flex items-center justify-between px-4 border-b border-theme-border bg-theme-sidebar backdrop-blur-xl relative z-20 sticky top-0">
          <div className="flex items-center">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="p-2 rounded-xl bg-theme-card border border-theme-border hover:opacity-80 transition-colors"
            >
              <Menu className="w-5 h-5 text-theme-text" />
            </button>
            <div className="ml-3">
              <span className="text-sm font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                {portalLabel}
              </span>
            </div>
          </div>
          
          {/* Mobile Top Action Bar */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-full hover:bg-white dark:hover:bg-slate-800 transition-all duration-300 border border-transparent hover:border-gray-200/50 dark:hover:border-slate-700/50"
              >
                <div className="relative">
                  <ProfileAvatar 
                    userId={userProfile?.id}
                    url={avatarUrl}
                    name={userProfile?.full_name}
                    size="sm"
                    editable={false}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-[1.5px] border-white dark:border-slate-800 rounded-full"></div>
                </div>
              </button>
              {/* Dropdown Menu (Mobile) */}
              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-56 bg-theme-card backdrop-blur-xl border border-theme-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="p-4 border-b border-theme-border bg-black/5 dark:bg-white/5">
                     <p className="text-sm font-bold text-theme-text truncate">{userProfile?.full_name || 'User'}</p>
                     <p className="text-[10px] text-gray-500 truncate">{userProfile?.email || ''}</p>
                  </div>
                  <div className="p-2 space-y-1">
                    <Link to="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group/menu">
                      <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-slate-900 group-hover/menu:bg-white dark:group-hover/menu:bg-slate-800 transition-colors">
                        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover/menu:text-blue-500" />
                      </div>
                      Profile Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group/menu">
                      <div className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 group-hover/menu:bg-red-100 dark:group-hover/menu:bg-red-500/20 transition-colors">
                        <LogOut className="w-4 h-4 text-red-500" />
                      </div>
                      Secure Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Desktop top right actions */}
        {!isMessageRoute && (
          <div className="hidden md:flex absolute top-6 right-8 z-50 items-center gap-3">
            <NotificationBell />
            
            <div className="w-px h-6 bg-gray-200 dark:bg-slate-700/50 mx-1"></div>
            
            {/* Desktop Top Action Bar Profile */}
            <div className="relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 p-1.5 pr-4 rounded-full bg-theme-card backdrop-blur-md border border-theme-border hover:opacity-80 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className="relative">
                  <ProfileAvatar 
                    userId={userProfile?.id}
                    url={avatarUrl}
                    name={userProfile?.full_name}
                    size="sm"
                    editable={false}
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
                </div>
                <div className="flex flex-col items-start ml-1 text-left">
                  <span className="text-sm font-bold text-gray-900 dark:text-white max-w-[120px] truncate leading-tight">
                    {userProfile?.full_name?.split(' ')[0] || 'User'}
                  </span>
                  <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest leading-none mt-1">
                    {role}
                  </span>
                </div>
                <svg className={`w-4 h-4 ml-1 text-gray-400 transition-transform duration-300 ${userMenuOpen ? 'rotate-180 text-blue-500' : 'group-hover:text-blue-500'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </button>

              {/* Dropdown Menu (Desktop) */}
              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-3 w-64 bg-theme-card backdrop-blur-xl border border-theme-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                  <div className="p-5 border-b border-theme-border bg-black/5 dark:bg-white/5">
                     <p className="text-base font-bold text-theme-text truncate">{userProfile?.full_name || 'User'}</p>
                     <p className="text-xs text-theme-text-muted truncate mt-0.5">{userProfile?.email || ''}</p>
                  </div>
                  <div className="p-3 space-y-1">
                    <Link to="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group/menu">
                      <div className="p-2 rounded-lg bg-gray-100 dark:bg-slate-900 group-hover/menu:bg-white dark:group-hover/menu:bg-slate-800 transition-colors">
                        <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover/menu:text-blue-500" />
                      </div>
                      Profile Settings
                    </Link>
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors group/menu">
                      <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 group-hover/menu:bg-red-100 dark:group-hover/menu:bg-red-500/20 transition-colors">
                        <LogOut className="w-4 h-4 text-red-500" />
                      </div>
                      Secure Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <main 
          ref={mainRef}
          className={`flex-1 flex flex-col relative z-10 no-scrollbar ${isMessageRoute ? 'p-0 overflow-hidden h-[calc(100vh-64px)] md:h-screen' : 'p-5 md:p-8 lg:p-10'}`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
