import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Briefcase, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminInternships() {
  const [internships, setInternships] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInternships = async () => {
    const { data, error } = await supabase
      .from('internships')
      .select('*, posted_by(full_name)')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setInternships(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInternships();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('internships')
        .update({ status: newStatus })
        .eq('id', id);
      
      if (error) throw error;
      toast.success(`Internship ${newStatus} successfully.`);
      fetchInternships();
    } catch (error) {
      toast.error(`Failed to update internship: ${error.message}`);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Internship Approvals</h1>
      
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Role</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Company</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Posted By</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm">Status</th>
                <th className="p-4 font-medium text-gray-500 dark:text-gray-400 text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {internships?.map((internship) => (
                <tr key={internship.id} className="border-b border-gray-200 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <div className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-indigo-500" />
                      {internship.title}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 dark:text-gray-300">{internship.company}</td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400">{internship.posted_by?.full_name}</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      internship.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      internship.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                      'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                    }`}>
                      {internship.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {internship.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleUpdateStatus(internship.id, 'approved')}
                          className="p-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 transition-colors"
                          title="Approve"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button 
                          onClick={() => handleUpdateStatus(internship.id, 'rejected')}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
                          title="Reject"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {internships.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    No internships found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
