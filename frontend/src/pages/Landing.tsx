import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import {
  Bot, MessageCircle, BarChart3, Shield, ArrowRight,
  Sparkles, Globe, Network,
} from 'lucide-react';
import { useCountUp } from '../lib/useCountUp';

const primaryFeatures = [
  {
    icon: Bot, title: 'Smart WhatsApp Bots', titleAr: 'بوتات واتساب ذكية',
    desc: 'AI-powered bots that understand Arabic and English, handle orders, answer FAQs, and qualify leads 24/7.',
    detail: 'Understands intent in both Arabic and English, remembers context across sessions, and responds like a seasoned agent.',
  },
  {
    icon: MessageCircle, title: 'Natural Conversations', titleAr: 'محادثات طبيعية',
    desc: 'Powered by Google Gemini. Your bot understands intent, remembers context, and responds like a human agent.',
    detail: 'Gemini-powered understanding that catches nuance, tone, and cultural context — not just keywords.',
  },
];

const secondaryFeatures = [
  { icon: BarChart3, title: 'Analytics & Insights', titleAr: 'تحليلات ورؤى', desc: 'Track conversations, monitor intent trends, and measure bot performance with real-time dashboards.' },
  { icon: Shield, title: 'Human Handoff', titleAr: 'تحويل للبشر', desc: 'Seamlessly escalate to a human agent when the bot needs help. No dropped conversations.' },
];

const stats = [
  { label: 'Conversations', target: 1200, suffix: 'K', change: '+12%', up: true },
  { label: 'Messages', target: 8400, suffix: 'K', change: '+8%', up: true },
  { label: 'Handoffs', target: 24, suffix: '', change: '-3%', up: false },
];

const steps = [
  { icon: Bot, title: 'Create Your Bot', titleAr: 'أنشئ بوتك', desc: 'Set up a bot in minutes. Configure its channel, system prompt, and knowledge base.' },
  { icon: Globe, title: 'Train & Customize', titleAr: 'درّب وخصص', desc: 'Add FAQs, set fallback messages, and define when to hand off to humans.' },
  { icon: Network, title: 'Deploy & Monitor', titleAr: 'انشر وراقب', desc: 'Connect to WhatsApp, go live, and watch your bot handle conversations in real time.' },
];

const heroPhrases = [
  { ar: 'بوتات واتساب ذكية تفهم العربية', en: 'WhatsApp bots that understand Arabic' },
  { ar: 'حلول ذكية لنمو أعمالك', en: 'Smart solutions for your business growth' },
  { ar: 'تواصل طبيعي مع عملائك', en: 'Natural conversations with your customers' },
  { ar: 'أطلق العنان لذكاء واتساب', en: 'Unlock the power of WhatsApp AI' },
];

function HeroRotator() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setI((p) => (p + 1) % heroPhrases.length), 3200);
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="font-arabic text-3xl md:text-4xl font-bold text-terracotta-500/40 mb-6 leading-normal tracking-wide min-h-[2.5rem] relative overflow-hidden">
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.5 }}
      >
        {heroPhrases[i].ar}
      </motion.div>
    </div>
  );
}

function StatCard({ label, target, suffix, change, up }: { label: string; target: number; suffix: string; change: string; up: boolean }) {
  const count = useCountUp(target, 1000, true);
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      className="text-center p-4 rounded-xl bg-white/50 backdrop-blur-sm border border-white/40 shadow-sm"
    >
      <p className="font-body text-xs text-ash-500 mb-1 font-medium tracking-wide uppercase">{label}</p>
      <p className="font-display text-2xl font-bold text-navy-900">{count}{suffix}</p>
      <span className={`font-body text-xs font-semibold ${up ? 'text-success-600' : 'text-terracotta-600'}`}>{change}</span>
    </motion.div>
  );
}

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-warm noise-overlay">
      <div className="orb orb-amber w-[400px] h-[400px] -top-32 -right-32 animate-float-slow" />
      <div className="orb orb-gold w-[300px] h-[300px] top-1/2 -left-40 animate-float" />
      <div className="orb orb-amber w-[200px] h-[200px] bottom-0 right-1/4 animate-orb" />
      <div className="shape-grid opacity-60" />

      <header className="sticky top-0 z-50 border-b border-sand-200/60 bg-bg-warm/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden shadow-sm shadow-terracotta-500/20">
              <img src="/logo.jpg" alt="ArabBot" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-lg font-bold text-navy-900 tracking-tight">ArabBot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="font-medium text-sm text-ash-500 hover:text-navy-900 transition-colors">Sign In</Link>
            <Link to="/register" className="btn btn-primary text-sm px-5 py-2 shadow-sm hover:shadow-md transition-shadow group">
              <span className="flex items-center gap-2">
                Get Started <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative pt-32 pb-24 px-6 overflow-hidden">
        <div className="shape-ring w-16 h-16 top-20 left-[12%] text-terracotta-600/30 animate-float" style={{ animationDelay: '0.5s', animationDuration: '7s' }} />
        <div className="shape-ring w-8 h-8 top-40 right-[15%] text-gold-600/25 animate-float" style={{ animationDelay: '1.2s', animationDuration: '5s' }} />
        <div className="shape-dot w-2 h-2 top-32 right-[30%] bg-terracotta-400/40 animate-orb" />
        
        <motion.div 
          initial="hidden" animate="visible" variants={staggerContainer}
          className="max-w-4xl mx-auto text-center relative z-10"
        >
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white shadow-[0_2px_10px_rgba(0,0,0,0.02)] text-terracotta-600 text-xs font-semibold mb-8">
            <Sparkles className="w-4 h-4 text-terracotta-500" /> 
            <span className="font-arabic tracking-wide pt-0.5">بوتات واتساب بالذكاء الاصطناعي</span> 
            <span className="text-ash-300 mx-1">·</span> AI-Powered Platform
          </motion.div>
          <motion.h1 variants={fadeInUp} className="font-display text-5xl md:text-7xl font-bold text-navy-900 leading-[1.1] mb-6 tracking-tight">
            Build WhatsApp bots<br />
            <span className="text-terracotta-500 bg-clip-text text-transparent bg-gradient-to-r from-terracotta-600 to-terracotta-400">that speak your language</span>
          </motion.h1>
          <motion.div variants={fadeInUp}>
            <HeroRotator />
          </motion.div>
          <motion.p variants={fadeInUp} className="font-body text-lg text-ash-500 max-w-2xl mx-auto leading-relaxed mb-10">
            ArabBot Studio lets you create intelligent WhatsApp bots for your business —
            with AI that understands Arabic, seamless human handoff, and real-time analytics.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn btn-primary px-8 py-3.5 text-base shadow-lg shadow-terracotta-500/20 group">
              <span className="flex items-center gap-2 font-medium">
                Create Your Free Bot <ArrowRight className="w-4.5 h-4.5 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <section className="py-28 px-6 relative">
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-navy-900 mb-4 tracking-tight">Everything you need</h2>
            <p className="font-arabic text-lg text-terracotta-500 mb-3 leading-relaxed tracking-wide font-medium">كل ما تحتاجه في لوحة تحكم واحدة</p>
            <p className="font-body text-ash-500 max-w-xl mx-auto text-lg">From bot creation to deployment and monitoring — all in one powerful dashboard.</p>
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
          >
            {primaryFeatures.map(({ icon: Icon, title, titleAr, desc, detail }) => (
              <motion.div
                key={title}
                variants={fadeInUp}
                whileHover={{ y: -8 }}
                className="card p-8 rounded-2xl bg-white/70 backdrop-blur-lg border border-white shadow-[0_8px_30px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.08)] transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-terracotta-50 to-terracotta-100/50 border border-terracotta-500/10 flex items-center justify-center mb-6 shadow-inner">
                  <Icon className="w-7 h-7 text-terracotta-600" />
                </div>
                <h3 className="font-display text-2xl font-bold text-navy-900 mb-2 tracking-tight">{title}</h3>
                <p className="font-arabic text-sm text-terracotta-600 font-medium tracking-wide mb-4" dir="rtl">{titleAr}</p>
                <p className="font-body text-base text-ash-600 leading-relaxed mb-4">{desc}</p>
                <p className="font-body text-sm text-ash-400 leading-relaxed border-t border-sand-200/60 pt-4">{detail}</p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {secondaryFeatures.map(({ icon: Icon, title, titleAr, desc }) => (
              <motion.div
                key={title}
                variants={fadeInUp}
                whileHover={{ x: 4 }}
                className="card p-6 rounded-2xl bg-white/40 backdrop-blur-md flex items-start gap-5 border border-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-terracotta-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-terracotta-500" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-navy-900 mb-1">{title}</h3>
                  <p className="font-arabic text-xs text-terracotta-600 font-medium tracking-wide mb-2" dir="rtl">{titleAr}</p>
                  <p className="font-body text-sm text-ash-500 leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-28 px-6 bg-navy-900 relative overflow-hidden">
        <div className="absolute inset-0 grain-bg opacity-50" />
        <div className="max-w-5xl mx-auto relative z-10">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}
            className="text-center mb-20"
          >
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">How it works</h2>
            <p className="font-arabic text-lg text-terracotta-400 mb-4 leading-relaxed tracking-wide font-medium">شغّل بوتك في ٣ خطوات بسيطة</p>
            <p className="font-body text-navy-200 max-w-xl mx-auto text-lg">Three steps from setup to live — no fuss, no delay.</p>
          </motion.div>
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-12 relative"
          >
            <div className="hidden md:block absolute top-10 left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-terracotta-500/0 via-terracotta-500/30 to-terracotta-500/0" />
            {steps.map(({ icon: Icon, title, titleAr, desc }, i) => (
              <motion.div key={title} variants={fadeInUp} className="text-center relative z-10 group">
                <div className="relative mb-6 flex justify-center">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="w-20 h-20 rounded-2xl bg-navy-800 border border-terracotta-500/20 shadow-[0_0_30px_rgba(200,100,80,0.1)] flex items-center justify-center transition-colors group-hover:border-terracotta-500/40 group-hover:bg-navy-700"
                  >
                    <Icon className="w-8 h-8 text-terracotta-400" />
                  </motion.div>
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-terracotta-500 text-white font-display font-bold flex items-center justify-center shadow-lg border-2 border-navy-900">
                    {i + 1}
                  </div>
                </div>
                <h3 className="font-display text-xl font-bold text-white mb-2">{title}</h3>
                <p className="font-arabic text-sm text-terracotta-400 mb-3 font-medium" dir="rtl">{titleAr}</p>
                <p className="font-body text-sm text-navy-200 leading-relaxed">{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-28 px-6 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-navy-900 mb-4 tracking-tight">Real-time insights</h2>
            <p className="font-arabic text-lg text-terracotta-600 font-medium mb-4 leading-relaxed tracking-wide">تحليلات فورية لفهم أداء بوتك</p>
            <p className="font-body text-lg text-ash-500 max-w-xl mx-auto mb-12">
              Monitor conversation volume, track intent trends, and measure bot performance with beautiful charts and analytics.
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="card p-10 max-w-2xl mx-auto relative overflow-hidden bg-white/70 backdrop-blur-xl border border-white shadow-[0_20px_60px_rgba(0,0,0,0.05)] rounded-3xl"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-terracotta-500/10 to-transparent rounded-bl-full pointer-events-none" />
            
            <div className="grid grid-cols-3 gap-6 mb-8 relative z-10">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} />
              ))}
            </div>
            
            <div className="flex items-end justify-between gap-2 h-32 mb-4 relative z-10 border-b border-sand-200/50 pb-4">
              {[35, 52, 48, 70, 65, 85, 72, 90, 78, 60, 55, 42].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  whileInView={{ height: `${h}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1, delay: i * 0.05, ease: "easeOut" }}
                  className="w-full rounded-t-md cursor-pointer hover:brightness-110"
                  style={{ background: i === 7 ? 'var(--color-terracotta-500)' : 'var(--color-terracotta-300)' }}
                />
              ))}
            </div>
            <p className="font-body text-xs text-ash-400 text-center font-medium uppercase tracking-wider">Last 12 days message volume</p>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-6 relative overflow-hidden">
        <motion.div 
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
          className="max-w-3xl mx-auto text-center"
        >
          <div className="w-16 h-1 bg-gradient-to-r from-terracotta-400 to-terracotta-600 mx-auto mb-10 rounded-full" />
          <p className="font-arabic text-5xl md:text-6xl font-bold text-navy-900/5 leading-[1.2] mb-8 select-none tracking-tight" dir="rtl">
            العربية في القلب
          </p>
          <p className="font-display text-3xl md:text-4xl font-bold text-navy-900 leading-snug mb-6 tracking-tight">
            Arabic at its heart.<br />
            Built for your business.
          </p>
          <p className="font-body text-lg text-ash-500 max-w-xl mx-auto leading-relaxed">
            Every feature, every pixel — designed from the ground up for the Arabic-speaking world.
            No afterthoughts. No lost-in-translation moments.
          </p>
        </motion.div>
      </section>

      <section className="pb-32 px-6 relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto text-center card p-16 md:p-20 relative overflow-hidden bg-gradient-to-br from-navy-900 to-navy-950 border border-navy-800 shadow-2xl rounded-[3rem]"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gold-400/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Ready to build your bot?</h2>
            <p className="font-arabic text-xl text-terracotta-400 mb-6 font-medium" dir="rtl">ابدأ مجاناً · أول بوت لك في دقائق</p>
            <p className="font-body text-lg text-navy-200 mb-12 max-w-lg mx-auto">Start for free. No credit card required. Your first intelligent agent is minutes away.</p>
            <Link to="/register" className="btn btn-primary px-12 py-5 text-lg font-bold shadow-xl shadow-terracotta-500/30 group inline-flex items-center gap-3 rounded-2xl hover:scale-105 transition-transform">
              Get Started Free <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </motion.div>
      </section>

      <footer className="border-t border-sand-200/60 py-12 px-6 bg-white/50 backdrop-blur-md">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded flex items-center justify-center overflow-hidden">
              <img src="/logo.jpg" alt="ArabBot" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-display text-base font-bold text-navy-900">ArabBot Studio</span>
              <p className="font-arabic text-xs text-ash-500 font-medium" dir="rtl">منصة بوتات واتساب الذكية</p>
            </div>
          </div>
          <p className="font-body text-sm text-ash-500 font-medium">© {new Date().getFullYear()} tradingcodeco · <span className="font-arabic">جميع الحقوق محفوظة</span></p>
        </div>
      </footer>
    </div>
  );
}
