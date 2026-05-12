import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, GraduationCap, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminAlumniApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'alumni')
      .eq('is_approved', false)
      .order('created_at', { ascending: false });

    console.log('[AdminAlumniApproval] Pending alumni data:', data);
    if (error) {
      console.error('[AdminAlumniApproval] Fetch error:', error);
      setError(`Failed to load requests: ${error.message}`);
    } else {
      setRequests(data ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRequests();

    const subscription = supabase
      .channel('public:profiles:alumni_requests')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles', filter: 'role=eq.alumni' }, fetchRequests)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const handleUpdateStatus = async (userId, approve) => {
    if (!approve) {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) {
        console.error('[AdminAlumniApproval] Reject error:', error);
        toast.error('Failed to reject: ' + error.message);
      } else {
        toast.success('Alumni request rejected');
        fetchRequests();
      }
      return;
    }

    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: true, status: 'approved' })
      .eq('id', userId);

    if (error) {
      console.error('[AdminAlumniApproval] Approve error:', error);
      toast.error('Failed to approve: ' + error.message);
    } else {
      toast.success('Alumni approved successfully!');
      fetchRequests();
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
      <p className="text-red-700 dark:text-red-400 font-medium">{error}</p>
      <button onClick={fetchRequests} className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">
        Retry
      </button>
    </div>
  );


  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-600" />
            Pending Alumni Approvals
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Review and approve accounts requesting alumni status.</p>
        </div>
        <div className="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-4 py-2 rounded-lg font-medium text-sm border border-blue-100 dark:border-blue-800">
          {requests.length} Pending
        </div>
      </div>
      
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <th className="p-4 font-semibold text-gray-900 dark:text-white text-sm">Applicant Details</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white text-sm">Date Applied</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests?.map((user) => (
                <tr key={user.id} className="border-b border-gray-200 dark:border-slate-700 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                  <td className="p-4">
                    <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {user.full_name} <GraduationCap className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </td>
                  <td className="p-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleUpdateStatus(user.id, true)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-green-500 text-white hover:bg-green-600 transition-colors text-sm font-medium shadow-sm"
                      >
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button 
                        onClick={() => handleUpdateStatus(user.id, false)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-colors text-sm font-medium"
                      >
                        <X className="w-4 h-4" /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {requests.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-12 text-center">
                    <Check className="w-12 h-12 text-green-500 mx-auto mb-3 opacity-50" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
                    <p className="text-gray-500 dark:text-gray-400">There are no pending alumni requests to review.</p>
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
