import { Link } from 'react-router-dom';
import { Globe, Share2, Users, MapPin, Mail } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function Footer() {
  const { theme } = useTheme();
  
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 mt-auto transition-colors duration-300">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          
          {/* 1. About */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center gap-3 group">
              <img 
                src={theme === 'dark' ? '/logos/college/logo-white.png' : '/logos/college/logo.png'} 
                alt="HKBK Logo" 
                className="h-10 w-auto object-contain group-hover:rotate-12 transition-transform duration-500"
                onError={(e) => {
                  e.target.onerror = null; 
                  e.target.src = "https://placehold.co/50x50/2563eb/ffffff?text=H";
                }}
              />
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tighter text-gray-900 dark:text-white leading-none">
                  HKBK <span className="text-blue-600 dark:text-blue-500">Connect</span>
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mt-1">
                  Alumni Network
                </span>
              </div>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
              The official alumni network of HKBK College of Engineering. Fostering lifelong connections, mentorship, and career growth among our global graduate community.
            </p>
          </div>

          {/* 2. Quick Links */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li><Link to="/" className="hover:text-blue-600 dark:text-blue-400 transition-colors">Home</Link></li>
              <li><Link to="/directory" className="hover:text-blue-600 dark:text-blue-400 transition-colors">Alumni Directory</Link></li>
              <li><Link to="/jobs" className="hover:text-blue-600 dark:text-blue-400 transition-colors">Job Portal</Link></li>
              <li><Link to="/events" className="hover:text-blue-600 dark:text-blue-400 transition-colors">Events & Reunions</Link></li>
              <li><Link to="/mentorship" className="hover:text-blue-600 dark:text-blue-400 transition-colors">Mentorship</Link></li>
            </ul>
          </div>

          {/* 3. Contact */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Contact</h4>
            <ul className="space-y-4 text-sm text-gray-500 dark:text-gray-400">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <span>HKBK College of Engineering<br/>Nagawara, Manyata Tech Park Road<br/>Bengaluru, 560045</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
                <a href="mailto:alumni@hkbk.edu.in" className="hover:text-blue-600 dark:text-blue-400 transition-colors">alumni@hkbk.edu.in</a>
              </li>
            </ul>
          </div>

          {/* 4. Social Media */}
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-6 uppercase text-xs tracking-widest">Connect</h4>
            <div className="flex gap-4">
              <a href="#" className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-all duration-300">
                <Users className="w-5 h-5" />
              </a>
              <a href="#" className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-pink-600 hover:text-white transition-all duration-300">
                <Share2 className="w-5 h-5" />
              </a>
              <a href="#" className="p-3 rounded-2xl bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-blue-400 hover:text-white transition-all duration-300">
                <Globe className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-slate-800 mt-16 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-widest">
          <p>© {new Date().getFullYear()} HKBK Connect. Empowering Legacies.</p>
          <div className="flex gap-8">
            <Link to="#" className="hover:text-gray-900 dark:text-white transition-colors">Privacy</Link>
            <Link to="#" className="hover:text-gray-900 dark:text-white transition-colors">Terms</Link>
            <Link to="/contact" className="hover:text-gray-900 dark:text-white transition-colors">Support</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
