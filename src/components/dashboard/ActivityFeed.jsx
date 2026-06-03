import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ActivityFeed({ title, items, emptyMessage, emptyIcon: EmptyIcon, viewAllLink, viewAllText = "View All" }) {
  return (
    <div className="bg-theme-card backdrop-blur-2xl p-6 sm:p-8 rounded-3xl border border-theme-border shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <h2 className="text-lg font-bold flex items-center gap-2">{title}</h2>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1">
            {viewAllText} <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>
      
      {items && items.length > 0 ? (
        <div className="space-y-3 flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {items.map((item, idx) => (
            <div key={item.id || idx} className="p-3 sm:p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-theme-border hover:bg-black/10 dark:hover:bg-white/10 hover:shadow-sm transition-all flex items-start gap-3">
              {item.avatarUrl ? (
                <img src={item.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" />
              ) : item.icon ? (
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${item.iconBgClass || 'bg-blue-100 dark:bg-blue-900/30'}`}>
                  <item.icon className={`w-4 h-4 ${item.iconColorClass || 'text-blue-600 dark:text-blue-400'}`} />
                </div>
              ) : null}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-sm text-theme-text truncate">{item.title}</h3>
                <p className="text-xs text-theme-text-muted mt-0.5 line-clamp-2">{item.desc}</p>
                {item.date && (
                  <p className="text-[10px] text-gray-400 mt-1">{item.date}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-theme-border rounded-3xl flex-1 bg-black/5 dark:bg-white/5">
          {EmptyIcon && <EmptyIcon className="w-8 h-8 text-theme-text-muted mb-3 opacity-50" />}
          <p className="text-sm font-medium text-theme-text-muted">{emptyMessage || 'No activity to show.'}</p>
        </div>
      )}
    </div>
  );
}
