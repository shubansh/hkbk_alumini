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
  ExternalLink as LinkedinIcon
} from 'lucide-react';
import ProfileAvatar from '../components/ProfileAvatar';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';


// ─── Role-based nav configuration ────────────────────────────────────────────
const NAV_CONFIG = {
  student: [
    { name: 'Dashboard',        path: '',              icon: LayoutDashboard },
    { name: 'Find a Job',       path: '/jobs',         icon: Briefcase,       external: true },
    { name: 'Find a Mentor',    path: '/mentorship',   icon: HeartHandshake },
    { name: 'Messages',         path: '/messages',     icon: MessageSquare },
    { name: 'Alumni Directory', path: '/directory',    icon: Search,          external: true },
    { name: 'Events',           path: '/events',       icon: Calendar,        external: true },
  ],
  alumni: [
    { name: 'Dashboard',          path: '',            icon: LayoutDashboard },
    { name: 'Post a Job',         path: '/jobs',       icon: Briefcase,       external: true },
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
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-r border-gray-200/50 dark:border-white/10 transform transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 md:static flex flex-col shadow-2xl shadow-blue-900/5 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex-1 flex flex-col h-full overflow-hidden">

          {/* Logo */}
          <div className="h-20 flex items-center px-6 border-b border-gray-200/50 dark:border-white/5">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                <span className="text-white font-black text-lg">H</span>
              </div>
              <div className="min-w-0">
                <p className="text-base font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight leading-tight">
                  HKBK Connect
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium truncate">{portalLabel}</p>
              </div>
            </div>
            <button 
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors" 
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

                return item.external ? (
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
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />}
                    <Icon className={`mr-3 h-5 w-5 relative z-10 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`} />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                ) : (
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
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600" />}
                    <Icon className={`mr-3 h-5 w-5 relative z-10 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400'}`} />
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User Dropdown */}
            <div className="mx-4 mt-6 relative">
              <button 
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <ProfileAvatar 
                    userId={userProfile?.id}
                    url={avatarUrl}
                    name={userProfile?.full_name}
                    size="md"
                    editable={false}
                  />
                  <div className="text-left min-w-0">
                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{userProfile?.full_name || 'User'}</p>
                    <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 capitalize truncate">{role}</p>
                  </div>
                </div>
                <div className={`text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
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

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-0 overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-500/5 dark:bg-blue-600/10 rounded-full filter blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-500/5 dark:bg-purple-600/10 rounded-full filter blur-[140px] translate-x-1/3 translate-y-1/3 pointer-events-none" />

        {/* Mobile header */}
        <div className="md:hidden h-16 flex items-center px-4 border-b border-gray-200/50 dark:border-white/5 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md relative z-20">
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
