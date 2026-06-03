import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, CheckCircle, XCircle, Download, Clock } from 'lucide-react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

export default function MyEvents() {
  const { session, userProfile } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;
    
    const fetchMyEvents = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_registrations')
        .select('*, events(*)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        setRegistrations(data);
      }
      setLoading(false);
    };

    fetchMyEvents();
  }, [session]);

  const handleCancel = async (id) => {
    if (!confirm('Are you sure you want to cancel your registration?')) return;
    
    const { error } = await supabase
      .from('event_registrations')
      .update({ registration_status: 'cancelled' })
      .eq('id', id);

    if (error) {
      toast.error('Failed to cancel registration');
    } else {
      toast.success('Registration cancelled');
      setRegistrations(registrations.map(r => r.id === id ? { ...r, registration_status: 'cancelled' } : r));
    }
  };

  const generateCertificate = (eventName, date) => {
    try {
      const doc = new jsPDF('landscape');
      
      // Border
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(15, 15, 267, 180);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(40);
      doc.text('Certificate of Attendance', 148, 60, null, null, 'center');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(20);
      doc.text('This is to certify that', 148, 90, null, null, 'center');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(35);
      doc.setTextColor(37, 99, 235); // Blue-600
      doc.text(userProfile?.full_name || 'Attendee', 148, 115, null, null, 'center');
      
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(20);
      doc.text('has successfully attended', 148, 140, null, null, 'center');
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(25);
      doc.text(eventName, 148, 160, null, null, 'center');
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.text(`Date: ${new Date(date).toLocaleDateString()}`, 148, 180, null, null, 'center');
      
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text(`Certificate ID: ${Math.random().toString(36).substr(2, 9).toUpperCase()}`, 20, 195);
      
      doc.save(`${eventName.replace(/[^a-z0-9]/gi, '_')}_Certificate.pdf`);
      toast.success('Certificate downloaded successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate certificate');
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const registered = registrations.filter(r => r.registration_status === 'registered');
  const past = registered.filter(r => new Date(r.events?.date).getTime() < Date.now());
  const upcoming = registered.filter(r => new Date(r.events?.date).getTime() >= Date.now());
  const cancelled = registrations.filter(r => r.registration_status === 'cancelled');

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">My Events</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track your event registrations and download certificates.</p>
        </div>
        <Link to="/events" className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20">
          Browse Events
        </Link>
      </div>

      <div className="space-y-12">
        {/* Upcoming Events */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" /> Upcoming Events
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcoming.map(reg => (
              <EventRow 
                key={reg.id} 
                reg={reg} 
                onCancel={() => handleCancel(reg.id)} 
                isUpcoming={true}
              />
            ))}
            {upcoming.length === 0 && (
              <div className="col-span-full py-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                <p className="text-gray-500 font-medium">No upcoming events registered.</p>
              </div>
            )}
          </div>
        </section>

        {/* Past Events & Certificates */}
        <section>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-500" /> Past Events & Certificates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {past.map(reg => (
              <EventRow 
                key={reg.id} 
                reg={reg} 
                onDownload={() => generateCertificate(reg.events?.title, reg.events?.date)} 
                isPast={true}
              />
            ))}
            {past.length === 0 && (
              <div className="col-span-full py-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
                <p className="text-gray-500 font-medium">No past attended events yet.</p>
              </div>
            )}
          </div>
        </section>

        {/* Cancelled */}
        {cancelled.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-gray-500">
              <XCircle className="w-5 h-5" /> Cancelled Registrations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-75">
              {cancelled.map(reg => (
                <div key={reg.id} className="bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 p-6 rounded-2xl">
                  <h3 className="font-bold text-gray-900 dark:text-white line-through">{reg.events?.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Status: Cancelled</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function EventRow({ reg, onCancel, onDownload, isUpcoming, isPast }) {
  const event = reg.events;
  if (!event) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row justify-between gap-4">
      <div>
        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1"><Link to={`/events/${event.id}`} className="hover:text-blue-500">{event.title}</Link></h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> {new Date(event.date).toLocaleDateString()}
        </p>
        
        {isPast ? (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            reg.attendance_status === 'attended' 
            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {reg.attendance_status === 'attended' ? <><CheckCircle className="w-3 h-3" /> Attended</> : <><XCircle className="w-3 h-3" /> Absent</>}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
            Registered
          </span>
        )}
      </div>

      <div className="flex flex-col gap-2 shrink-0 justify-center">
        {isUpcoming && (
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded-xl transition"
          >
            Cancel
          </button>
        )}
        {isPast && reg.attendance_status === 'attended' && (
          <button 
            onClick={onDownload}
            className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 rounded-xl transition shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4" /> Certificate
          </button>
        )}
      </div>
    </div>
  );
}
