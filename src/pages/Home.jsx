import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Briefcase,
  GraduationCap,
  Calendar,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Quote,
  MapPin,
  Mail,
  Phone,
  MessageSquare,
  Search,
  ExternalLink,
  Award,
  BookOpen,
  CheckCircle2,
  Trophy,
  Target,
  Clock
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  useFeaturedAlumni,
  useFeaturedFaculty,
  useGalleryImages,
  useLatestJobs,
  useUpcomingEvents,
  usePlatformStats
} from '../hooks/useHomeData';
import { Skeleton } from '../components/Skeleton';
import ContactHero from '../components/contact/ContactHero';
import SupportCards from '../components/contact/SupportCards';
import ContactForm from '../components/contact/ContactForm';
import FAQSection from '../components/contact/FAQSection';
import FacultyAvatar from '../components/faculty/FacultyAvatar';
import Carousel from '../components/Carousel';
import Lightbox from '../components/Lightbox';
import Affiliations from '../components/Affiliations';
import LinkedInFeedSection from '../components/LinkedInFeedSection';
import OptimizedImage from '../components/OptimizedImage';
import { HERO_IMAGE, HERO_FOCAL_POINT, ABOUT_IMAGE, CONTACT_IMAGE, FALLBACKS } from '../config/siteImages';

// ─── Animation Variants ──────────────────────────────────────────────────────
// Used across all sections — import via prop or reference directly
export const fadeIn = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] }
  }
};

export const fadeInLeft = {
  hidden: { opacity: 0, x: -32 },
  visible: {
    opacity: 1, x: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

// Scroll-triggered reveal — use with whileInView
export const scrollReveal = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
  }
};

// ─── Stat Card Component ──────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, value, label, loading }) => (
  <motion.div
    variants={fadeIn}
    className="bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/10 p-6 rounded-3xl flex items-center gap-4 group hover:bg-white hover:dark:bg-white/10 transition-all duration-500 shadow-sm hover:shadow-xl"
  >
    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-500">
      {Icon && <Icon className="w-6 h-6" />}
    </div>
    <div>
      {loading ? (
        <Skeleton className="h-8 w-16 mb-1" />
      ) : (
        <div className="text-2xl font-black text-gray-900 dark:text-white">{value}+</div>
      )}
      <div className="text-[10px] font-bold text-gray-400 dark:text-white/50 uppercase tracking-[0.2em]">{label}</div>
    </div>
  </motion.div>
);

import SocialFeed from '../components/social/SocialFeed';

// Additional imports here if any, then Home component
export default function Home() {
  const { alumni = [], loading: alumniLoading } = useFeaturedAlumni(8);
  const { faculty = [], loading: facultyLoading } = useFeaturedFaculty(6);
  const { images: gallery = [], loading: galleryLoading } = useGalleryImages(12);
  const { jobs = [], loading: jobsLoading } = useLatestJobs(3);
  const { events = [], loading: eventsLoading } = useUpcomingEvents(3);
  const stats = usePlatformStats() || { alumni: 0, jobs: 0, mentors: 0, events: 0, loading: true };

  const { session, isAdmin, isApprovedAlumni, isStudent } = useAuth();

  // Smart CTA destination based on auth state
  const joinDestination = session
    ? isAdmin ? '/dashboard/admin'
      : isApprovedAlumni ? '/dashboard/alumni'
        : isStudent ? '/dashboard/student'
          : '/dashboard'
    : '/signup';

  const [lightboxIndex, setLightboxIndex] = useState(null);

  const galleryRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);

  const scroll = useCallback((direction) => {
    if (!galleryRef.current) return;
    const { scrollLeft, clientWidth } = galleryRef.current;
    const scrollAmount = clientWidth * 0.8;
    galleryRef.current.scrollTo({
      left: direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
      behavior: 'smooth'
    });
  }, []);

  useEffect(() => {
    if (isHovering || galleryLoading) return;
    const interval = setInterval(() => {
      if (!galleryRef.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = galleryRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 10) {
        galleryRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scroll('right');
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [isHovering, galleryLoading, scroll]);

  return (
    <div className="overflow-x-hidden bg-white dark:bg-[#020617] transition-colors duration-300">

      {/* ─── Hero Section ───────────────────────────────────────────────── */}
      <section className="relative w-full overflow-hidden flex flex-col justify-center" style={{ minHeight: '95vh' }}>

        {/* Full-bleed background */}
        <div className="absolute inset-0 z-0">
          <OptimizedImage
            src={HERO_IMAGE}
            fallbackSrc={FALLBACKS.hero}
            alt="HKBK Campus"
            lazy={false}
            showSkeleton={false}
            wrapperClassName="w-full h-full"
            objectPosition={HERO_FOCAL_POINT}
            kenBurns
          />
          {/* Subtle Right-side vignette — cleaner, less dark, purely for text readability */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to left, rgba(2,6,23,0.7) 0%, rgba(2,6,23,0.3) 40%, transparent 100%)'
            }}
          />
          {/* Thin top bar for navbar readability */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
        </div>


        {/* Content — RIGHT side floating elegant card */}
        <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-8 lg:px-16 flex justify-end">

          {/* Compact Glassmorphism content card */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[420px] relative
              bg-slate-900/40 dark:bg-black/40 
              backdrop-blur-2xl saturate-150
              border border-white/10
              rounded-3xl p-8 mt-16 lg:mt-0
              shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
          >
            {/* Subtle premium border glow */}
            <div className="absolute inset-0 rounded-3xl border border-white/20 mix-blend-overlay pointer-events-none" />
            
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="space-y-5 relative z-10"
            >
              {/* Headline */}
              <motion.h1
                variants={fadeIn}
                className="text-4xl md:text-[2.75rem] font-black text-white leading-[1.05] tracking-tight"
              >
                Connect.<br />
                Inspire.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-pink-400">
                  Succeed.
                </span>
              </motion.h1>

              {/* Subline */}
              <motion.p variants={fadeIn} className="text-sm text-white/70 leading-relaxed font-medium">
                Join HKBK CE Connect — bridge generations, unlock mentorship,
                and tap into a global network of graduates.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div variants={fadeIn} className="flex flex-col gap-3 pt-2">
                <Link
                  to={joinDestination}
                  aria-label={session ? 'Go to your dashboard' : 'Create a free account'}
                  className="group inline-flex items-center justify-center gap-2.5 px-6 py-3.5
                    bg-white text-slate-900 font-black rounded-xl text-sm w-full
                    hover:scale-[1.02] hover:shadow-xl hover:shadow-white/20
                    active:scale-[0.98] transition-all duration-300
                    shadow-lg shadow-black/20 cursor-pointer select-none"
                >
                  {session ? 'My Dashboard' : 'Join Today'}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
                </Link>
                <Link
                  to="/directory"
                  aria-label="Browse the alumni directory"
                  className="group inline-flex items-center justify-center gap-2 px-6 py-3.5
                    bg-white/5 text-white font-black rounded-xl text-sm w-full
                    border border-white/10
                    hover:bg-white/10 hover:border-white/30 hover:scale-[1.02]
                    active:scale-[0.98] transition-all duration-300
                    cursor-pointer select-none"
                >
                  Alumni Directory
                  <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 group-hover:opacity-100 transition-all duration-300" />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

        {/* Ultra-minimal bottom transition */}
        <div className="absolute bottom-0 left-0 right-0 h-12
          bg-gradient-to-t from-white dark:from-[#020617] to-transparent
          z-10 pointer-events-none" />
      </section>

      {/* ─── Separated Stats Strip Below Hero ─────────────────────────────── */}
      <section className="relative z-20 -mt-10 sm:-mt-14 mb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 pointer-events-auto"
        >
          {[
            { icon: Users, label: 'Alumni', value: stats.alumni },
            { icon: Briefcase, label: 'Jobs', value: stats.jobs },
            { icon: GraduationCap, label: 'Mentors', value: stats.mentors },
            { icon: Calendar, label: 'Events', value: stats.events },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-2xl p-5 flex items-center gap-4 shadow-xl shadow-black/5 group hover:-translate-y-1 transition-transform duration-300">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-white/10 flex items-center justify-center
                group-hover:bg-blue-100 dark:group-hover:bg-blue-500/20 transition-colors duration-300 shrink-0">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                {stats.loading
                  ? <div className="h-5 w-10 bg-gray-200 dark:bg-white/10 rounded animate-pulse mb-1" />
                  : <p className="text-2xl font-black text-gray-900 dark:text-white leading-none">{value}+</p>
                }
                <p className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-widest mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ─── Affiliations Section ───────────────────────────────────────────── */}
      <Affiliations />

      {/* ─── Social Media Feed ──────────────────────────────────────────────── */}
      <SocialFeed />

      {/* ─── About HKBK Section (New) ───────────────────────────────────────── */}
      <section className="py-32 relative overflow-hidden bg-white dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative group w-full max-w-[640px] mx-auto lg:mx-0">
                {/* Dynamic Image Color Glow */}
                <div className="absolute -inset-4 z-0 blur-3xl opacity-40 dark:opacity-30 group-hover:opacity-70 transition-opacity duration-1000 saturate-200 pointer-events-none translate-y-4">
                  <img 
                    src={ABOUT_IMAGE || FALLBACKS.campus} 
                    alt="" 
                    aria-hidden="true" 
                    className="w-full h-full object-cover rounded-[3rem] mix-blend-normal dark:mix-blend-lighten" 
                  />
                </div>

                {/* Main Adaptive Image Card */}
                <div className="relative z-10 w-full rounded-[2rem] lg:rounded-[3rem] overflow-hidden bg-white/5 backdrop-blur-sm border border-black/5 dark:border-white/10 shadow-2xl transition-all duration-700 ease-out group-hover:scale-[1.02] group-hover:-translate-y-2">
                  <OptimizedImage
                    src={ABOUT_IMAGE}
                    fallbackSrc={FALLBACKS.campus}
                    alt="College Excellence"
                    wrapperClassName="w-full flex justify-center items-center"
                    className="w-full h-auto max-h-[720px] object-contain"
                  />
                  
                  {/* Subtle inner premium frame */}
                  <div className="absolute inset-0 rounded-[2rem] lg:rounded-[3rem] border border-white/60 dark:border-white/20 mix-blend-overlay pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 space-y-10">
              <div className="space-y-4">
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-tight">
                  A Legacy of <span className="text-blue-600 dark:text-blue-400">Academic Excellence.</span>
                </h2>
                <div className="w-20 h-1.5 bg-blue-600 rounded-full" />
              </div>

              <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed font-medium">
                Established in 1997, HKBK Group of Institutions has been at the forefront of providing quality education in Bengaluru. Our alumni are leaders in Fortune 500 companies and founders of successful startups worldwide.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { icon: Trophy, title: "NAAC A+ Accredited", desc: "Highest standards of education" },
                  { icon: Target, title: "Industry Aligned", desc: "Curriculum designed for success" },
                  { icon: CheckCircle2, title: "Global Network", desc: "10,000+ active alumni" },
                  { icon: Award, title: "Award Winning", desc: "Consistently ranked top-tier" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Alumni Spotlight ──────────────────────────────────────────────── */}
      <section className="py-32 bg-gray-50/50 dark:bg-slate-900/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">Alumni Spotlight</h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl mx-auto text-lg font-medium">
              Hear from our global network of graduates making an impact across industries.
            </p>
          </div>

          {alumniLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 rounded-[2.5rem]" />)}
            </div>
          ) : (
            <Carousel
              items={alumni}
              renderItem={(person) => (
                <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700/50 p-8 rounded-[2.5rem] h-full flex flex-col items-center text-center group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 relative">
                  <Quote className="absolute top-8 left-8 w-12 h-12 text-blue-500/10" />
                  <div className="w-24 h-24 rounded-full p-1 border-2 border-blue-500/30 mb-6 group-hover:scale-110 transition-transform duration-500">
                    <img
                      src={person?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(person?.full_name || 'User')}&background=0D8ABC&color=fff`}
                      alt={person?.full_name || 'Alumni'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{person?.full_name || 'Alumni'}</h3>
                  <p className="text-sm font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">
                    {person?.job_title || 'Professional'} @ {person?.company || 'Organization'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-4 italic font-medium">
                    "{person?.bio || `Passionate about ${person?.course_name || 'Engineering'} and giving back to the HKBK community. The network here is unmatched.`}"
                  </p>
                </div>
              )}
            />
          )}
        </div>
      </section>

      {/* ─── LinkedIn Feed ──────────────────────────────────────────────────── */}
      <LinkedInFeedSection />

      {/* ─── Campus Life Auto Slider ─────────────────────────────────────── */}
      <section
        className="py-28 relative overflow-hidden"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          {/* Section header */}
          <motion.div
            initial="hidden" whileInView="visible" variants={fadeIn} viewport={{ once: true }}
            className="flex flex-col md:flex-row justify-between items-end gap-6 mb-14"
          >
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" /> Campus Life
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">Our Campus</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-xl text-lg font-medium">
                Glimpses of our vibrant campus, state-of-the-art labs, and memorable events.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => scroll('left')}
                className="w-12 h-12 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-90">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button onClick={() => scroll('right')}
                className="w-12 h-12 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-90">
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Infinite slider track — full width, no max-w */}
        {galleryLoading ? (
          <div className="flex gap-5 px-4 overflow-hidden">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="w-72 md:w-96 h-[440px] rounded-[2rem] shrink-0" />)}
          </div>
        ) : (
          <div
            ref={galleryRef}
            className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scroll-smooth px-4 sm:px-6 lg:px-8"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Render gallery twice for seamless infinite feel */}
            {[...(gallery ?? []), ...(gallery ?? [])].map((img, idx) => (
              <motion.div
                key={`${img.id}-${idx}`}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="min-w-[280px] md:min-w-[380px] h-[460px] rounded-[2.5rem] overflow-hidden group relative cursor-pointer snap-start flex-shrink-0 shadow-2xl shadow-black/10"
                onClick={() => setLightboxIndex(idx % (gallery?.length || 1))}
              >
                <img
                  src={img?.image_url}
                  alt={img?.title || 'Campus'}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  onError={e => { e.target.style.display = 'none'; }}
                />
                {/* Always-visible subtle gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                {/* Category chip */}
                <div className="absolute top-5 left-5">
                  <span className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider border border-white/20">
                    {img?.category || 'Campus'}
                  </span>
                </div>
                {/* Title — always visible */}
                <div className="absolute bottom-0 left-0 right-0 p-7">
                  <h4 className="text-xl font-black text-white leading-snug drop-shadow-lg">{img?.title || 'HKBK Moment'}</h4>
                  <div className="flex items-center gap-2 mt-3 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-400">
                    <span className="text-xs font-bold text-white/80">Click to view</span>
                    <ChevronRight className="w-4 h-4 text-white/80" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Lightbox */}
        <Lightbox
          images={gallery}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onPrev={() => setLightboxIndex(prev => (prev === 0 ? (gallery?.length || 1) - 1 : prev - 1))}
          onNext={() => setLightboxIndex(prev => (prev === (gallery?.length || 1) - 1 ? 0 : prev + 1))}
        />
      </section>

      {/* ─── Faculty & Mentors ─────────────────────────────────────────────── */}
      <section className="py-32 bg-slate-900 text-white rounded-[4rem] mx-4 my-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
            <div className="lg:sticky lg:top-32 h-fit space-y-10">
              <div className="w-20 h-2 bg-blue-600 rounded-full" />
              <h2 className="text-5xl font-black leading-tight tracking-tight">Meet Our <br /> <span className="text-blue-500">Expert Faculty.</span></h2>
              <p className="text-white/50 text-xl font-medium">
                Expert guidance from experienced professionals and dedicated academicians.
              </p>
              <Link to="/mentorship" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-950 font-black rounded-2xl hover:scale-105 transition-transform shadow-2xl shadow-blue-500/20 uppercase text-xs tracking-widest">
                Find a Mentor <ArrowRight className="w-5 h-5" />
              </Link>
            </div>

            <div className="lg:col-span-2">
              {facultyLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64 rounded-[2.5rem] opacity-20" />)}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {faculty?.map((member, i) => (
                    <motion.div
                      key={member.id}
                      initial="hidden"
                      whileInView="visible"
                      variants={fadeIn}
                      custom={i}
                      viewport={{ once: true }}
                      className="group relative p-[1px] bg-gradient-to-b from-white/20 to-white/5 dark:from-white/10 dark:to-white/0 rounded-[3rem] hover:-translate-y-2 transition-all duration-500 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-blue-500/10"
                    >
                      <div className="bg-white/10 dark:bg-slate-900/40 backdrop-blur-md p-10 rounded-[3rem] h-full flex flex-col items-center text-center">
                        <div className="relative mb-8 pt-4">
                          {/* Premium Faculty Avatar */}
                          <FacultyAvatar 
                            src={member?.image_url} 
                            name={member?.name} 
                            className="w-40 h-40" 
                            imagePosition="center 15%" 
                          />
                          
                          {member?.is_featured && (
                            <div className="absolute top-0 right-0 -mr-2 bg-gradient-to-tr from-yellow-400 to-orange-500 text-slate-950 p-2.5 rounded-2xl shadow-2xl animate-pulse">
                              <Award className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <h3 className="text-2xl font-black mb-2 tracking-tight text-white">{member?.name || 'Faculty Member'}</h3>
                        <p className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-3">{member?.role || 'Professor'}</p>
                        <p className="text-white/60 text-sm font-medium mb-8 leading-relaxed">{member?.department || 'Department of Engineering'}</p>
                        <div className="mt-auto flex flex-wrap justify-center gap-2">
                          <span className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest">
                            {member?.role?.includes('HOD') ? 'Leadership' : 'Faculty'}
                          </span>
                          {member?.is_featured && (
                            <span className="px-4 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-black uppercase tracking-widest">
                              Mentor
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Contact Section ───────────────────────────────────────────────── */}
      <section className="py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-blue-600 rounded-[4rem] overflow-hidden relative shadow-2xl shadow-blue-500/20">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_2px_2px,_white_1px,_transparent_0)] bg-[size:40px_40px]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="p-16 md:p-24 space-y-12 relative z-10">
                <div className="space-y-6">
                  <h2 className="text-5xl font-black text-white tracking-tight leading-none">Let's stay in touch.</h2>
                  <p className="text-blue-100 text-xl font-medium max-w-md leading-relaxed">
                    Have questions about the alumni network or need support? Our team is here to help.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-6 group">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-all duration-500">
                      <MapPin className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-white font-black text-xl tracking-tight">Visit Us</p>
                      <p className="text-blue-100/70 font-medium">HKBK Campus, Manyata Tech Park Road, Bengaluru</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 group">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white group-hover:bg-white group-hover:text-blue-600 transition-all duration-500">
                      <Mail className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-white font-black text-xl tracking-tight">Email Us</p>
                      <p className="text-blue-100/70 font-medium">alumni@hkbk.edu.in</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <Link to="/contact" className="px-12 py-6 bg-white text-blue-600 font-black rounded-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all inline-flex items-center gap-3 uppercase text-xs tracking-widest">
                    Send a Message <MessageSquare className="w-5 h-5" />
                  </Link>
                </div>
              </div>

              <div className="relative min-h-[500px] hidden lg:block">
                <OptimizedImage
                  src={CONTACT_IMAGE}
                  fallbackSrc={FALLBACKS.contact}
                  alt="Contact HKBK"
                  wrapperClassName="absolute inset-0 w-full h-full"
                />
                <div className="absolute inset-0 bg-blue-600/20 mix-blend-multiply" />
              </div>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
