import { useState } from 'react';
import { affiliations } from '../data/affiliations';

// Duplicate the array so the marquee seamlessly loops even on ultra-wide screens
const MARQUEE_ITEMS = [...affiliations, ...affiliations, ...affiliations, ...affiliations, ...affiliations];

function AffiliationItem({ item }) {
  const [error, setError] = useState(false);

  return (
    <div
      title={item.fullName}
      className="flex flex-col items-center justify-start gap-4 group grayscale opacity-70 hover:grayscale-0 hover:opacity-100 transition-all duration-500 hover:-translate-y-2 w-36 md:w-48 shrink-0 cursor-pointer px-4 relative z-20 py-2"
    >
      <div className="h-14 md:h-20 w-full flex items-center justify-center relative">
        {/* Soft premium glow on hover */}
        <div className="absolute inset-0 bg-blue-500/10 dark:bg-blue-400/10 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
        
        {!error ? (
          <img 
            src={item.logo} 
            alt={item.fullName || item.name} 
            className="max-h-full max-w-full object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
            onError={() => setError(true)}
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-slate-800 flex items-center justify-center">
             <span className="font-bold text-xs text-gray-400">IMG</span>
          </div>
        )}
      </div>
      
      {/* Name below logo */}
      <div className="text-center w-full">
        <p className="text-[11px] md:text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
          {item.name}
        </p>
      </div>
    </div>
  );
}

export default function Affiliations() {
  console.log("Dynamically loaded affiliations:", affiliations);

  return (
    <div className="py-12 border-y border-gray-100 dark:border-slate-800/60 bg-white/50 dark:bg-[#020617]/50 backdrop-blur-sm overflow-hidden flex flex-col items-center">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 text-center">
        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.25em]">
          Recognized & Affiliated by
        </p>
      </div>

      <div className="relative w-full overflow-hidden max-w-[100vw]">
        {/* Gradient edge masks to fade the scrolling items smoothly */}
        <div className="absolute left-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-r from-white dark:from-[#020617] to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 md:w-40 bg-gradient-to-l from-white dark:from-[#020617] to-transparent z-10 pointer-events-none" />

        <div className="flex animate-infinite-scroll py-2">
          {MARQUEE_ITEMS.map((item, idx) => (
            <AffiliationItem key={`${item.name}-${idx}`} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
