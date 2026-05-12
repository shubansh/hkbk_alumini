import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Briefcase } from 'lucide-react';

export default function AdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = async () => {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, profiles(full_name)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setJobs(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleUpdateStatus = async (jobId, newStatus) => {
    const { error } = await supabase
      .from('jobs')
      .update({ status: newStatus })
      .eq('id', jobId);
    
    if (!error) {
      fetchJobs();
    }
  };

  if (loading) return <div>Loading jobs...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Job Approvals</h1>
      
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-700">
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Job Title</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Company</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Posted By</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs?.map((job) => (
                <tr key={job.id} className="border-b border-gray-200 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:bg-slate-700/50">
                  <td className="p-4">
                    <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      {job.title}
                    </div>
                  </td>
                  <td className="p-4 text-gray-900 dark:text-white">{job.company}</td>
                  <td className="p-4 text-gray-500 dark:text-gray-400">{job.profiles?.full_name}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      job.status === 'rejected' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {job.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-4">
                    {job.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(job.id, 'approved')}
                          className="p-1 rounded bg-green-500/10 text-green-500 hover:bg-green-500/20"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(job.id, 'rejected')}
                          className="p-1 rounded bg-red-500/10 text-red-500 hover:bg-red-500/20"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-gray-500 dark:text-gray-400">No jobs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
