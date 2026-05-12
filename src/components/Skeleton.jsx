export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`relative overflow-hidden bg-gray-100 dark:bg-slate-800 rounded-xl ${className}`}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 dark:via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
    </div>
  );
}
