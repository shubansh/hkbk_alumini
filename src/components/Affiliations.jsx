import { motion } from 'framer-motion';
import { useState } from 'react';

const AFFILIATIONS = [
  {
    name: 'AICTE',
    fullName: 'All India Council for Technical Education',
    logo: 'https://upload.wikimedia.org/wikipedia/en/e/eb/All_India_Council_for_Technical_Education_logo.png',
  },
  {
    name: 'VTU',
    fullName: 'Visvesvaraya Technological University',
    logo: 'https://vtu.ac.in/wp-content/themes/vtu/images/logo.png',
  },
  {
    name: 'NAAC',
    fullName: 'National Assessment and Accreditation Council',
    logo: 'https://upload.wikimedia.org/wikipedia/en/1/11/NAAC_logo.png',
  }
];

function AffiliationItem({ item, idx }) {
  const [error, setError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.1 }}
      viewport={{ once: true }}
      whileHover={{ y: -5, scale: 1.05 }}
      className="flex flex-col items-center gap-3 group grayscale hover:grayscale-0 transition-all duration-500"
    >
      <div className="h-16 w-auto flex items-center justify-center">
        {!error ? (
          <img 
            src={item.logo} 
            alt={item.name} 
            className="max-h-full object-contain drop-shadow-sm"
            onError={() => setError(true)}
          />
        ) : (
          <span className="font-black text-2xl text-gray-300 dark:text-slate-700">{item.name}</span>
        )}
      </div>
      <div className="text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">{item.name}</p>
      </div>
    </motion.div>
  );
}

export default function Affiliations() {
  return (
    <div className="py-12 border-y border-gray-100 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-center gap-12 md:gap-24">
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4 md:mb-0">
            Recognized & Affiliated by
          </p>
          <div className="flex flex-wrap justify-center items-center gap-10 md:gap-20">
            {AFFILIATIONS.map((item, idx) => (
              <AffiliationItem key={item.name} item={item} idx={idx} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
