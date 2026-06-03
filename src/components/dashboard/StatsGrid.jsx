import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export default function StatsGrid({ stats }) {
  if (!stats || stats.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div key={idx} className="bg-white dark:bg-slate-900/60 backdrop-blur-xl p-5 rounded-2xl border border-gray-200/50 dark:border-white/10 hover:shadow-lg transition-all duration-300 overflow-hidden relative group">
            <div className={`absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${stat.colorClass || 'from-blue-500 to-indigo-600'}`}></div>
            <div className="flex justify-between items-start mb-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.colorClass || 'from-blue-500 to-indigo-600'} shadow-md group-hover:scale-105 transition-transform duration-300`}>
                {Icon && <Icon className="w-5 h-5 text-white" />}
              </div>
              {stat.to && (
                <Link to={stat.to} className="p-1.5 bg-gray-50 dark:bg-slate-800 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-gray-100 dark:hover:bg-slate-700">
                  <ChevronRight className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                </Link>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-0.5">{stat.label}</p>
              <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">{stat.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
