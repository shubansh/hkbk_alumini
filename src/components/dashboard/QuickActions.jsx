import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function QuickActions({ actions, title = "Quick Actions" }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div>
      <h2 className="text-lg font-bold text-theme-text mb-4 flex items-center gap-2">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {actions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <Link 
              key={idx} 
              to={action.to}
              className="group relative bg-theme-card backdrop-blur-2xl p-6 rounded-3xl border border-theme-border hover:bg-black/5 dark:hover:bg-white/5 hover:shadow-xl transition-all duration-300"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform duration-300 ${action.colorClass || 'from-blue-500 to-indigo-600'}`}>
                {Icon && <Icon className="w-5 h-5 text-white" />}
              </div>
              <h3 className="text-base font-bold text-theme-text mb-1 group-hover:text-theme-primary transition-colors">{action.title}</h3>
              <p className="text-xs text-theme-text-muted mb-3">{action.desc}</p>
              <div className="flex items-center text-xs font-bold text-theme-primary group-hover:translate-x-1 transition-transform">
                Explore <ChevronRight className="w-3 h-3 ml-0.5" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
