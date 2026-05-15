import ContactHero from '../components/contact/ContactHero';
import SupportCards from '../components/contact/SupportCards';
import ContactForm from '../components/contact/ContactForm';
import FAQSection from '../components/contact/FAQSection';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300 flex flex-col">
      {/* 1. Compact Hero Section */}
      <ContactHero />

      {/* 2. Main Content Grid */}
      <div className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          
          {/* Left Column: Support Info & Cards */}
          <div className="lg:col-span-5 flex flex-col gap-8">
            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">How can we help?</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Choose the best way to reach us based on your needs. Our dedicated teams are ready to assist you.
              </p>
            </div>
            
            <SupportCards />
          </div>

          {/* Right Column: Premium Contact Form */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

        </div>

        {/* 3. FAQ Mini Section */}
        <div className="mt-16 border-t border-gray-200 dark:border-slate-800 pt-8">
          <FAQSection />
        </div>
      </div>
    </div>
  );
}
