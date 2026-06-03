import React from 'react';
import { Activity, ShieldCheck, Database, Server, RefreshCw } from 'lucide-react';

export const ContentGrid = ({ children, className = '' }) => (
  <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 auto-rows-fr ${className}`}>
    {children}
  </div>
);

export const EmptyStateWidget = ({ title, desc, icon: Icon, colorClass = "text-theme-text-muted", bgClass = "bg-black/5 dark:bg-white/5" }) => (
  <div className="bg-theme-card backdrop-blur-2xl border border-theme-border rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[280px] transition-all hover:shadow-md">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-inner ${bgClass}`}>
      <Icon className={`w-8 h-8 ${colorClass}`} />
    </div>
    <h3 className="text-lg font-bold text-theme-text mb-2 tracking-tight">{title}</h3>
    <p className="text-sm font-medium text-theme-text-muted max-w-[250px] leading-relaxed">
      {desc}
    </p>
  </div>
);

export const SystemStatusWidget = () => (
  <div className="bg-theme-card backdrop-blur-2xl border border-theme-border rounded-3xl p-6 sm:p-8 shadow-sm h-full flex flex-col relative overflow-hidden">
    <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
    
    <div className="flex items-center justify-between mb-6 relative z-10">
      <h3 className="text-lg font-bold text-theme-text tracking-tight">System Status</h3>
      <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-3 py-1.5 rounded-full">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">Operational</span>
      </div>
    </div>

    <div className="space-y-4 flex-1 relative z-10 flex flex-col justify-center">
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-theme-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
            <Server className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-theme-text">API Server</span>
        </div>
        <span className="text-xs font-black text-emerald-500">99.9% Uptime</span>
      </div>
      
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-theme-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
            <Database className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-theme-text">Database</span>
        </div>
        <span className="text-xs font-black text-emerald-500">14ms Latency</span>
      </div>
      
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-theme-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-500">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-theme-text">Auth Service</span>
        </div>
        <span className="text-xs font-black text-emerald-500">Secured</span>
      </div>
    </div>
  </div>
);
