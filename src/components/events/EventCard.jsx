import { useState } from 'react';
import { Calendar, MapPin, Clock, Users, X, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useEventRSVP, useEventStats } from '../../hooks/useEventRSVP';
import EventCountdown from './EventCountdown';

export default function EventCard({ event }) {
  const { rsvpStatus, qrToken, loading: rsvpLoading, updateRSVP } = useEventRSVP(event.id);
  const { stats, loading: statsLoading } = useEventStats(event.id);
  const [showQR, setShowQR] = useState(false);

  const eventDate = event.date ? new Date(event.date) : null;
  const isValidDate = eventDate && !isNaN(eventDate.getTime());
  const isPast = eventDate && eventDate.getTime() < Date.now();

  const handleGoogleCalendar = () => {
    if (!isValidDate) return;
    const end = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // assume 2 hrs
    const format = (d) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${format(eventDate)}/${format(end)}&details=${encodeURIComponent(event.description)}&location=${encodeURIComponent(event.location)}`;
    window.open(url, '_blank');
  };

  return (
    <>
      <div className="bg-white dark:bg-slate-900/50 border border-gray-100 dark:border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-blue-500/50 transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/5 flex flex-col group backdrop-blur-sm relative">
        
        {/* Header Image */}
        {event.image_url ? (
          <div className="w-full h-56 overflow-hidden bg-gray-100 dark:bg-slate-900 relative">
            <img 
              src={event.image_url} 
              alt={event.title} 
              className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000" 
            />
            {/* Countdown Overlay */}
            {!isPast && isValidDate && (
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-lg rounded-xl p-2 z-10">
                <EventCountdown date={event.date} />
              </div>
            )}
          </div>
        ) : (
          <div className="w-full h-56 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 flex flex-col items-center justify-center p-6 text-center relative">
            <Calendar className="w-12 h-12 text-blue-300 dark:text-blue-500/30 mb-2" />
            <span className="text-sm text-blue-600 dark:text-blue-400 font-bold opacity-70 uppercase tracking-widest">HKBK Event</span>
            {!isPast && isValidDate && (
              <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur shadow-lg rounded-xl p-2 z-10">
                <EventCountdown date={event.date} />
              </div>
            )}
          </div>
        )}
        
        <div className="p-8 flex-1">
          <div className="flex justify-between items-start mb-4">
            <div className="bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-black px-4 py-2 rounded-full inline-block uppercase tracking-widest">
              {isValidDate ? eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Date TBD'}
            </div>
          </div>
          
          <h3 className="text-2xl font-black mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors tracking-tight">{event.title || 'Untitled Event'}</h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">{event.description || 'No description provided.'}</p>
          
          <div className="space-y-3 text-sm font-medium text-gray-500 dark:text-gray-400 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                {isValidDate ? eventDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Time TBD'}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-blue-500" />
                </div>
                <span className="truncate max-w-[200px]">{event.location || 'Location TBD'}</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-slate-800 flex items-center justify-center">
                  <Users className="w-4 h-4 text-blue-500" />
                </div>
                <span>
                  {statsLoading ? '...' : stats.going} <span className="opacity-70">Going</span> 
                  <span className="mx-2">•</span> 
                  {statsLoading ? '...' : stats.interested} <span className="opacity-70">Interested</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-6 pt-0 mt-auto bg-gray-50/50 dark:bg-slate-800/20 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-3">
          
          {!isPast && (
            <div className="flex gap-2">
              <button 
                onClick={() => updateRSVP('going')}
                disabled={rsvpLoading}
                className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${
                  rsvpStatus === 'going' 
                  ? 'bg-green-500 text-white shadow-lg shadow-green-500/30 ring-2 ring-green-500 ring-offset-2 dark:ring-offset-slate-900' 
                  : 'bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 hover:border-green-500 text-gray-700 dark:text-gray-200'
                }`}
              >
                {rsvpStatus === 'going' ? '✓ Going' : 'Going'}
              </button>
              <button 
                onClick={() => updateRSVP('interested')}
                disabled={rsvpLoading}
                className={`flex-1 py-3 rounded-xl font-bold transition-all text-sm ${
                  rsvpStatus === 'interested' 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-slate-900' 
                  : 'bg-white dark:bg-slate-800 border-2 border-gray-100 dark:border-slate-700 hover:border-amber-500 text-gray-700 dark:text-gray-200'
                }`}
              >
                {rsvpStatus === 'interested' ? '★ Interested' : 'Interested'}
              </button>
            </div>
          )}

          <div className="flex gap-2">
            {!isPast && isValidDate && (
              <button 
                onClick={handleGoogleCalendar}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1.5"
              >
                <Calendar className="w-4 h-4" /> Add to Calendar
              </button>
            )}
            
            {rsvpStatus === 'going' && qrToken && !isPast && (
              <button 
                onClick={() => setShowQR(true)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-xs bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-colors flex items-center justify-center gap-1.5"
              >
                <QrCode className="w-4 h-4" /> View Ticket QR
              </button>
            )}

            {isPast && (
              <button 
                className="w-full py-3 rounded-xl font-bold text-sm bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                disabled
              >
                Event has ended
              </button>
            )}
          </div>
        </div>
      </div>

      {/* QR Code Modal */}
      {showQR && qrToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowQR(false)}
              className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mb-6 mt-4">
              <h3 className="text-2xl font-black mb-2 text-gray-900 dark:text-white">Your Entry Pass</h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Present this QR code at the entrance for "{event.title}".</p>
            </div>
            <div className="bg-white p-4 rounded-2xl border-4 border-gray-100 mx-auto w-fit shadow-inner">
              <QRCodeSVG value={qrToken} size={200} level="H" includeMargin={true} />
            </div>
            <p className="text-center text-xs font-mono text-gray-400 mt-6 break-all bg-gray-50 dark:bg-slate-900 p-2 rounded-lg">
              {qrToken}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
