import { motion } from 'framer-motion';
import { Globe } from 'lucide-react';

export default function ContactHero() {
  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, ease: 'easeOut', delay },
  });

  return (
    <div className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 pt-20 pb-16 px-4 border-b border-gray-200 dark:border-slate-800 transition-colors duration-300">
      {/* Decorative Orbs & Grid Background */}
      <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: 'linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-[80px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] translate-y-1/2 pointer-events-none" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div {...fadeUp(0)} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 text-gray-600 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
          <Globe className="w-3.5 h-3.5 text-blue-500" />
          HKBK CE Connect • Support Center
        </motion.div>
        
        <motion.h1 {...fadeUp(0.1)} className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-5 tracking-tight">
          Get in Touch
        </motion.h1>
        
        <motion.p {...fadeUp(0.2)} className="text-gray-500 dark:text-gray-400 text-lg max-w-2xl mx-auto leading-relaxed font-medium">
          We’re here to help students, alumni, faculty, and recruiters. Connect with our dedicated support team for quick assistance.
        </motion.p>
      </div>
    </div>
  );
}
