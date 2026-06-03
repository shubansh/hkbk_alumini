import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function CountdownWidget({ date, title = "Next Event Starts In" }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [isPast, setIsPast] = useState(false);

  useEffect(() => {
    if (!date) return;
    
    const target = new Date(date).getTime();
    if (isNaN(target)) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsPast(true);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
        setIsPast(false);
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    };

    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, [date]);

  if (!date || isPast) return null;

  return (
    <div className="bg-white/10 border border-white/10 rounded-2xl p-4 backdrop-blur-md w-full max-w-sm">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-amber-300" />
        <span className="text-xs font-bold text-white uppercase tracking-wider">{title}</span>
      </div>
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-black/20 rounded-xl p-2 border border-white/5">
          <div className="text-xl font-black text-white">{timeLeft.days}</div>
          <div className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Days</div>
        </div>
        <div className="bg-black/20 rounded-xl p-2 border border-white/5">
          <div className="text-xl font-black text-white">{timeLeft.hours}</div>
          <div className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Hrs</div>
        </div>
        <div className="bg-black/20 rounded-xl p-2 border border-white/5">
          <div className="text-xl font-black text-white">{timeLeft.minutes}</div>
          <div className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Mins</div>
        </div>
        <div className="bg-black/20 rounded-xl p-2 border border-white/5">
          <div className="text-xl font-black text-white">{timeLeft.seconds}</div>
          <div className="text-[9px] text-white/60 font-bold uppercase tracking-wider">Secs</div>
        </div>
      </div>
    </div>
  );
}
