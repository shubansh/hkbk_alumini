import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, X, QrCode, ArrowRight, CheckCircle2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Link, useNavigate } from 'react-router-dom';
import { useEventRegistration, useEventStats } from '../../hooks/useEventRegistration';
import EventCountdown from './EventCountdown';
import { useAuth } from '../../contexts/AuthContext';

export default function EventCard({ event }) {
  const { registrationStatus, qrToken, loading: regLoading, updateRegistration } = useEventRegistration(event.id);
  const { stats, loading: statsLoading } = useEventStats(event.id);
  const [showQR, setShowQR] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  const eventDate = event.date ? new Date(event.date) : null;
  const isValidDate = eventDate && !isNaN(eventDate.getTime());
  const isPast = eventDate && eventDate.getTime() < Date.now();

  const isFull = stats.capacity ? stats.registered >= stats.capacity : false;

  const handleRegisterClick = () => {
    if (!session) {
      navigate('/login');
      return;
    }
    updateRegistration('registered');
  };

  const handleGoogleCalendar = () => {
    if (!isValidDate) return;
    const end = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); 
    const format = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${format(eventDate)}/${format(end)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    window.open(url, '_blank');
  };

  const handleOutlookCalendar = () => {
    if (!isValidDate) return;
    const url = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(event.title)}&startdt=${eventDate.toISOString()}&enddt=${new Date(eventDate.getTime() + 2 * 60 * 60 * 1000).toISOString()}&body=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    window.open(url, '_blank');
  };

  const handleAppleCalendar = () => {
    if (!isValidDate) return;
    const end = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); 
    const format = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
DTSTART:${format(eventDate)}
DTEND:${format(end)}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="bg-white/90 dark:bg-slate-900/60 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col group relative h-full">
        
        {/* Header Image & Badges */}
        <div className="w-full h-48 sm:h-56 relative overflow-hidden bg-gray-100 dark:bg-slate-800">
          {event.image_url ? (
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" 
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-6 text-center">
              <Calendar className="w-12 h-12 text-indigo-300 dark:text-indigo-500/30 mb-2 transform group-hover:scale-110 transition-transform duration-500" />
              <span className="text-xs font-black text-indigo-600/50 dark:text-indigo-400/50 uppercase tracking-widest">HKBK Event</span>
            </div>
          )}

          {/* Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>

          {/* Top Left Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            {isPast ? (
              <span className="bg-slate-800/90 text-slate-300 backdrop-blur-md text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border border-slate-700/50 flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> Completed
              </span>
            ) : (
              <span className="bg-indigo-600/90 text-white backdrop-blur-md text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm flex items-center gap-1.5 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span> Upcoming
              </span>
            )}
            
            {registrationStatus === 'registered' && (
              <span className="bg-emerald-500/90 text-white backdrop-blur-md text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest shadow-sm flex items-center gap-1.5 w-fit">
                <CheckCircle2 className="w-3 h-3" /> Registered
              </span>
            )}
          </div>

          {/* Top Right Countdown */}
          {!isPast && isValidDate && (
            <div className="absolute top-4 right-4 z-10">
              <EventCountdown date={event.date} />
            </div>
          )}
        </div>
        
        {/* Card Body */}
        <div className="p-6 flex-1 flex flex-col">
          {/* Top Meta Row */}
          <div className="flex justify-between items-start mb-3 gap-2">
            <div className="text-indigo-600 dark:text-indigo-400 text-[11px] font-black uppercase tracking-widest">
              {isValidDate ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
            </div>
            {stats.capacity && (
              <div className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${isFull ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400' : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300'}`}>
                {isFull ? 'Sold Out' : `${stats.registered} / ${stats.capacity} Seats`}
              </div>
            )}
          </div>
          
          <h3 className="text-xl font-bold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors tracking-tight text-gray-900 dark:text-white line-clamp-2 leading-tight">
            {event.title || 'Untitled Event'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-5 line-clamp-2 leading-relaxed flex-1">
            {event.description || 'No description provided.'}
          </p>
          
          {/* Detail Rows */}
          <div className="space-y-2.5 text-xs font-semibold text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              {isValidDate ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <span className="truncate">{event.location || 'Location TBD'}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Users className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0" />
              <span>
                {statsLoading ? '...' : stats.registered} <span className="opacity-70">Registered</span>
                {!stats.capacity && ' Total'}
              </span>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-5 pt-0 mt-auto flex flex-col gap-2.5 border-t border-gray-100 dark:border-slate-800/60 bg-gray-50/30 dark:bg-slate-900/20">
          
          {!isPast && (
            <div className="pt-4 flex">
              {registrationStatus === 'registered' ? (
                <button 
                  onClick={() => updateRegistration('cancelled')}
                  disabled={regLoading}
                  className="flex-1 py-2.5 rounded-xl font-bold transition-all text-xs border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:hover:bg-red-500/20 dark:text-red-400"
                >
                  Cancel RSVP
                </button>
              ) : (
                <button 
                  onClick={handleRegisterClick}
                  disabled={regLoading || isFull}
                  className={`flex-1 py-2.5 rounded-xl font-bold transition-all text-xs shadow-sm ${
                    isFull 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-slate-800 dark:text-gray-500 border border-gray-200 dark:border-slate-700' 
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600'
                  }`}
                >
                  {isFull ? 'Event Sold Out' : 'Register Now'}
                </button>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2">
            {!isPast && isValidDate && registrationStatus === 'registered' && (
              <div className="flex gap-2">
                <button onClick={handleGoogleCalendar} className="flex-1 py-2 rounded-lg font-semibold text-[10px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-300 transition-colors">
                  Google Cal
                </button>
                <button onClick={handleOutlookCalendar} className="flex-1 py-2 rounded-lg font-semibold text-[10px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-300 transition-colors">
                  Outlook
                </button>
                <button onClick={handleAppleCalendar} className="flex-1 py-2 rounded-lg font-semibold text-[10px] bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-gray-600 dark:text-gray-300 transition-colors">
                  Apple
                </button>
              </div>
            )}
            
            {registrationStatus === 'registered' && qrToken && !isPast && (
              <button 
                onClick={() => setShowQR(true)}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-3.5 h-3.5" /> Show Entry QR
              </button>
            )}

            {isPast && (
              <div className="w-full py-2.5 rounded-xl font-bold text-xs bg-gray-100 dark:bg-slate-800/50 text-gray-400 dark:text-gray-500 text-center mt-4 cursor-default">
                Event has ended
              </div>
            )}
            
            <Link 
              to={`/events/${event.id}`}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-1.5 mt-1"
            >
              View Full Details <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && qrToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-slate-700">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="text-center mb-6 mt-4">
              <h3 className="text-xl font-black mb-1.5 text-gray-900 dark:text-white">Your Entry Pass</h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">Present this QR code at the entrance for "{event.title}".</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-4 border-gray-100 dark:border-slate-700 mx-auto w-fit shadow-inner">
              <QRCodeSVG value={qrToken} size={180} level="H" includeMargin={true} />
            </div>
            <p className="text-center text-[10px] font-mono font-bold text-gray-400 dark:text-gray-500 mt-6 break-all bg-gray-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-gray-100 dark:border-slate-700/50">
              {qrToken}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
