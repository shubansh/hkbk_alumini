import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, Loader2, Mail, CheckCircle, Trash2, Clock, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminContactMessages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contact messages:', error);
      toast.error('Failed to load messages');
    } else {
      setMessages(data || []);
    }
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(`Message marked as ${status}`);
      setMessages(messages.map(m => m.id === id ? { ...m, status } : m));
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this message?')) return;
    
    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete message');
    } else {
      toast.success('Message deleted');
      setMessages(messages.filter(m => m.id !== id));
    }
  };

  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          msg.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || msg.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Support Messages</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage contact form submissions</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="ignored">Ignored</option>
        </select>
      </div>

      {/* Messages List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
          <Mail className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">No messages found</h3>
          <p className="text-gray-500">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredMessages.map((msg) => (
            <div key={msg.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6">
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{msg.subject}</h3>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
                    msg.status === 'resolved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                    msg.status === 'pending'  ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                    'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-gray-300'
                  }`}>
                    {msg.status.toUpperCase()}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="font-medium text-gray-900 dark:text-gray-300">{msg.name}</span>
                  <a href={`mailto:${msg.email}`} className="hover:text-blue-500 transition-colors">{msg.email}</a>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {new Date(msg.created_at).toLocaleDateString()}</span>
                </div>

                <div className="bg-gray-50 dark:bg-slate-900/50 p-4 rounded-xl text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words border border-gray-100 dark:border-slate-700/50">
                  {msg.message}
                </div>
              </div>

              <div className="flex flex-row md:flex-col gap-2 shrink-0 md:w-36">
                <a 
                  href={`mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject)}`}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  <Mail className="w-4 h-4" /> Reply
                </a>
                
                {msg.status !== 'resolved' && (
                  <button 
                    onClick={() => updateStatus(msg.id, 'resolved')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 dark:text-green-400 text-sm font-semibold rounded-xl transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" /> Resolve
                  </button>
                )}

                {msg.status !== 'ignored' && msg.status !== 'resolved' && (
                  <button 
                    onClick={() => updateStatus(msg.id, 'ignored')}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 hover:bg-gray-100 dark:bg-slate-700/50 dark:hover:bg-slate-700 dark:text-gray-300 text-sm font-semibold rounded-xl transition-colors"
                  >
                    <XCircle className="w-4 h-4" /> Ignore
                  </button>
                )}

                <button 
                  onClick={() => deleteMessage(msg.id)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 text-sm font-semibold rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
