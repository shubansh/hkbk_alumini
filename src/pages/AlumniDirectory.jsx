import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, GraduationCap, Building2, MapPin, Users, AlertCircle, BookOpen, RefreshCw } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';

export default function AlumniDirectory() {
  const [alumni, setAlumni]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalCount, setTotalCount] = useState(0);

  const fetchAlumni = async () => {
    setLoading(true);
    setError(null);

    // Query uses OR logic on both fields to survive data inconsistency:
    // Some rows may have status='approved' but is_approved still false (or vice versa).
    // The RLS policy in schema_fix_v7.sql also uses OR, so they match.
    const { data, error: fetchError, count } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, status, is_approved, company, job_title, location, passout_year, graduation_year, course_name, bio', { count: 'exact' })
      .eq('role', 'alumni')
      .or('status.eq.approved,is_approved.eq.true')
      .order('full_name', { ascending: true });

    console.log('[AlumniDirectory] Query result:', { count: data?.length, error: fetchError });
    if (fetchError) console.error('[AlumniDirectory] Error:', fetchError);

    if (fetchError) {
      setError(`Failed to load alumni: ${fetchError.message}`);
      setLoading(false);
      return;
    }

    setAlumni(data ?? []);
    setTotalCount(data?.length ?? 0);
    setLoading(false);
  };

  useEffect(() => {
    fetchAlumni();

    // Realtime: when any profile is updated (e.g. admin approves), refresh
    const channel = supabase
      .channel('alumni-directory-realtime')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: 'role=eq.alumni' },
        (payload) => {
          console.log('[AlumniDirectory] Realtime update:', payload);
          fetchAlumni(); // re-fetch to apply updated RLS
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  const filteredAlumni = alumni.filter(a => {
    const term = searchTerm.toLowerCase();
    return (
      a.full_name?.toLowerCase().includes(term)   ||
      a.company?.toLowerCase().includes(term)     ||
      a.job_title?.toLowerCase().includes(term)   ||
      a.course_name?.toLowerCase().includes(term) ||
      a.location?.toLowerCase().includes(term)
    );
  });

  // ─── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <div className="h-9 w-64 bg-gray-200 dark:bg-slate-700 rounded-lg animate-pulse mb-2" />
        <div className="h-5 w-80 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl p-6 animate-pulse">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-slate-700 shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-5 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
                <div className="h-4 bg-gray-100 dark:bg-slate-700/60 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2 mt-4">
              <div className="h-4 bg-gray-100 dark:bg-slate-700/60 rounded w-full" />
              <div className="h-4 bg-gray-100 dark:bg-slate-700/60 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Error state ───────────────────────────────────────────────────────────
  if (error) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl p-8 text-center max-w-lg mx-auto">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-red-800 dark:text-red-400 mb-2">Failed to Load Directory</h3>
        <p className="text-sm text-red-600 dark:text-red-500 mb-6">{error}</p>
        <button
          onClick={fetchAlumni}
          className="flex items-center gap-2 mx-auto px-5 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">Alumni Directory</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Connect with HKBK CE Connect graduates.
            {totalCount > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/40">
                {totalCount} {totalCount === 1 ? 'alumni' : 'alumni'} registered
              </span>
            )}
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-96 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search by name, company, course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-slate-600 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition-all shadow-sm hover:shadow-md"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlumni?.map((person) => (
          <div
            key={person?.id}
            className="group bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-[2.5rem] p-8 hover:border-blue-500/50 hover:shadow-2xl hover:shadow-blue-500/5 hover:-translate-y-1 transition-all duration-500 backdrop-blur-sm"
          >
            {/* Avatar + Name */}
            <div className="flex items-start gap-5 mb-6">
              <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center shrink-0 overflow-hidden border border-blue-100/50 dark:border-white/5 transition-transform group-hover:scale-105">
                {person?.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={person.full_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={e => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`${person?.avatar_url ? 'hidden' : 'flex'} w-full h-full items-center justify-center`}>
                   <span className="text-3xl font-black text-blue-600 dark:text-blue-400 uppercase">
                    {person?.full_name?.charAt(0) || '?'}
                  </span>
                </div>
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                  {person?.full_name || 'Alumni Member'}
                </h3>
                <p className="text-sm font-black text-blue-600 dark:text-blue-400 mt-1 uppercase tracking-widest">
                  {person?.passout_year ? `Batch ${person.passout_year}` : person?.graduation_year ? `Class of ${person.graduation_year}` : 'Alumni'}
                </p>
                {person?.course_name && (
                   <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 dark:bg-slate-800 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <BookOpen className="w-3 h-3" /> {person.course_name}
                  </div>
                )}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3 pt-6 border-t border-gray-50 dark:border-slate-800/50">
              {(person?.job_title || person?.company) && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span className="truncate">
                    {person.job_title} {person.job_title && person.company ? '@' : ''} {person.company}
                  </span>
                </div>
              )}
              {person?.location && (
                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span className="truncate">{person.location}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filteredAlumni.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mb-4">
              <Users className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">
              {searchTerm ? 'No results found' : 'No alumni yet'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm text-sm">
              {searchTerm
                ? `No alumni match "${searchTerm}". Try a different search term.`
                : 'Approved alumni will appear here once verified by an admin.'}
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="mt-4 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
