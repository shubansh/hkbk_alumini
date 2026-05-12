import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Maximize2, Download } from 'lucide-react';
import { useEffect } from 'react';

/**
 * Lightbox — Fullscreen image viewer with navigation.
 */
export default function Lightbox({ images, currentIndex, onClose, onPrev, onNext }) {
  
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  if (currentIndex === null || !images[currentIndex]) return null;

  const currentImg = images[currentIndex];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-10"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 z-[110] p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Navigation - Prev */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 md:left-10 z-[110] p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        {/* Image Container */}
        <motion.div
          key={currentIndex}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center gap-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative group w-full h-[80vh] flex items-center justify-center">
            <img
              src={currentImg.image_url}
              alt={currentImg.title || 'Gallery Image'}
              className="max-w-full max-h-full object-contain shadow-2xl rounded-lg"
            />
          </div>

          {/* Caption */}
          <div className="text-center">
            <h3 className="text-xl font-bold text-white mb-1">{currentImg.title}</h3>
            {currentImg.category && (
              <span className="inline-block px-3 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
                {currentImg.category}
              </span>
            )}
          </div>
        </motion.div>

        {/* Navigation - Next */}
        {images.length > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 md:right-10 z-[110] p-3 bg-white/5 hover:bg-white/10 text-white rounded-2xl transition-all"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}

        {/* Info / Counter */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white/50 text-sm font-medium">
          {currentIndex + 1} / {images.length}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
