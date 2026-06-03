import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function EventCountdown({ date }) {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!date) return;
    
    const eventTime = new Date(date).getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = eventTime - now;

      if (distance < 0) {
        setIsPast(true);
        setTimeLeft(null);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [date]);

  if (isPast) {
    return (
      <div className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 uppercase tracking-widest">
        Event Concluded
      </div>
    );
  }

  if (!timeLeft) return null;

  return (
    <div className="flex gap-2">
      <div className="bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-lg px-2 py-1.5 flex flex-col items-center min-w-[3rem]">
        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{timeLeft.days}</span>
        <span className="text-[9px] uppercase tracking-widest text-gray-500">Days</span>
      </div>
      <div className="bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-lg px-2 py-1.5 flex flex-col items-center min-w-[3rem]">
        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{timeLeft.hours}</span>
        <span className="text-[9px] uppercase tracking-widest text-gray-500">Hrs</span>
      </div>
      <div className="bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-lg px-2 py-1.5 flex flex-col items-center min-w-[3rem]">
        <span className="text-sm font-black text-blue-600 dark:text-blue-400">{timeLeft.minutes}</span>
        <span className="text-[9px] uppercase tracking-widest text-gray-500">Min</span>
      </div>
      <div className="bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-lg px-2 py-1.5 flex flex-col items-center min-w-[3rem]">
        <span className="text-sm font-black text-blue-600 dark:text-blue-400 animate-pulse">{timeLeft.seconds}</span>
        <span className="text-[9px] uppercase tracking-widest text-gray-500">Sec</span>
      </div>
    </div>
  );
}
