import { Mail, MapPin, Phone, Clock, MessageSquare, Zap } from 'lucide-react';

export default function SupportCards() {
  const cards = [
    {
      icon: Zap,
      label: 'Fast Support',
      desc: 'Average response under 2 hours',
      color: 'blue'
    },
    {
      icon: Mail,
      label: 'Email Us',
      desc: 'support@hkbk.edu.in',
      link: 'mailto:support@hkbk.edu.in',
      color: 'indigo'
    },
    {
      icon: Phone,
      label: 'Call / WhatsApp',
      desc: '+91 80 2544 1722',
      link: 'tel:+918025441722',
      color: 'purple'
    },
    {
      icon: Clock,
      label: 'Office Hours',
      desc: 'Mon-Fri, 9:00 AM - 5:00 PM',
      color: 'emerald'
    },
    {
      icon: MapPin,
      label: 'Campus Address',
      desc: 'Nagawara, Bengaluru 560045',
      color: 'orange'
    }
  ];

  const colorMap = {
    blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-500 group-hover:text-white',
    indigo: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white',
    purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-500 group-hover:text-white',
    emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white',
    orange: 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 group-hover:bg-orange-500 group-hover:text-white',
  };

  return (
    <div className="space-y-6">
      {/* Quick Help Card (Glassmorphism) */}
      <div className="relative overflow-hidden rounded-3xl p-8 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl border border-gray-200/50 dark:border-slate-700/50 shadow-xl shadow-blue-500/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-bl-full -z-10" />
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-blue-500" /> Need urgent help?
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-6">
          For critical issues like account recovery or verification, please use our priority email channel.
        </p>
        <a href="mailto:urgent@hkbk.edu.in" className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:scale-105 transition-transform text-sm shadow-md">
          Priority Support →
        </a>
      </div>

      {/* Support Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {cards.map((card, i) => (
          <div key={i} className={`group p-5 rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-600 hover:shadow-lg transition-all duration-300 ${i === 0 ? 'sm:col-span-2 flex flex-row items-center gap-4' : 'flex flex-col'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 shrink-0 ${colorMap[card.color]} ${i === 0 ? '' : 'mb-4'}`}>
              <card.icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{card.label}</h4>
              {card.link ? (
                <a href={card.link} className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate font-medium">
                  {card.desc}
                </a>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{card.desc}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
