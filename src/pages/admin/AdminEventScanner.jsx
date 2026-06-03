import { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { supabase } from '../../lib/supabase';
import { QrCode, CheckCircle2, XCircle, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminEventScanner() {
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [attendee, setAttendee] = useState(null);

  useEffect(() => {
    let scanner = null;
    
    if (scanning) {
      scanner = new Html5QrcodeScanner('reader', { 
        qrbox: { width: 250, height: 250 }, 
        fps: 5,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
      });

      scanner.render(async (decodedText) => {
        scanner.pause(true); // Pause scanning once we get a result
        setScanResult(decodedText);
        await processQR(decodedText);
      }, (err) => {
        // Ignore read errors (these fire constantly until a QR is found)
      });
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [scanning]);

  const processQR = async (token) => {
    try {
      // Find RSVP by token
      const { data: rsvp, error: fetchError } = await supabase
        .from('event_rsvps')
        .select('*, profiles(full_name, email, role, avatar_url), events(title)')
        .eq('qr_code_token', token)
        .maybeSingle();

      if (fetchError || !rsvp) {
        toast.error('Invalid QR Code. No RSVP found.');
        setAttendee({ status: 'invalid' });
        return;
      }

      if (rsvp.attended) {
        toast('Attendee already checked in!', { icon: '⚠️' });
        setAttendee({ ...rsvp, status: 'already_checked_in' });
        return;
      }

      // Mark as attended
      const { error: updateError } = await supabase
        .from('event_rsvps')
        .update({ attended: true })
        .eq('id', rsvp.id);

      if (updateError) throw updateError;

      toast.success('Successfully checked in!');
      setAttendee({ ...rsvp, status: 'success' });

    } catch (err) {
      console.error(err);
      toast.error('Error processing QR code.');
      setAttendee({ status: 'error' });
    }
  };

  const resetScanner = () => {
    setScanResult(null);
    setAttendee(null);
    setScanning(false);
    setTimeout(() => setScanning(true), 100);
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
          <QrCode className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Event Ticket Scanner</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Scan attendee QR codes to mark attendance.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Scanner Side */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl border border-gray-100 dark:border-slate-700">
          {!scanning ? (
            <div className="flex flex-col items-center justify-center h-[300px] bg-gray-50 dark:bg-slate-900 rounded-2xl border-2 border-dashed border-gray-200 dark:border-slate-700">
              <QrCode className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <button 
                onClick={() => setScanning(true)}
                className="bg-blue-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-blue-500/30 hover:opacity-90 transition-all"
              >
                Start Scanner
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div id="reader" className="w-full rounded-2xl overflow-hidden bg-black shadow-inner"></div>
              <button 
                onClick={() => { setScanning(false); setScanResult(null); setAttendee(null); }}
                className="w-full py-3 bg-red-50 text-red-600 font-bold rounded-xl hover:bg-red-100 transition-colors"
              >
                Stop Scanner
              </button>
            </div>
          )}
        </div>

        {/* Results Side */}
        <div className="bg-gray-50 dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 flex flex-col items-center justify-center min-h-[300px]">
          {!attendee ? (
            <div className="text-center opacity-50">
              <ScanIcon className="w-12 h-12 mx-auto mb-3" />
              <p>Waiting for scan...</p>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center text-center animate-in zoom-in-95">
              {attendee.status === 'success' && <CheckCircle2 className="w-20 h-20 text-green-500 mb-4" />}
              {attendee.status === 'already_checked_in' && <CheckCircle2 className="w-20 h-20 text-amber-500 mb-4" />}
              {(attendee.status === 'invalid' || attendee.status === 'error') && <XCircle className="w-20 h-20 text-red-500 mb-4" />}
              
              {attendee.profiles && (
                <div className="bg-white dark:bg-slate-800 w-full rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 mb-6">
                  <div className="flex justify-center mb-4">
                    {attendee.profiles.avatar_url ? (
                      <img src={attendee.profiles.avatar_url} className="w-20 h-20 rounded-full object-cover border-4 border-gray-50 dark:border-slate-900" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-1">{attendee.profiles.full_name}</h3>
                  <p className="text-sm text-gray-500 mb-4">{attendee.profiles.email}</p>
                  
                  <div className="bg-gray-50 dark:bg-slate-900 rounded-xl p-3 flex flex-col gap-2 text-sm text-left">
                    <div className="flex gap-2">
                      <span className="text-gray-400 flex-shrink-0 w-16">Event:</span>
                      <span className="font-semibold">{attendee.events?.title}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-400 flex-shrink-0 w-16">Role:</span>
                      <span className="font-semibold capitalize">{attendee.profiles.role}</span>
                    </div>
                  </div>
                </div>
              )}

              {attendee.status === 'success' && <p className="text-green-600 font-bold mb-6">Check-in Successful!</p>}
              {attendee.status === 'already_checked_in' && <p className="text-amber-600 font-bold mb-6">Attendee was already checked in.</p>}
              {attendee.status === 'invalid' && <p className="text-red-600 font-bold mb-6">Invalid Ticket Code.</p>}

              <button 
                onClick={resetScanner}
                className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
              >
                Scan Next Ticket
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const ScanIcon = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4M4 4h4v4H4V4zm12 0h4v4h-4V4zM4 16h4v4H4v-4zm12 0h4v4h-4v-4z" />
  </svg>
);
