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

  const [onlineUsers, setOnlineUsers] = useState({});

  useEffect(() => {
    if (!session) return;

    // Track online presence
    const presenceChannel = supabase.channel('online-users', {
      config: { presence: { key: session.user.id } },
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineStatus = {};
        Object.keys(state).forEach((userId) => {
          onlineStatus[userId] = true;
        });
        setOnlineUsers(onlineStatus);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [session]);

  useEffect(() => {
    if (!selectedUser || !session) return;
    
    fetchMessages(selectedUser.id);

    // Using a dynamic channel name prevents collisions
    const channelName = `chat_${session.user.id}_${selectedUser.id}_${Date.now()}`;
    const channel = supabase
      .channel(channelName)
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
        filter: `receiver_id=eq.${session.user.id}`
      }, payload => {
        if (payload.new.sender_id === selectedUser.id) {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev;
            return [...prev, payload.new];
          });
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
            // Check if message already exists by ID
            if (prev.find(m => m.id === payload.new.id)) return prev;
            
            // Check for optimistic message match (same text, temp ID)
            const tempIndex = prev.findIndex(m => 
              String(m.id).startsWith('temp-') && 
              m.message === payload.new.message
            );
            
            if (tempIndex !== -1) {
              // Replace optimistic message with the real one
              const newMessages = [...prev];
              newMessages[tempIndex] = payload.new;
              return newMessages;
            }
            
            return [...prev, payload.new];
          });
          scrollToBottom();
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [selectedUser, session]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
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
    <div className="flex h-full w-full bg-white dark:bg-slate-900 overflow-hidden animate-in fade-in duration-500">
      
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
              <div className="relative w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden shrink-0 shadow-sm border border-gray-100 dark:border-slate-600">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-bold">
                    {user.full_name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Online Indicator Simulator -> Real Presence */}
              {onlineUsers[user.id] && (
                <div className="absolute left-[3.25rem] mt-[1.25rem] w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-800 rounded-full z-10"></div>
              )}
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
                const isOptimistic = String(msg.id).startsWith('temp-');
                
                return (
                  <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-300 ease-out`}>
                    <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm relative group ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-br-sm' 
                        : 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white rounded-bl-sm border border-gray-100 dark:border-slate-600'
                    }`}>
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                      <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                        <p className="text-[10px]">
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        {isMe && (
                          <span className="text-[10px]">
                            {isOptimistic ? '·' : '✓'}
                          </span>
                        )}
                      </div>
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
            <div className="mt-auto flex-shrink-0 p-4 bg-white dark:bg-slate-800 border-t border-gray-200 dark:border-slate-700">
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
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-md shrink-0"
                >
                  <Send className="w-5 h-5 -ml-0.5 mt-0.5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/40 dark:to-indigo-900/40 rounded-full flex items-center justify-center mb-6 shadow-inner">
              <MessageSquare className="w-12 h-12 text-blue-500 dark:text-blue-400" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Your Messages</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
              Select a conversation from the sidebar to start chatting, or connect with a mentor to begin a new thread.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
