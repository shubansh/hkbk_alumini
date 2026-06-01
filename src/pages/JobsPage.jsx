import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Briefcase, MapPin, Building2, ExternalLink, Loader2,
  Clock, AlertCircle, Search, Filter, Tag, DollarSign, MessageCircle
} from 'lucide-react';
import { Skeleton } from '../components/Skeleton';
import { EmptyState } from '../components/EmptyState';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useJobs } from '../hooks/useJobs';
import { useAuth } from '../contexts/AuthContext';

const JOB_TYPES = ['Full-time', 'Internship', 'Contract', 'Part-time'];

export default function JobsPage() {
  const { session } = useAuth();
  const { jobs, loading } = useJobs({ status: 'approved' });
  const [userProfile, setUserProfile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newJob, setNewJob] = useState({
    title: '',
    company: '',
    location: '',
    description: '',
    link: '',
    job_type: 'Full-time',
    salary: '',
    skills: '',
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  const navigate = useNavigate();

  useEffect(() => {
    async function fetchUser() {
      if (session) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();
        setUserProfile(data);
      }
    }
    fetchUser();
  }, [session]);

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!userProfile) return;

    if (userProfile.role !== 'alumni' || !userProfile.is_approved) {
      toast.error('Your alumni account is not approved yet');
      return;
    }

    if (!newJob.title.trim() || !newJob.company.trim()) {
      toast.error('Title and Company are required.');
      return;
    }

    if (newJob.link && !newJob.link.startsWith('http')) {
      toast.error('Application link must start with http:// or https://');
      return;
    }

    setIsSubmitting(true);

    // Build insert payload — only include columns that actually exist.
    // The migration script adds job_type, salary, skills, application_link.
    // If the migration hasn't been run yet, we skip those columns gracefully.
    const insertPayload = {
      title: newJob.title.trim(),
      company: newJob.company.trim(),
      location: newJob.location.trim(),
      description: newJob.description.trim(),
      posted_by: userProfile.id,
      status: 'approved',       // Appear immediately
    };

    // Conditionally add new columns (migration-dependent)
    if (newJob.job_type)         insertPayload.job_type = newJob.job_type;
    if (newJob.salary?.trim())   insertPayload.salary = newJob.salary.trim();
    if (newJob.skills?.trim())   insertPayload.skills = newJob.skills.trim();
    if (newJob.link?.trim())   insertPayload.link = newJob.link.trim();

    const { error } = await supabase.from('jobs').insert([insertPayload]);

    setIsSubmitting(false);

    if (!error) {
      setIsPosting(false);
      setNewJob({ title: '', company: '', location: '', description: '', link: '', job_type: 'Full-time', salary: '', skills: '' });
      toast.success('Job posted successfully! It is now live.');
    } else {
      console.error('[JobsPage] Insert error:', error);
      // If the column doesn't exist yet, give actionable guidance
      if (error.message?.includes('column') && error.message?.includes('schema cache')) {
        toast.error('Database schema needs updating. Please run supabase_jobs_migration.sql in your Supabase SQL Editor first.');
      } else {
        toast.error('Error posting job: ' + error.message);
      }
    }
  };

  const handleContact = (job) => {
    if (!userProfile) { navigate('/login'); return; }
    if (job.posted_by === userProfile.id) { toast.error('You posted this job.'); return; }
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
    return Math.max(0, daysLeft);
  };

  // Client-side filtering
  const filteredJobs = jobs
    .filter(job => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = !term ||
        job.title?.toLowerCase().includes(term) ||
        job.company?.toLowerCase().includes(term) ||
        job.skills?.toLowerCase().includes(term);
      const matchesLocation = !locationFilter ||
        job.location?.toLowerCase().includes(locationFilter.toLowerCase());
      const matchesType = typeFilter === 'All' || job.job_type === typeFilter;
      return matchesSearch && matchesLocation && matchesType;
    })
    .sort((a, b) => {
      // Boost "Top Match" jobs to the top
      if (!userProfile?.course_name) return 0;
      const aMatch = a.profiles?.course_name === userProfile.course_name ? -1 : 0;
      const bMatch = b.profiles?.course_name === userProfile.course_name ? -1 : 0;
      return aMatch - bMatch;
    });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Jobs & Internships</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-sm md:text-base">
            Discover career opportunities and internships posted by our verified alumni network.
            {!loading && <span className="ml-2 text-blue-600 dark:text-blue-400 font-semibold">{jobs.length} open roles</span>}
          </p>
        </div>
        {canPostJob && (
          <button
            onClick={() => setIsPosting(!isPosting)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300 shadow-lg shadow-blue-500/30 flex-shrink-0"
          >
            {isPosting ? 'Cancel' : '+ Post an Opportunity'}
          </button>
        )}
      </div>

      {/* Unapproved alumni notice */}
      {isUnapprovedAlumni && (
        <div className="bg-yellow-50/80 border border-yellow-200 p-4 mb-8 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0" />
          <p className="text-sm text-yellow-800">
            <strong>Account Pending:</strong> You can post opportunities once an administrator approves your alumni status.
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border border-gray-200 dark:border-slate-800 p-4 rounded-2xl mb-8 flex flex-col md:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search roles, companies, or skills..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
        <div className="relative w-full md:w-56">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Filter by location..."
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
        <div className="relative w-full md:w-44">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none"
          >
            <option value="All">All Types</option>
            {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Post Job Form */}
      {isPosting && canPostJob && (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-2xl p-6 mb-8 shadow-xl">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
            <Briefcase className="w-5 h-5 text-blue-600" /> Post a New Opportunity
          </h2>
          <form onSubmit={handlePostJob} className="space-y-4">
            {/* Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Job Title <span className="text-red-500">*</span></label>
                <input
                  required type="text" value={newJob.title}
                  onChange={e => setNewJob({ ...newJob, title: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Company <span className="text-red-500">*</span></label>
                <input
                  required type="text" value={newJob.company}
                  onChange={e => setNewJob({ ...newJob, company: e.target.value })}
                  placeholder="e.g. Infosys"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            </div>
            {/* Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Location</label>
                <input
                  type="text" value={newJob.location}
                  onChange={e => setNewJob({ ...newJob, location: e.target.value })}
                  placeholder="e.g. Bengaluru / Remote"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Job Type</label>
                <select
                  value={newJob.job_type}
                  onChange={e => setNewJob({ ...newJob, job_type: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 transition-all text-sm appearance-none"
                >
                  {JOB_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Salary (optional)</label>
                <input
                  type="text" value={newJob.salary}
                  onChange={e => setNewJob({ ...newJob, salary: e.target.value })}
                  placeholder="e.g. ₹8-12 LPA"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            </div>
            {/* Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-1.5">Skills / Tags (optional)</label>
                <input
                  type="text" value={newJob.skills}
                  onChange={e => setNewJob({ ...newJob, skills: e.target.value })}
                  placeholder="e.g. React, Node.js, SQL (comma separated)"
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1.5">Application Link (optional)</label>
                <input
                  type="url" value={newJob.link}
                  onChange={e => setNewJob({ ...newJob, link: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                />
              </div>
            </div>
            {/* Description */}
            <div>
              <label className="block text-sm font-semibold mb-1.5">Job Description</label>
              <textarea
                required rows={4} value={newJob.description}
                onChange={e => setNewJob({ ...newJob, description: e.target.value })}
                placeholder="Describe the role, responsibilities, and requirements..."
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 focus:ring-2 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit" disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {isSubmitting ? 'Posting...' : 'Post Opportunity'}
              </button>
              <button type="button" onClick={() => setIsPosting(false)} className="px-6 py-2.5 rounded-xl font-semibold border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 transition-all text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 rounded-2xl p-6 flex flex-col md:flex-row gap-4">
              <div className="space-y-3 flex-1">
                <Skeleton className="h-6 w-1/3 rounded-lg" />
                <div className="flex gap-4"><Skeleton className="h-4 w-24 rounded-lg" /><Skeleton className="h-4 w-24 rounded-lg" /></div>
                <Skeleton className="h-4 w-full rounded-lg" />
              </div>
              <Skeleton className="h-10 w-32 rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const daysLeft = calculateDaysLeft(job.created_at);
            const isMatch = userProfile?.course_name && job.profiles?.course_name === userProfile.course_name;
            const applyUrl = job.application_link || job.link; // backward compat
            const skillTags = Array.isArray(job.skills) ? job.skills : (typeof job.skills === 'string' ? job.skills.split(',').map(s => s.trim()).filter(Boolean) : []);

            return (
              <div
                key={job.id}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/30 transition-all duration-300 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-0.5 flex flex-col md:flex-row gap-6 group relative overflow-hidden"
              >
                {isMatch && (
                  <div className="absolute top-4 right-4 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-700 z-10">
                    ⭐ Top Match
                  </div>
                )}
                <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-bl-full -z-10 group-hover:scale-150 transition-transform duration-700 ease-out" />

                {/* Company avatar */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-sm border ${isMatch ? 'from-indigo-50 to-blue-50 border-indigo-200 dark:from-indigo-900/40 dark:to-blue-900/40 dark:border-indigo-700' : 'from-gray-100 to-gray-200 border-gray-200/50 dark:from-slate-800 dark:to-slate-700 dark:border-slate-600'}`}>
                  <Building2 className={`w-7 h-7 ${isMatch ? 'text-indigo-500' : 'text-gray-400 dark:text-gray-500'}`} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2 pr-20">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {job.title}
                    </h3>
                    <div className="flex gap-2 flex-shrink-0">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30">
                        {job.job_type}
                      </span>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${daysLeft > 7 ? 'bg-green-50 text-green-600 dark:bg-green-500/10 dark:text-green-400' : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'}`}>
                        {daysLeft}d left
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mb-3">
                    <span className="flex items-center gap-1.5 font-medium text-gray-700 dark:text-gray-300">
                      <Building2 className="w-4 h-4 text-gray-400" /> {job.company}
                    </span>
                    {job.location && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" /> {job.location}
                      </span>
                    )}
                    {job.salary && (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                        <DollarSign className="w-4 h-4" /> {job.salary}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-gray-400" /> {calculateDaysAgo(job.created_at)}
                    </span>
                  </div>

                  {job.profiles?.full_name && (
                    <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mb-3 inline-flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-900/20 px-2.5 py-1 rounded-md">
                      Posted by {job.profiles.full_name}
                      {job.profiles.course_name && ` · ${job.profiles.course_name} Alumni`}
                    </p>
                  )}

                  {job.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed mb-3">
                      {job.description}
                    </p>
                  )}

                  {skillTags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {skillTags.map(skill => (
                        <span key={skill} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400">
                          <Tag className="w-3 h-3" /> {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex-shrink-0 flex md:flex-col justify-end md:justify-center items-stretch gap-2 mt-4 md:mt-0 min-w-[130px]">
                  {applyUrl ? (
                    <a
                      href={applyUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold hover:opacity-90 hover:scale-105 transition-all shadow-md text-sm"
                    >
                      Apply <ExternalLink className="w-4 h-4" />
                    </a>
                  ) : (
                    <button
                      onClick={() => handleContact(job)}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold hover:opacity-90 hover:-translate-y-0.5 transition-all shadow-lg shadow-blue-500/25 text-sm"
                    >
                      <MessageCircle className="w-4 h-4" /> Contact
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Empty state — only shown after loading completes */}
          {!loading && filteredJobs.length === 0 && (
            <EmptyState
              icon={Briefcase}
              title={searchTerm || locationFilter || typeFilter !== 'All' ? 'No matching opportunities' : 'No opportunities posted yet'}
              description={
                searchTerm || locationFilter || typeFilter !== 'All'
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Be the first to post a job or internship opportunity for the HKBK CE Connect community!'
              }
              action={canPostJob ? (
                <button
                  onClick={() => { setIsPosting(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors mt-4"
                >
                  Post an Opportunity
                </button>
              ) : null}
            />
          )}
        </div>
      )}
    </div>
  );
}
