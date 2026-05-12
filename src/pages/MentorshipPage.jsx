import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Search, GraduationCap, HeartHandshake } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function MentorshipPage() {
  const [role, setRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setCurrentUser(session?.user || null);

        let userRole = 'student';
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          setCurrentUserProfile(profile);
          userRole = profile?.role || 'student';
          setRole(userRole);
        }

        if (userRole === 'student') {
          // Fetch approved alumni
          const { data: mentors, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'alumni')
            .eq('is_approved', true);
            
          if (!error && mentors) setData(mentors);
        } else if (userRole === 'alumni' && session?.user) {
          // Fetch mentorship requests
          const { data: requests, error } = await supabase
            .from('mentorship_requests')
            .select('student_id')
            .eq('alumni_id', session.user.id);
            
          if (!error && requests) {
            const senderIds = [...new Set(requests.map(r => r.student_id))];
            if (senderIds.length > 0) {
              const { data: students } = await supabase
                .from('profiles')
                .select('*')
                .in('id', senderIds);
              setData(students || []);
            } else {
              setData([]);
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleRequestMentorship = async (mentorId) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please login to request mentorship');
        navigate('/login');
        return;
      }
      
      // Insert a mentorship request to unlock RLS visibility
      await supabase.from('mentorship_requests').insert({
        student_id: session.user.id,
        alumni_id: mentorId,
        status: 'pending'
      });
      
      toast.success('Request sent! Redirecting to chat...', { icon: '💬' });
      navigate('/dashboard/messages', { state: { contactId: mentorId } });
    } catch (error) {
      toast.error('Failed to send request. You may have already requested this mentor.');
    }
  };

  const filteredData = data
    .filter(item => 
      item.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.course_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Prioritize mentors/mentees from the exact same course
      if (a.course_name === currentUserProfile?.course_name && b.course_name !== currentUserProfile?.course_name) return -1;
      if (b.course_name === currentUserProfile?.course_name && a.course_name !== currentUserProfile?.course_name) return 1;
      // Then prioritize same category
      if (a.course_category === currentUserProfile?.course_category && b.course_category !== currentUserProfile?.course_category) return -1;
      if (b.course_category === currentUserProfile?.course_category && a.course_category !== currentUserProfile?.course_category) return 1;
      return 0;
    });

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">
            {role === 'alumni' ? 'Mentorship Requests' : 'Find a Mentor'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {role === 'alumni' 
              ? 'Students seeking your guidance.' 
              : 'Connect with approved alumni for career guidance. Recommended mentors from your course are prioritized.'}
          </p>
        </div>
        
        {role === 'student' && (
          <div className="relative w-full md:w-80 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-transform group-focus-within:scale-110">
              <Search className="h-5 w-5 text-gray-500 dark:text-gray-400 group-focus-within:text-blue-600" />
            </div>
            <input
              type="text"
              placeholder="Search by name, company, course..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
            />
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-3xl p-6 flex flex-col items-center text-center">
              <Skeleton className="w-24 h-24 rounded-full mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-6" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredData?.map((user) => {
            const isMatch = user.course_name === currentUserProfile?.course_name;
            return (
            <div key={user.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-3xl p-6 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center relative group">
              {isMatch && (
                <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full border border-indigo-200 shadow-sm">
                  Top Match
                </div>
              )}
              <div className={`w-24 h-24 rounded-full bg-gradient-to-br flex items-center justify-center text-blue-500 mb-4 overflow-hidden border transition-transform group-hover:scale-105 ${isMatch ? 'from-indigo-50 to-blue-50 border-indigo-200' : 'from-gray-50 to-slate-50 border-gray-100 dark:border-white/5 dark:from-slate-800 dark:to-slate-700'}`}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <GraduationCap className={`w-10 h-10 ${isMatch ? 'text-indigo-500' : 'text-gray-400'}`} />
                )}
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.full_name}</h3>
              {user.course_name && <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1">{user.course_name}</p>}
              
              {role === 'student' ? (
                <p className="text-xs text-gray-500 font-medium mt-1 mb-4">{user.company ? `${user.job_title || 'Professional'} at ${user.company}` : `Alumni Batch ${user.passout_year || ''}`}</p>
              ) : (
                <p className="text-xs text-gray-500 font-medium mt-1 mb-4">Student - {user.year_of_study || 'Unknown Year'}</p>
              )}
              
              <button 
                onClick={() => role === 'student' ? handleRequestMentorship(user.id) : navigate('/dashboard/messages', { state: { contactId: user.id } })}
                className={`mt-auto w-full font-semibold py-2.5 rounded-xl transition-all duration-300 ${
                  role === 'student' 
                    ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white'
                    : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white'
                }`}
              >
                {role === 'student' ? 'Request Mentorship' : 'Message Student'}
              </button>
            </div>
            );
          })}
          {filteredData.length === 0 && (
            <div className="col-span-full">
              <EmptyState 
                icon={role === 'alumni' ? HeartHandshake : Users}
                title={role === 'alumni' ? "No requests yet" : "No mentors found"}
                description={role === 'alumni' ? "You don't have any pending mentorship requests from students right now." : "There are currently no approved alumni available for mentorship."}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
