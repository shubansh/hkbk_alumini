import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Send, User, MessageSquare, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function MessagesPage() {
  const [session, setSession] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUsers(session.user.id);
    });
  }, []);

  const fetchUsers = async (currentUserId) => {
    // 1. Fetch messages involving this user
    const { data: msgs } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_id.eq.${currentUserId},receiver_id.eq.${currentUserId}`)
      .order('created_at', { ascending: false });

    // 2. Fetch mentorship connections
    const { data: mentorships } = await supabase
      .from('mentorship_requests')
      .select('*')
      .or(`student_id.eq.${currentUserId},alumni_id.eq.${currentUserId}`);

    const interactedIds = new Set();

    msgs?.forEach(m => {
      if (m.sender_id   !== currentUserId) interactedIds.add(m.sender_id);
      if (m.receiver_id !== currentUserId) interactedIds.add(m.receiver_id);
    });

    mentorships?.forEach(m => {
      if (m.student_id !== currentUserId) interactedIds.add(m.student_id);
      if (m.alumni_id  !== currentUserId) interactedIds.add(m.alumni_id);
    });

    // Always include the contact passed via navigation state (Contact Poster flow)
    const passedContactId = location.state?.contactId;
    if (passedContactId && passedContactId !== currentUserId) {
      interactedIds.add(passedContactId);
    }

    if (interactedIds.size === 0) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, role, avatar_url')
      .in('id', Array.from(interactedIds))
      .neq('role', 'admin');

    if (profilesError) console.error('[Messages] Profile fetch error:', profilesError);

    if (profilesData) {
      const usersWithMsgs = profilesData.map(user => {
        const userMsgs = msgs?.filter(m => m.sender_id === user.id || m.receiver_id === user.id) ?? [];
        return {
          ...user,
          lastMessage:     userMsgs[0]?.message || '',
          lastMessageTime: userMsgs[0]?.created_at || '',
        };
      });

      usersWithMsgs.sort((a, b) => new Date(b.lastMessageTime || 0) - new Date(a.lastMessageTime || 0));
      setUsers(usersWithMsgs);

      // Auto-select passed contact
      if (passedContactId) {
        const contact = usersWithMsgs.find(u => u.id === passedContactId);
        if (contact) setSelectedUser(contact);
      }
    }
    setLoading(false);
  };


  const fetchMessages = async (receiverId) => {
    if (!session) return;
    
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${session.user.id},receiver_id.eq.${receiverId}),and(sender_id.eq.${receiverId},receiver_id.eq.${session.user.id})`)
      .order('created_at', { ascending: true });
      
    if (data) {
      setMessages(data);
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (!selectedUser || !session) return;
    
    fetchMessages(selectedUser.id);

    const channel = supabase
      .channel('messages_channel')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${session.user.id}`
      }, payload => {
        if (payload.new.sender_id === selectedUser.id) {
          setMessages(prev => [...prev, payload.new]);
          scrollToBottom();
        }
      })
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `sender_id=eq.${session.user.id}`
      }, payload => {
        if (payload.new.receiver_id === selectedUser.id) {
          setMessages(prev => {
            // Check if message already exists (optimistic UI)
            if (!prev.find(m => m.id === payload.new.id)) {
              return [...prev, payload.new];
            }
            return prev;
          });
          scrollToBottom();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedUser, session]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser || !session) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    // Optimistic UI update
    const tempMsg = {
      id: 'temp-' + Date.now(),
      sender_id: session.user.id,
      receiver_id: selectedUser.id,
      message: msgText,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    await supabase.from('messages').insert([{
      sender_id: session.user.id,
      receiver_id: selectedUser.id,
      message: msgText
    }]);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-lg animate-in fade-in duration-500">
      
      {/* Users List Sidebar */}
      <div className={`w-full md:w-80 border-r border-gray-200 dark:border-slate-700 flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-800/50">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-500" /> Messages
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {users.map(user => (
            <button
              key={user.id}
              onClick={() => setSelectedUser(user)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors text-left border-b border-gray-100 dark:border-slate-700/50 last:border-0 ${
                selectedUser?.id === user.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden shrink-0">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <p className="font-semibold text-gray-900 dark:text-white truncate">{user.full_name}</p>
                  {user.lastMessageTime && (
                    <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                      {new Date(user.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center gap-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize shrink-0">{user.role}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex-1 text-right">
                    {user.lastMessage || 'No messages yet'}
                  </p>
                </div>
              </div>
            </button>
          ))}
          {users.length === 0 && (
            <div className="p-6 text-center text-gray-500 text-sm">No users found.</div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col ${!selectedUser ? 'hidden md:flex' : 'flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center gap-3">
              <button 
                className="md:hidden p-2 -ml-2 text-gray-500" 
                onClick={() => setSelectedUser(null)}
              >
                ←
              </button>
              <div className="w-10 h-10 rounded-full overflow-hidden">
                {selectedUser.avatar_url ? (
                  <img src={selectedUser.avatar_url} alt={selectedUser.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold">
                    {selectedUser.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{selectedUser.full_name}</h3>
                <p className="text-xs text-gray-500 capitalize">{selectedUser.role}</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-slate-900/50 custom-scrollbar">
              {messages.map(msg => {
                const isMe = msg.sender_id === session?.user?.id;
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-slate-600'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                  Send a message to start chatting
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md"
                >
                  <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            <div className="w-20 h-20 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-300 dark:text-gray-500" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-2">Your Messages</h3>
            <p>Select a conversation from the sidebar to start chatting.</p>
          </div>
        )}
      </div>
    </div>
  );
}
