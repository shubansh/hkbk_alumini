import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Briefcase, MapPin, Building2, ExternalLink, Loader2, Clock, Search, Filter, Bookmark, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';

export default function InternshipsPage() {
  const { session, userProfile } = useAuth();
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modeFilter, setModeFilter] = useState('All');

  const isAlumniOrAdmin = userProfile?.role === 'alumni' || userProfile?.role === 'admin';

  useEffect(() => {
    fetchInternships();
  }, []);

  const fetchInternships = async () => {
    try {
      const { data, error } = await supabase
        .from('internships')
        .select(`*, posted_by (full_name, avatar_url)`)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInternships(data || []);
    } catch (error) {
      console.error('Error fetching internships:', error);
      toast.error('Failed to load internships');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (internshipId) => {
    if (userProfile?.role !== 'student') {
      toast.error('Only students can apply to internships.');
      return;
    }

    try {
      // In a real app, this would open a modal to attach a resume.
      // For now, we will just create a pending application.
      const { error } = await supabase.from('internship_applications').insert({
        internship_id: internshipId,
        student_id: session.user.id,
        status: 'applied'
      });

      if (error) {
        if (error.code === '23505') toast.error('You have already applied to this internship.');
        else throw error;
      } else {
        toast.success('Application submitted successfully!');
      }
    } catch (error) {
      console.error('Error applying:', error);
      toast.error('Failed to submit application.');
    }
  };

  const filteredInternships = internships.filter(int => {
    const matchesSearch = int.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          int.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMode = modeFilter === 'All' || int.mode === modeFilter.toLowerCase();
    return matchesSearch && matchesMode;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-indigo-500" /> Internships
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Discover internship opportunities to kickstart your career.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search internships or companies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm text-gray-900 dark:text-white"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none text-sm text-gray-900 dark:text-white"
          >
            <option value="All">All Modes</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="on-site">On-Site</option>
          </select>
        </div>
      </div>

      {/* Listings */}
      {loading ? (
        <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>
      ) : filteredInternships.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-gray-100 dark:border-slate-700 shadow-sm">
          <Briefcase className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No internships found</h3>
          <p className="text-gray-500 dark:text-gray-400">Check back later for new opportunities.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredInternships.map((internship) => (
            <div key={internship.id} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow group flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 flex items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400 font-bold text-xl border border-indigo-100 dark:border-indigo-800/30">
                  {internship.company.charAt(0)}
                </div>
                <div className="flex gap-2">
                  <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-semibold capitalize">
                    {internship.mode}
                  </span>
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {internship.title}
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-gray-400" />
                {internship.company}
              </p>
              
              <div className="space-y-2 mb-6">
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                  {internship.location}
                </div>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="w-4 h-4 mr-2 text-gray-400" />
                  {internship.duration || 'Flexible duration'}
                </div>
                {internship.stipend && (
                  <div className="flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400">
                    <span className="w-4 h-4 mr-2 flex items-center justify-center">$</span>
                    {internship.stipend}
                  </div>
                )}
              </div>

              <div className="mt-auto pt-4 border-t border-gray-100 dark:border-slate-700 flex gap-2">
                {internship.application_link ? (
                  <a href={internship.application_link} target="_blank" rel="noopener noreferrer" className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors">
                    External Apply <ExternalLink className="w-4 h-4" />
                  </a>
                ) : (
                  <button onClick={() => handleApply(internship.id)} className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    Apply Now
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
