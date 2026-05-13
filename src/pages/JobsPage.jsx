import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Briefcase, MapPin, Building2, ExternalLink, Loader2, Clock, AlertCircle, Search, Filter } from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../hooks/useJobs';

export default function JobsPage() {
  const { jobs, loading, setJobs } = useJobs({ status: 'approved' });
  const [userProfile, setUserProfile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({ title: '', company: '', location: '', description: '', link: '', job_type: 'Full-time' });
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data } = await supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
        setUserProfile(data);
      }
    }
    fetchUser();
  }, []);

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!userProfile) return;
    
    // Safety check
    if (userProfile.role !== 'alumni' || !userProfile.is_approved) {
      toast.error('Your alumni account is not approved yet');
      return;
    }
    
    setIsSubmitting(true);
    // Explicitly override status to 'approved' so it appears instantly for users
    const { error } = await supabase
      .from('jobs')
      .insert([{ 
        ...newJob, 
        posted_by: userProfile.id,
        status: 'approved'
      }]);
    
    setIsSubmitting(false);
    if (!error) {
      setIsPosting(false);
      setNewJob({ title: '', company: '', location: '', description: '', link: '', job_type: 'Full-time' });
      toast.success('Job posted successfully and is now visible!');
    } else {
      toast.error('Error posting job: ' + error.message);
    }
  };

  const handleContactPoster = (job) => {
    if (!userProfile) {
      navigate('/login');
      return;
    }
    if (job.posted_by === userProfile.id) {
      toast.error("You posted this job.");
      return;
    }
    navigate('/dashboard/messages', { state: { contactId: job.posted_by } });
  };

  const canPostJob = userProfile?.role === 'alumni' && userProfile?.is_approved === true;
  const isUnapprovedAlumni = userProfile?.role === 'alumni' && userProfile?.is_approved === false;

  const calculateDaysAgo = (dateString) => {
    const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    return days === 0 ? 'Today' : days === 1 ? '1 day ago' : `${days} days ago`;
  };
  
  const calculateDaysLeft = (dateString) => {
    const expiryDate = new Date(dateString);
    expiryDate.setDate(expiryDate.getDate() + 30);
    const daysLeft = Math.ceil((expiryDate - new Date()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  // Sort and filter jobs locally
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) || job.company.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLocation = locationFilter === '' || job.location.toLowerCase().includes(locationFilter.toLowerCase());
    // Since we didn't always have job_type, we default to showing it or mapping 'All'
    const matchesType = typeFilter === 'All' || (job.job_type === typeFilter);
    return matchesSearch && matchesLocation && matchesType;
  }).sort((a, b) => {
    // Top match logic based on course
    if (!userProfile) return 0;
    const aCourse = a.profiles?.course_name;
    const bCourse = b.profiles?.course_name;
    const userCourse = userProfile.course_name;
    
    if (aCourse === userCourse && bCourse !== userCourse) return -1;
    if (bCourse === userCourse && aCourse !== userCourse) return 1;
    return 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Job Board</h1>
          <p className="text-gray-500 dark:text-gray-400">Exclusive opportunities from our alumni network.</p>
        </div>
        {canPostJob && (
          <button 
            onClick={() => setIsPosting(!isPosting)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-blue-500/30 flex-shrink-0"
          >
            {isPosting ? 'Cancel' : 'Post a Job'}
          </button>
        )}
      </div>

      {isUnapprovedAlumni && (
        <div className="bg-yellow-50/50 backdrop-blur-sm border border-yellow-200/50 p-4 mb-8 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <p className="text-sm text-yellow-800">
            <strong>Notice:</strong> Your account is under review. You can post jobs once an administrator approves your alumni status.
          </p>
        </div>
      )}

      {/* Filters Section */}
      <div className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-md border border-gray-200 dark:border-slate-800 p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search roles or companies..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="relative w-full md:w-64">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder="Filter by location..." 
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
        <div className="relative w-full md:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select 
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
          >
            <option value="All">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
        </div>
      </div>

      {isPosting && canPostJob && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-xl font-bold mb-4">Post a New Job</h2>
          <form onSubmit={handlePostJob} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Title</label>
                <input required type="text" value={newJob.title} onChange={(e) => setNewJob({...newJob, title: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Company</label>
                <input required type="text" value={newJob.company} onChange={(e) => setNewJob({...newJob, company: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <input required type="text" value={newJob.location} onChange={(e) => setNewJob({...newJob, location: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Job Type</label>
                <select required value={newJob.job_type || 'Full-time'} onChange={(e) => setNewJob({...newJob, job_type: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all appearance-none">
                  <option value="Full-time">Full-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Application Link (Optional)</label>
                <input type="url" value={newJob.link} onChange={(e) => setNewJob({...newJob, link: e.target.value})} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" placeholder="https://" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea required value={newJob.description} onChange={(e) => setNewJob({...newJob, description: e.target.value})} rows={4} className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSubmitting ? 'Posting...' : 'Post Job'}
            </button>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-6 w-1/3 rounded-lg" />
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24 rounded-lg" />
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg" />
              </div>
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs?.map((job) => {
            const daysLeft = calculateDaysLeft(job.created_at);
            const isMatch = userProfile && userProfile.course_name && job.profiles?.course_name === userProfile.course_name;
            
            return (
              <div key={job.id} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 flex flex-col md:flex-row gap-6 group relative overflow-hidden">
                {isMatch && (
                  <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-1 rounded-full border border-indigo-200 shadow-sm z-10">
                    Top Match
                  </div>
                )}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700 ease-out" />
                
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm border ${isMatch ? 'from-indigo-50 to-blue-50 border-indigo-200 dark:from-indigo-900/40 dark:to-blue-900/40' : 'from-gray-100 to-gray-200 border-white/20 dark:from-slate-800 dark:to-slate-700'}`}>
                  <Building2 className={`w-7 h-7 ${isMatch ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pr-16">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-indigo-600 transition-all truncate">{job.title}</h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400">{job.job_type || 'Full-time'}</span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${daysLeft > 5 ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                        {daysLeft} days left
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-2">
                    <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-gray-400" /> <span className="font-medium text-gray-700 dark:text-gray-300">{job.company}</span></span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-gray-400" /> {job.location}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-400" /> Posted {calculateDaysAgo(job.created_at)}</span>
                  </div>
                  
                  {job.profiles?.course_name && (
                    <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-4 bg-indigo-50 dark:bg-indigo-900/20 inline-block px-2.5 py-1 rounded-md">
                      Posted by {job.profiles.full_name} ({job.profiles.course_name} Alumni)
                    </div>
                  )}
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mt-2">{job.description}</p>
                </div>

                <div className="flex-shrink-0 flex md:flex-col justify-end md:justify-center items-end gap-3 mt-4 md:mt-0">
                  {job.link ? (
                    <a href={job.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:opacity-90 hover:scale-105 transition-all shadow-md w-full md:w-auto">
                      Apply <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button onClick={() => handleContactPoster(job)} className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-blue-500/25 w-full md:w-auto">
                      Contact Poster
                    </button>
                  )}
                </div>
              </div>
            );
          })}
          {filteredJobs.length === 0 && (
            <EmptyState 
              icon={Briefcase}
              title="No jobs found"
              description="No job postings match your current filters. Please try adjusting your search criteria."
              action={canPostJob ? (
                <button 
                  onClick={() => setIsPosting(true)}
                  className="bg-blue-600 dark:bg-blue-500 text-white px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity mt-4"
                >
                  Post a Job
                </button>
              ) : null}
            />
          )}
        </div>
      )}
    </div>
  );
}
