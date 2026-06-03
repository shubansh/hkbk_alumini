import { useState, useRef, useEffect } from 'react';
import { Bell, Check, Trash2, Calendar, MessageSquare, Info } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getIcon = (type) => {
    switch(type) {
      case 'event_reminder': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-green-500" />;
      default: return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
      >
        <Bell className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 border-2 border-white dark:border-slate-900 rounded-full flex items-center justify-center text-[9px] font-black text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400 flex flex-col items-center">
                <Bell className="w-8 h-8 opacity-20 mb-2" />
                <p className="text-sm font-medium">You're all caught up!</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-800">
                {notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    className={`p-4 flex gap-3 transition-colors ${notif.is_read ? 'opacity-70 bg-white dark:bg-slate-900' : 'bg-blue-50/50 dark:bg-slate-800/80 hover:bg-gray-50 dark:hover:bg-slate-800'}`}
                  >
                    <div className="shrink-0 pt-1">
                      {getIcon(notif.type)}
                    </div>
                    <div className="flex-1">
                      <Link 
                        to={notif.link || '#'} 
                        onClick={() => { if(!notif.is_read) markAsRead(notif.id); setIsOpen(false); }}
                        className="block"
                      >
                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-0.5">{notif.title}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">{notif.message}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                        </p>
                      </Link>
                    </div>
                    {!notif.is_read && (
                      <button 
                        onClick={() => markAsRead(notif.id)}
                        className="shrink-0 self-start p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-400 transition-colors"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
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
