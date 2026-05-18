import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { ErrorBoundary } from './components/ErrorBoundary';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout    from './layouts/PublicLayout';

// Public pages
import Home           from './pages/Home';
import Login          from './pages/Login';
import Signup         from './pages/Signup';
import AlumniDirectory from './pages/AlumniDirectory';
import JobsPage       from './pages/JobsPage';
import EventsPage     from './pages/EventsPage';
import ContactPage    from './pages/ContactPage';

// Dashboard pages
import StudentDashboard from './pages/student/StudentDashboard';
import AlumniDashboard  from './pages/alumni/AlumniDashboard';
import MentorshipPage   from './pages/MentorshipPage';
import MessagesPage     from './pages/MessagesPage';
import ProfileSettings  from './pages/ProfileSettings';

// Admin pages
import AdminDashboard     from './pages/admin/AdminDashboard';
import AdminUsers         from './pages/admin/AdminUsers';
import AdminAlumniApproval from './pages/admin/AdminAlumniApproval';
import AdminEvents        from './pages/admin/AdminEvents';
import AdminGallery       from './pages/admin/AdminGallery';
import AdminSettings      from './pages/admin/AdminSettings';
import AdminPosts         from './pages/admin/AdminPosts';
import AdminPeople        from './pages/admin/AdminPeople';
import AdminFaculty       from './pages/admin/AdminFaculty';
import AdminMessages      from './pages/admin/AdminMessages';
import AdminContactMessages from './pages/admin/AdminContactMessages';
import AdminSocialFeed  from './pages/admin/AdminSocialFeed';

// ─── Shared UI Pieces ──────────────────────────────────────────────────────

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950">
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
      <p className="text-blue-300 font-medium tracking-wide">Verifying session...</p>
    </div>
  </div>
);

const PendingApprovalPage = ({ onLogout }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 p-4">
    <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 text-center shadow-2xl">
      <div className="w-20 h-20 rounded-full bg-yellow-400/20 border-2 border-yellow-400/40 flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">⏳</span>
      </div>
      <h1 className="text-2xl font-extrabold text-white mb-3">Account Under Review</h1>
      <p className="text-blue-200 leading-relaxed mb-8">
        Your alumni account is being reviewed. Once an admin approves it, you'll get full access.
      </p>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 text-left space-y-3">
        <p className="text-xs text-blue-300 font-semibold uppercase tracking-wider">What happens next?</p>
        <p className="text-sm text-blue-200 flex items-center gap-2"><span className="text-green-400">✓</span> Profile saved</p>
        <p className="text-sm text-blue-200 flex items-center gap-2"><span className="text-yellow-400">⏳</span> Admin reviews your status</p>
        <p className="text-sm text-blue-200 flex items-center gap-2"><span className="text-blue-400">🔓</span> Full access on approval</p>
      </div>
      <button
        onClick={onLogout}
        className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold transition-all"
      >
        Sign Out
      </button>
    </div>
  </div>
);

const AccountErrorPage = ({ onLogout, onRetry }) => {
  const [retrying, setRetrying] = useState(false);
  
  const handleRetry = async () => {
    setRetrying(true);
    await onRetry();
    setRetrying(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 p-4">
      <div className="max-w-sm w-full bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Account Recovery</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          Your account role could not be determined. This might be a temporary network issue or a missing profile.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={handleRetry}
            disabled={retrying}
            className="w-full px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            {retrying ? 'Retrying...' : 'Retry Connection'}
          </button>
          <a
            href="/"
            className="w-full px-6 py-3 rounded-xl bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 font-semibold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            Return Home
          </a>
          <button
            onClick={onLogout}
            className="w-full px-6 py-3 rounded-xl text-red-600 dark:text-red-400 font-semibold hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
          >
            Sign Out Completely
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const {
    session, userRole, loading,
    isAdmin, isStudent, isApprovedAlumni, isPendingAlumni,
    handleLogout, refetchProfile,
  } = useAuth();

  // ─── Route Guards ──────────────────────────────────────────────────────
  /** Protects dashboard from missing roles */
  const DashboardGuard = () => {
    if (loading) return <FullScreenLoader />;
    if (!session) return <Navigate to="/login" replace />;
    
    // Only show recovery screen if loading is strictly finished, 
    // session exists, and we completely exhausted retries.
    if (!userRole && !loading) {
      return <AccountErrorPage onLogout={handleLogout} onRetry={refetchProfile} />;
    }
    
    return <Outlet />;
  };

  /** Redirects logged-out users to /login */
  const ProtectedRoute = ({ children }) => {
    if (loading)        return <FullScreenLoader />;
    if (!session)       return <Navigate to="/login" replace />;
    if (isPendingAlumni) return <PendingApprovalPage onLogout={handleLogout} />;
    return children;
  };

  /** Admin-only routes */
  const AdminRoute = ({ children }) => {
    if (loading)           return <FullScreenLoader />;
    if (!session)          return <Navigate to="/login" replace />;
    if (!isAdmin)          return <Navigate to="/dashboard" replace />;
    return children;
  };

  /** Redirects logged-in users away from public-only pages */
  const PublicRoute = ({ children }) => {
    if (loading) return <FullScreenLoader />;
    if (session) {
      if (isAdmin)          return <Navigate to="/dashboard/admin" replace />;
      if (isPendingAlumni)  return <PendingApprovalPage onLogout={handleLogout} />;
      if (isApprovedAlumni) return <Navigate to="/dashboard/alumni" replace />;
      if (isStudent)        return <Navigate to="/dashboard/student" replace />;
    }
    return children;
  };

  /** Smart home page — shows landing for guests, redirects for logged-in users */
  const HomeRoute = () => {
    if (loading) return <FullScreenLoader />;
    if (session) {
      if (isAdmin)          return <Navigate to="/dashboard/admin" replace />;
      if (isPendingAlumni)  return <PendingApprovalPage onLogout={handleLogout} />;
      if (isApprovedAlumni) return <Navigate to="/dashboard/alumni" replace />;
      if (isStudent)        return <Navigate to="/dashboard/student" replace />;
    }
    return <Home />;
  };

  /** /dashboard index — redirect to the correct role-specific sub-path */
  const DashboardIndex = () => {
    if (loading) return <FullScreenLoader />;
    console.log(`[Route] DashboardIndex role:${userRole}`);

    if (isAdmin)          return <Navigate to="/dashboard/admin"    replace />;
    if (isApprovedAlumni) return <Navigate to="/dashboard/alumni"   replace />;
    if (isStudent)        return <Navigate to="/dashboard/student"  replace />;
    if (isPendingAlumni)  return <PendingApprovalPage onLogout={handleLogout} />;

    return <AccountErrorPage onLogout={handleLogout} onRetry={refetchProfile} />;
  };

  return (
    <ErrorBoundary>
      <Router>
        <Routes>

          {/* ── Public routes ────────────────────────────────────── */}
          <Route element={<PublicLayout />}>
            <Route path="/"          element={<HomeRoute />} />
            <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup"    element={<PublicRoute><Signup /></PublicRoute>} />
            <Route path="/directory" element={<AlumniDirectory />} />
            <Route path="/jobs"      element={<JobsPage />} />
            <Route path="/events"    element={<EventsPage />} />
            <Route path="/mentorship" element={<MentorshipPage />} />
            <Route path="/contact"    element={<ContactPage />} />
          </Route>

          {/* ── Legacy Admin Redirect ───────────────────────────────── */}
          <Route path="/admin" element={<Navigate to="/dashboard/admin" replace />} />

          {/* ── User Dashboard routes ─────────────────────────────── */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout role={userRole} basePath={userRole === 'admin' ? '/dashboard/admin' : '/dashboard'} />
            </ProtectedRoute>
          }>
            <Route index           element={<DashboardIndex />} />
            <Route path="student"  element={<StudentDashboard />} />
            <Route path="alumni"   element={<AlumniDashboard />} />
            <Route path="mentorship" element={<MentorshipPage />} />
            <Route path="messages"   element={<MessagesPage />} />
            <Route path="settings"   element={<ProfileSettings />} />
            
            {/* ── Admin Sub-routes ───────────────────────────────── */}
            <Route path="admin" element={
              <AdminRoute>
                <Outlet />
              </AdminRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users"           element={<AdminUsers />} />
              <Route path="people"          element={<AdminPeople />} />
              <Route path="faculty"         element={<AdminFaculty />} />
              <Route path="alumni-approval" element={<AdminAlumniApproval />} />
              <Route path="events"          element={<AdminEvents />} />
              <Route path="gallery"         element={<AdminGallery />} />
              <Route path="settings"        element={<AdminSettings />} />
              <Route path="posts"           element={<AdminPosts />} />
              <Route path="mentorship"      element={<MentorshipPage />} />
              <Route path="messages"        element={<AdminMessages />} />
              <Route path="contact-messages" element={<AdminContactMessages />} />
              <Route path="social-feed"     element={<AdminSocialFeed />} />
            </Route>
          </Route>

        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
