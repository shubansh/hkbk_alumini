import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Check, X, Shield, GraduationCap, User, Trash2, Ban } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();

    // Supabase Realtime subscription
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchUsers)
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  const handleUpdateRole = async (userId, newRole) => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (!error) {
      toast.success(`Role updated to ${newRole}`);
    } else {
      toast.error('Failed to update role');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;

    // Delete from profiles (auth.users might need edge function to delete fully, 
    // but deleting profile blocks them from app)
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userId);
    
    if (!error) {
      toast.success('User deleted successfully');
    } else {
      toast.error(error.message);
    }
  };

  const handleBlockUser = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'blocked' ? 'approved' : 'blocked';
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('id', userId);
    
    if (!error) {
      toast.success(`User has been ${newStatus}`);
    } else {
      toast.error('Failed to update user status');
    }
  };

  if (loading) return <div>Loading users...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold">User Management</h1>
      </div>
      
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                <th className="p-4 font-semibold text-gray-900 dark:text-white text-sm">User Details</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white text-sm">Role</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white text-sm">Status</th>
                <th className="p-4 font-semibold text-gray-900 dark:text-white text-sm text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users?.map((user) => (
                <tr key={user.id} className={`border-b border-gray-200 dark:border-slate-700 last:border-0 transition-colors ${user.status === 'blocked' ? 'bg-red-50/50 dark:bg-red-900/10' : 'hover:bg-gray-50 dark:hover:bg-slate-700/30'}`}>
                  <td className="p-4">
                    <div className="font-medium text-gray-900 dark:text-white">{user.full_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      {user.role === 'admin' && <Shield className="w-4 h-4 text-purple-500" />}
                      {user.role === 'alumni' && <GraduationCap className="w-4 h-4 text-blue-500" />}
                      {user.role === 'student' && <User className="w-4 h-4 text-green-500" />}
                      <select 
                        value={user.role} 
                        onChange={(e) => handleUpdateRole(user.id, e.target.value)}
                        className="bg-transparent border border-gray-200 dark:border-slate-600 rounded p-1 text-sm focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="student">Student</option>
                        <option value="alumni">Alumni</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.status === 'approved' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' :
                      user.status === 'rejected' || user.status === 'blocked' ? 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800'
                    }`}>
                      {user.status || 'pending'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => handleBlockUser(user.id, user.status)}
                        className={`p-2 rounded-md transition-colors ${user.status === 'blocked' ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30' : 'text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/30'}`}
                        title={user.status === 'blocked' ? "Unblock User" : "Block User"}
                      >
                        {user.status === 'blocked' ? <Check className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No users found.
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
