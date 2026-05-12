import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Carousel — A modern, auto-sliding carousel component.
 */
export default function Carousel({ 
  items, 
  renderItem, 
  autoPlay = true, 
  interval = 5000,
  showArrows = true,
  showDots = true,
  itemsPerView = { mobile: 1, tablet: 2, desktop: 3 }
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const timerRef = useRef(null);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1 >= items.length ? 0 : prev + 1));
  }, [items.length]);

  const prev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 < 0 ? items.length - 1 : prev - 1));
  }, [items.length]);

  useEffect(() => {
    if (autoPlay && !isHovered) {
      timerRef.current = setInterval(next, interval);
    }
    return () => clearInterval(timerRef.current);
  }, [autoPlay, isHovered, next, interval]);

  if (!items || items.length === 0) return null;

  return (
    <div 
      className="relative w-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation Arrows */}
      {showArrows && items.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-[-20px] md:left-[-40px] top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 rounded-2xl text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <button
            onClick={next}
            className="absolute right-[-20px] md:right-[-40px] top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 bg-white dark:bg-slate-800 shadow-xl border border-gray-100 dark:border-slate-700 rounded-2xl text-gray-600 dark:text-gray-300 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
          >
            <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </>
      )}

      {/* Items Container */}
      <div className="overflow-hidden px-1">
        <motion.div 
          className="flex gap-6"
          animate={{ x: items.length > 0 ? `-${currentIndex * (100 / items.length)}%` : '0%' }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{ width: `${items.length * 100}%` }}
        >
          {items.map((item, index) => (
            <div 
              key={index} 
              className="flex-shrink-0"
              style={{ width: `${100 / items.length}%` }}
            >
              <div className="px-2 h-full">
                {renderItem(item, index)}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Dots Indicator */}
      {showDots && items.length > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-1.5 transition-all duration-500 rounded-full ${
                currentIndex === index 
                  ? 'w-8 bg-blue-600 dark:bg-blue-500' 
                  : 'w-2 bg-gray-300 dark:bg-slate-700 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
