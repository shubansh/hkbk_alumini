import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';

export default function ContactForm() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Alumni',
    subject: '',
    message: ''
  });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // In a real app, ensure this table has a 'role' column or omit it if not present.
      // We will omit role if it causes issues, but assuming it's safe or we can just append it to the message.
      const payload = {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: `[Role: ${formData.role}]\n\n${formData.message}` // Safe fallback if 'role' column doesn't exist
      };

      const { error } = await supabase.from('contact_messages').insert([payload]);
      if (error) throw error;
      
      toast.success('Message sent successfully! We will get back to you soon.');
      setFormData({ name: '', email: '', role: 'Alumni', subject: '', message: '' });
    } catch (error) {
      console.error('Contact form error:', error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 md:p-10 border border-gray-100 dark:border-slate-800 shadow-2xl shadow-blue-500/5 h-full relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
      
      <div className="mb-8">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Send a Message</h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Fill out the form below and our support team will respond within 24 hours.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Full Name *</label>
            <input 
              required type="text" name="name" value={formData.name} onChange={handleChange}
              className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
              placeholder="e.g. Priya Sharma"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Email Address *</label>
            <input 
              required type="email" name="email" value={formData.email} onChange={handleChange}
              className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white placeholder-gray-400 text-sm"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">I am a...</label>
            <select 
              name="role" value={formData.role} onChange={handleChange}
              className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white text-sm appearance-none"
            >
              <option>Student</option>
              <option>Alumni</option>
              <option>Faculty</option>
              <option>Recruiter</option>
              <option>Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Subject *</label>
            <select 
              required name="subject" value={formData.subject} onChange={handleChange}
              className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white text-sm appearance-none"
            >
              <option value="" disabled>Select a topic…</option>
              <option>Alumni Verification</option>
              <option>Account Access / Password</option>
              <option>Job Portal Support</option>
              <option>Mentorship Program</option>
              <option>Events & Reunions</option>
              <option>Other Enquiry</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Message *</label>
          <textarea 
            required name="message" value={formData.message} onChange={handleChange} rows={5}
            className="w-full px-5 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-gray-900 dark:text-white placeholder-gray-400 resize-none text-sm"
            placeholder="How can we help you today?"
          />
        </div>

        <button 
          type="submit" disabled={loading}
          className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:pointer-events-none transition-all duration-300 flex items-center justify-center gap-3 text-base"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>
          ) : (
            <>Send Message <Send className="w-4 h-4" /></>
          )}
        </button>
      </form>
    </div>
  );
}
