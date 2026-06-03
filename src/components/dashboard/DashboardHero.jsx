import { Link } from 'react-router-dom';

export default function DashboardHero({ 
  profile, 
  greeting, 
  title, 
  subtitle, 
  badgeIcon: BadgeIcon, 
  badgeText, 
  gradientClass,
  extraContent 
}) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${gradientClass || 'from-slate-900 to-indigo-950'} p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center gap-10`}>
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-[0.03] rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="relative z-10 flex-shrink-0">
        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-[4px] border-white/10 overflow-hidden shadow-2xl bg-white/5 backdrop-blur-sm relative group">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/10 to-transparent">
              <span className="text-4xl font-bold text-white shadow-sm">
                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
          <Link to="/dashboard/settings" className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-xs font-bold text-white bg-black/50 px-3 py-1 rounded-full backdrop-blur-md">Edit</span>
          </Link>
        </div>
      </div>

      <div className="relative z-10 flex-1 text-center md:text-left">
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-2 tracking-tight">
          {greeting}, {profile?.full_name?.split(' ')?.[0] || 'User'} 👋
        </h1>
        {badgeText && (
          <p className="text-blue-100/90 font-semibold text-base sm:text-lg mb-3 flex items-center justify-center md:justify-start gap-2">
            {BadgeIcon && <BadgeIcon className="w-4 h-4 text-amber-300" />} 
            {badgeText}
          </p>
        )}
        {subtitle && (
          <p className="text-white/60 max-w-2xl text-sm sm:text-base leading-relaxed mb-4">
            {subtitle}
          </p>
        )}
        {extraContent}
      </div>
    </div>
  );
}
