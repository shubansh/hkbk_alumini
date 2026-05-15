import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

export default function FAQSection() {
  const faqs = [
    {
      q: "How long does alumni verification take?",
      a: "Our admin team reviews all alumni registrations within 24-48 hours. Once verified, you will receive an email and gain full access to the directory, jobs, and mentorship programs."
    },
    {
      q: "I forgot my password. How can I reset it?",
      a: "You can reset your password by clicking 'Forgot Password' on the login page. Enter your registered email address, and we will send you a secure reset link."
    },
    {
      q: "Who can post jobs on the portal?",
      a: "Only verified alumni and authorized recruiters can post jobs. Students can view and apply for jobs but cannot post them."
    },
    {
      q: "How do I become a mentor?",
      a: "Verified alumni can opt-in to become mentors from their Dashboard Settings. You can specify your expertise areas and availability there."
    },
    {
      q: "Are the networking events free?",
      a: "Most virtual events and webinars are completely free. Some in-person reunions may have a nominal registration fee to cover venue and catering costs."
    }
  ];

  const [openIndex, setOpenIndex] = useState(0);

  return (
    <div className="max-w-3xl mx-auto py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white flex items-center justify-center gap-2 mb-3">
          <HelpCircle className="w-6 h-6 text-blue-500" /> Frequently Asked Questions
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm">Quick answers to common questions about HKBK CE Connect.</p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div 
              key={index} 
              className={`border border-gray-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white dark:bg-slate-900 shadow-lg shadow-blue-500/5 ring-1 ring-blue-500/20' : 'bg-gray-50/50 dark:bg-slate-900/30 hover:bg-white dark:hover:bg-slate-900'}`}
            >
              <button
                onClick={() => setOpenIndex(isOpen ? -1 : index)}
                className="w-full px-6 py-5 flex items-center justify-between text-left focus:outline-none"
              >
                <span className={`font-bold text-sm ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}>
                  {faq.q}
                </span>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180 text-blue-500' : ''}`} />
              </button>
              
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                  >
                    <div className="px-6 pb-5 pt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-50 dark:border-slate-800/50">
                      {faq.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
