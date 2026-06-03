import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function NotificationBell() {
  const { session } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetchNotifications();

    const channelId = `notifications_${session.user.id}_${Math.random()}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`
      }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
        setUnreadCount(prev => prev + 1);
      })
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${session.user.id}`
      }, payload => {
        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        if (payload.old.is_read === false && payload.new.is_read === true) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error.message);
    }
  };

  const markAsRead = async (id) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as read:', error.message);
    }
  };

  const markAllAsRead = async () => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', session.user.id).eq('is_read', false);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error.message);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 rounded-full bg-theme-card backdrop-blur-md border border-theme-border text-theme-text-muted hover:text-theme-text hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 group relative"
      >
        <Bell className="w-5 h-5 transition-transform group-hover:rotate-12 origin-top" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white border-2 border-theme-card shadow-sm animate-in zoom-in">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-theme-card rounded-2xl shadow-xl border border-theme-border overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 backdrop-blur-xl">
          <div className="p-4 border-b border-theme-border flex justify-between items-center bg-black/5 dark:bg-white/5">
            <h3 className="font-semibold text-theme-text flex items-center gap-2">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-theme-primary hover:opacity-80 font-medium flex items-center gap-1 transition-colors">
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[28rem] overflow-y-auto custom-scrollbar">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-theme-text-muted">
                <Bell className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-sm">You have no notifications yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-theme-border">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer flex gap-3 relative group ${!notif.is_read ? 'bg-blue-500/5' : ''}`}
                    onClick={() => {
                      if (!notif.is_read) markAsRead(notif.id);
                      if (notif.link) window.location.href = notif.link;
                    }}
                  >
                    {!notif.is_read && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-theme-primary" />
                    )}
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 text-theme-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notif.is_read ? 'font-semibold text-theme-text' : 'text-theme-text-muted'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-theme-text-muted mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-[10px] text-theme-text-muted opacity-70 mt-2 font-medium">
                        {new Date(notif.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
