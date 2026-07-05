import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bot, MessageCircle, BarChart3, Shield, ArrowRight,
  Sparkles, Globe, Network, Zap,
} from 'lucide-react';
import { useScrollReveal } from '../lib/useScrollReveal';
import { useCountUp } from '../lib/useCountUp';

// ponytail: features split into primary (showcase) and secondary (compact) to dodge identical-card-grid ban
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

// ponytail: no numbered markers (01/02/03) — real sequential flow earns visual ordering via layout, not numbers
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
    <div className="font-arabic text-3xl md:text-4xl font-bold text-terracotta-500/40 mb-6 leading-normal tracking-wide min-h-[2.5rem]">
      <span key={i} className="rotate-text inline-block">{heroPhrases[i].ar}</span>
    </div>
  );
}

function StatCard({ label, target, suffix, change, up, revealed }: { label: string; target: number; suffix: string; change: string; up: boolean; revealed: boolean }) {
  const count = useCountUp(target, 1000, revealed);
  return (
    <div className="text-center p-3 rounded-lg bg-sand-50">
      <p className="font-body text-xs text-ash-400 mb-1">{label}</p>
      <p className="font-display text-2xl font-semibold text-navy-900">{count}{suffix}</p>
      <span className={`font-body text-xs ${up ? 'text-success-500' : 'text-terracotta-600'}`}>{change}</span>
    </div>
  );
}

export default function Landing() {
  const { ref: featuresRef, revealed: featuresRevealed } = useScrollReveal<HTMLDivElement>(0.1);
  const { ref: stepsRef, revealed: stepsRevealed } = useScrollReveal<HTMLDivElement>(0.1);
  const { ref: statsRef, revealed: statsRevealed } = useScrollReveal<HTMLDivElement>(0.2);
  const { ref: ctaRef, revealed: ctaRevealed } = useScrollReveal<HTMLDivElement>(0.2);
  const { ref: brandRef, revealed: brandRevealed } = useScrollReveal<HTMLDivElement>(0.2);

  return (
    <div className="min-h-screen bg-bg-warm noise-overlay">
      <div className="orb orb-amber w-[400px] h-[400px] -top-32 -right-32 animate-float-slow" />
      <div className="orb orb-gold w-[300px] h-[300px] top-1/2 -left-40 animate-float" />
      <div className="orb orb-amber w-[200px] h-[200px] bottom-0 right-1/4 animate-orb" />

      {/* ── Dot grid overlay (hero only) ── */}
      <div className="shape-grid opacity-60" />

      <header className="sticky top-0 z-50 border-b border-sand-200/60 bg-bg-warm/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center overflow-hidden transition-transform duration-200 group-hover:scale-105">
              <img src="/logo.svg" alt="ArabBot" className="w-6 h-6 object-contain" />
            </div>
            <span className="font-display text-lg font-semibold text-navy-900">ArabBot</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-secondary text-sm px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn btn-primary text-sm px-4 py-2 group">
              <span className="flex items-center gap-1.5">
                Get Started <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        {/* Modern shapes */}
        <div className="shape-ring w-16 h-16 top-20 left-[12%] text-terracotta-600/30 animate-float" style={{ animationDelay: '0.5s', animationDuration: '7s' }} />
        <div className="shape-ring w-8 h-8 top-40 right-[15%] text-gold-600/25 animate-float" style={{ animationDelay: '1.2s', animationDuration: '5s' }} />
        <div className="shape-dot w-2 h-2 top-32 right-[30%] bg-terracotta-400/40 animate-orb" />
        <div className="shape-dot w-1.5 h-1.5 bottom-24 left-[20%] bg-gold-400/45 animate-orb" style={{ animationDelay: '0.8s' }} />
        <div className="shape-cross w-6 h-6 top-1/3 left-[8%] text-terracotta-600/20 animate-float-slow" style={{ animationDelay: '0.3s' }} />
        <div className="shape-cross w-4 h-4 bottom-32 right-[10%] text-gold-600/20 animate-float" style={{ animationDelay: '1.8s' }} />
        <div className="shape-corner shape-corner-tl w-16 h-16 top-[15%] right-[22%] text-terracotta-600/35" />
        <div className="shape-corner shape-corner-br w-12 h-12 bottom-[20%] left-[15%] text-gold-600/35" />
        <div className="shape-dash w-20 top-[45%] left-[5%] bg-gradient-to-r from-terracotta-300/0 via-terracotta-300/40 to-terracotta-300/0 animate-float-slow" style={{ animationDelay: '0.6s' }} />
        <div className="shape-dash w-16 bottom-[35%] right-[8%] bg-gradient-to-r from-gold-400/0 via-gold-400/40 to-gold-400/0 animate-float" style={{ animationDelay: '1.4s' }} />

        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-50 border border-terracotta-200/50 text-terracotta-600 text-xs font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5" /> <span className="font-arabic">بوتات واتساب بالذكاء الاصطناعي</span> <span className="text-ash-300 mx-1">·</span> AI-Powered Platform
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-navy-900 leading-[1.05] mb-6 text-balance">
            Build WhatsApp bots<br />
            <span className="text-terracotta-500">that speak your language</span>
          </h1>
          <HeroRotator />
          <p className="font-body text-lg text-ash-500 max-w-2xl mx-auto leading-relaxed mb-10">
            ArabBot Studio lets you create intelligent WhatsApp bots for your business —
            with AI that understands Arabic, seamless human handoff, and real-time analytics.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/register" className="btn btn-primary px-6 py-3 text-base group">
              <span className="flex items-center gap-2">
                Create Your Free Bot <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
              </span>
            </Link>
            <Link to="/login" className="btn btn-secondary px-6 py-3 text-base">Sign In</Link>
          </div>
        </div>
      </section>

      {/* ── Features — varied layout to avoid identical card grid ── */}
      <section className="py-28 px-6 relative" ref={featuresRef}>
        <div className="orb orb-gold w-[250px] h-[250px] -top-20 left-1/4 animate-float pointer-events-none" />
        <div className="shape-ring w-24 h-24 top-1/4 right-[5%] text-terracotta-500/25 animate-float-slow" style={{ animationDelay: '0.7s' }} />
        <div className="shape-dot w-3 h-3 top-[15%] left-[40%] bg-gold-400/40 animate-orb" style={{ animationDelay: '1s' }} />
        <div className="shape-ring w-6 h-6 bottom-1/3 left-[6%] text-terracotta-600/30 animate-float" style={{ animationDelay: '0.4s', animationDuration: '6s' }} />
        <div className="shape-corner shape-corner-tl w-14 h-14 top-[10%] left-[55%] text-terracotta-500/20" />
        <div className="shape-corner shape-corner-br w-10 h-10 bottom-[15%] right-[35%] text-gold-600/20" />
        <div className="shape-dash w-32 top-[60%] left-[3%] bg-gradient-to-r from-terracotta-300/0 via-terracotta-300/35 to-terracotta-300/0 animate-float" style={{ animationDelay: '0.8s', animationDuration: '7s' }} />
        <div className="shape-dash w-24 top-[30%] right-[4%] bg-gradient-to-r from-gold-400/0 via-gold-400/35 to-gold-400/0 animate-float-slow" style={{ animationDelay: '1.1s' }} />
        <div className="shape-dot w-1.5 h-1.5 top-[70%] right-[10%] bg-terracotta-400/40 animate-orb" style={{ animationDelay: '0.3s' }} />
        <div className="shape-dot w-2 h-2 top-[20%] left-[50%] bg-gold-400/40 animate-orb" style={{ animationDelay: '1.5s' }} />
        <div className="max-w-6xl mx-auto relative">
          <div className={`text-center mb-16 transition-all duration-700 ${featuresRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-navy-900 mb-4">Everything you need</h2>
            <p className="font-arabic text-lg text-navy-400 mb-3 leading-relaxed tracking-wide">كل ما تحتاجه في لوحة تحكم واحدة</p>
            <p className="font-body text-ash-500 max-w-xl mx-auto">From bot creation to deployment and monitoring — all in one dashboard.</p>
          </div>

          {/* Primary features — showcase layout (taller, more detail) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {primaryFeatures.map(({ icon: Icon, title, titleAr, desc, detail }, i) => (
              <div
                key={title}
                className={`card-hover p-8 rounded-xl bg-bg-card border border-sand-200 transition-all duration-700 ease-out ${featuresRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${0.1 + i * 0.1}s` }}
              >
                <div className="w-11 h-11 rounded-xl bg-terracotta-500/10 flex items-center justify-center mb-5">
                  <Icon className="w-[1.375rem] h-[1.375rem] text-terracotta-500" />
                </div>
                <h3 className="font-display text-lg font-semibold text-navy-900 mb-1">{title}</h3>
                <p className="font-arabic text-sm text-navy-400 tracking-wide mb-3" dir="rtl">{titleAr}</p>
                <p className="font-body text-sm text-ash-500 leading-relaxed mb-3">{desc}</p>
                <p className="font-body text-sm text-ash-400 leading-relaxed border-t border-sand-100 pt-3">{detail}</p>
              </div>
            ))}
          </div>

          {/* Secondary features — compact cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {secondaryFeatures.map(({ icon: Icon, title, titleAr, desc }, i) => (
              <div
                key={title}
                className={`card p-5 flex items-start gap-4 transition-all duration-700 ease-out ${featuresRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${0.3 + i * 0.1}s` }}
              >
                <div className="w-9 h-9 rounded-lg bg-terracotta-500/10 flex items-center justify-center shrink-0">
                  <Icon className="w-[1.125rem] h-[1.125rem] text-terracotta-500" />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold text-navy-900 mb-0.5">{title}</h3>
                  <p className="font-arabic text-xs text-navy-400 tracking-wide mb-1" dir="rtl">{titleAr}</p>
                  <p className="font-body text-sm text-ash-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Process — no numbered markers, no uppercase eyebrow ── */}
      <section className="py-28 px-6 bg-navy-900 relative overflow-hidden">
        <div className="absolute inset-0 grain-bg" />
        <div className="orb orb-terracotta w-[400px] h-[400px] -bottom-40 -right-40 animate-float-slow pointer-events-none" />
        {/* Dark mode shapes */}
        <div className="shape-ring w-32 h-32 top-1/4 left-[3%] text-terracotta-700/20 animate-float-slow" style={{ animationDelay: '1s' }} />
        <div className="shape-dot w-2 h-2 top-[60%] right-[25%] bg-terracotta-400/40 animate-orb" style={{ animationDelay: '0.5s' }} />
        <div className="shape-cross w-8 h-8 bottom-1/4 right-[8%] text-terracotta-600/30 animate-float" style={{ animationDelay: '1.5s', animationDuration: '8s' }} />
        <div className="shape-dot w-1.5 h-1.5 top-[20%] right-[40%] bg-gold-400/35 animate-orb" style={{ animationDelay: '1.2s' }} />
        <div className="shape-corner shape-corner-tl w-20 h-20 top-[8%] right-[10%] text-terracotta-700/20" />
        <div className="shape-corner shape-corner-br w-16 h-16 bottom-[10%] left-[12%] text-gold-600/25" />
        <div className="shape-dash w-40 top-[55%] left-[2%] bg-gradient-to-r from-terracotta-400/0 via-terracotta-400/30 to-terracotta-400/0 animate-float" style={{ animationDelay: '0.5s' }} />
        <div className="shape-dash w-32 top-[25%] right-[3%] bg-gradient-to-r from-gold-400/0 via-gold-400/30 to-gold-400/0 animate-float-slow" style={{ animationDelay: '1.8s' }} />
        <div className="shape-ring w-10 h-10 top-[65%] left-[8%] text-terracotta-500/35 animate-orb" style={{ animationDelay: '0.9s' }} />
        <div className="shape-dot w-1.5 h-1.5 bottom-[30%] right-[20%] bg-terracotta-400/40 animate-float" style={{ animationDelay: '0.2s' }} />
        <div className="max-w-4xl mx-auto relative" ref={stepsRef}>
          <div className={`text-center mb-16 transition-all duration-700 ${stepsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-sand-50 mb-4">How it works</h2>
            <p className="font-arabic text-lg text-terracotta-400 mb-3 leading-relaxed tracking-wide">شغّل بوتك في ٣ خطوات بسيطة</p>
            <p className="font-body text-ash-400 max-w-xl mx-auto">Three steps from setup to live — no fuss, no delay.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {steps.map(({ icon: Icon, title, titleAr, desc }, i) => (
              <div
                key={title}
                className={`text-center p-6 rounded-xl transition-all duration-700 ease-out ${stepsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                style={{ transitionDelay: `${0.15 + i * 0.12}s` }}
              >
                <div className="relative mb-5 flex justify-center">
                  <div className="w-14 h-14 rounded-xl bg-terracotta-500/15 border border-terracotta-500/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-terracotta-400" />
                  </div>
                  {/* ponytail: connector line between steps, pure css via the step index */}
                  {i < steps.length - 1 && (
                    <div className="hidden md:block absolute top-7 left-[calc(50%+3.5rem)] w-[calc(100%-7rem)] h-px bg-terracotta-500/20" />
                  )}
                </div>
                <h3 className="font-display text-lg font-semibold text-sand-50 mb-1">{title}</h3>
                <p className="font-arabic text-sm text-terracotta-600/70 mb-2" dir="rtl">{titleAr}</p>
                <p className="font-body text-sm text-ash-400 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Insights — reframed away from hero-metric ── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="orb orb-gold w-[250px] h-[250px] top-1/3 right-0 animate-orb pointer-events-none" />
        <div className="shape-ring w-12 h-12 top-[30%] left-[8%] text-gold-600/25 animate-float" style={{ animationDelay: '0.6s', animationDuration: '7s' }} />
        <div className="shape-dot w-2.5 h-2.5 bottom-1/4 left-[35%] bg-terracotta-300/40 animate-orb" style={{ animationDelay: '0.9s' }} />
        <div className="shape-cross w-5 h-5 top-[20%] right-[12%] text-terracotta-600/35 animate-float-slow" style={{ animationDelay: '1.3s' }} />
        <div className="shape-corner shape-corner-tl w-12 h-12 top-[40%] left-[4%] text-terracotta-500/20" />
        <div className="shape-corner shape-corner-br w-10 h-10 bottom-[20%] right-[6%] text-gold-600/35" />
        <div className="shape-dash w-24 top-[15%] left-[20%] bg-gradient-to-r from-terracotta-300/0 via-terracotta-300/35 to-terracotta-300/0 animate-float" style={{ animationDelay: '0.3s', animationDuration: '6s' }} />
        <div className="shape-dash w-20 bottom-[30%] right-[12%] bg-gradient-to-r from-gold-400/0 via-gold-400/30 to-gold-400/0 animate-float-slow" style={{ animationDelay: '1.6s' }} />
        <div className="shape-dot w-2 h-2 top-[60%] left-[20%] bg-terracotta-300/40 animate-orb" style={{ animationDelay: '0.4s' }} />
        <div className="max-w-4xl mx-auto text-center relative" ref={statsRef}>
          <div className={`transition-all duration-700 ${statsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-navy-900 mb-4">Real-time insights at a glance</h2>
            <p className="font-arabic text-lg text-navy-400 mb-3 leading-relaxed tracking-wide">تحليلات فورية لفهم أداء بوتك</p>
            <p className="font-body text-lg text-ash-500 max-w-xl mx-auto mb-10">
              Monitor conversation volume, track intent trends, and measure bot performance with beautiful charts and analytics.
            </p>
          </div>
          <div className={`card p-10 max-w-2xl mx-auto relative overflow-hidden transition-all duration-700 delay-200 ${statsRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <div className="absolute top-0 right-0 w-48 h-48 bg-terracotta-500/5 rounded-bl-full pointer-events-none" />
            <div className="text-left mb-8">
              <p className="font-display text-xs font-semibold text-ash-400 tracking-widest uppercase mb-1">Platform Reach</p>
              <p className="font-body text-sm text-ash-500">Businesses trust ArabBot Studio for their WhatsApp automation.</p>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              {stats.map((stat) => (
                <StatCard key={stat.label} {...stat} revealed={statsRevealed} />
              ))}
            </div>
            <div className="flex items-end justify-center gap-2 h-20 mb-3">
              {[35, 52, 48, 70, 65, 85, 72, 90, 78, 60, 55, 42].map((h, i) => (
                <div
                  key={i}
                  className={`w-5 rounded-t-sm transition-all duration-500 hover:scale-110 ${statsRevealed ? 'scale-y-100' : 'scale-y-0'}`}
                  style={{ height: `${h}%`, background: i === 7 ? 'var(--color-terracotta-500)' : 'var(--color-terracotta-300)', transformOrigin: 'bottom', transitionDelay: `${i * 0.05}s` }}
                />
              ))}
            </div>
            <p className="font-body text-xs text-ash-400 text-center">Last 12 days — message volume</p>
          </div>
        </div>
      </section>

      {/* ── Brand Statement — concluding flourish ── */}
      <section className="py-20 px-6 relative overflow-hidden" ref={brandRef}>
        <div className="shape-ring w-40 h-40 -top-20 -left-20 text-terracotta-500/20 animate-float-slow" style={{ animationDelay: '0.2s' }} />
        <div className="shape-ring w-20 h-20 bottom-1/4 right-[10%] text-gold-600/20 animate-float" style={{ animationDelay: '1s', animationDuration: '6s' }} />
        <div className="shape-dot w-3 h-3 top-[25%] right-[30%] bg-terracotta-400/35 animate-orb" style={{ animationDelay: '0.7s' }} />
        <div className="shape-cross w-6 h-6 bottom-1/3 left-[12%] text-terracotta-600/20 animate-float" style={{ animationDelay: '1.5s' }} />
        <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${brandRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
          <div className="w-12 h-0.5 bg-terracotta-500/30 mx-auto mb-8" />
          <p className="font-arabic text-4xl md:text-5xl font-bold text-navy-900/10 leading-[1.2] mb-6 select-none" dir="rtl">
            العربية في القلب
          </p>
          <p className="font-display text-2xl md:text-3xl font-bold text-navy-900 leading-snug mb-4 text-balance">
            Arabic at its heart.<br />
            Built for your business.
          </p>
          <p className="font-body text-ash-500 max-w-lg mx-auto leading-relaxed">
            Every feature, every pixel — designed from the ground up for the Arabic-speaking world.
            No afterthoughts. No lost-in-translation moments.
          </p>
          <div className="flex items-center justify-center gap-6 mt-10">
            <div className="flex items-center gap-2 text-ash-400">
              <Zap className="w-4 h-4 text-terracotta-400" />
              <span className="font-body text-xs">Arabic-first by design</span>
            </div>
            <div className="flex items-center gap-2 text-ash-400">
              <Shield className="w-4 h-4 text-terracotta-400" />
              <span className="font-body text-xs">Enterprise-ready</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="pb-28 px-6 relative" ref={ctaRef}>
        <div className="shape-ring w-14 h-14 top-1/4 left-[10%] text-terracotta-600/20 animate-float" style={{ animationDelay: '0.5s', animationDuration: '5s' }} />
        <div className="shape-dot w-2 h-2 top-[60%] right-[20%] bg-gold-400/40 animate-orb" style={{ animationDelay: '1s' }} />
        <div className="shape-corner shape-corner-br w-8 h-8 bottom-[30%] left-[15%] text-terracotta-500/20" />
        <div className={`max-w-3xl mx-auto text-center card p-14 relative overflow-hidden transition-all duration-700 ${ctaRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-terracotta-500/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-gold-400/8 rounded-full pointer-events-none" />
          <div>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-navy-900 mb-4">Ready to build your bot?</h2>
            <p className="font-arabic text-xl text-navy-400 mb-3" dir="rtl">ابدأ مجاناً · أول بوت لك في دقائق</p>
            <p className="font-body text-lg text-ash-500 mb-10 max-w-lg mx-auto">Start for free. No credit card required. Your first bot is minutes away.</p>
            <Link to="/register" className="btn btn-primary px-10 py-4 text-base group inline-flex items-center gap-2">
              Get Started Free <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-sand-200 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-terracotta-500 flex items-center justify-center overflow-hidden">
              <img src="/logo.svg" alt="ArabBot" className="w-4 h-4 object-contain brightness-0 invert" />
            </div>
            <div>
              <span className="font-display text-sm font-semibold text-navy-900">ArabBot Studio</span>
              <p className="font-arabic text-[10px] text-ash-400 tracking-wide" dir="rtl">منصة بوتات واتساب الذكية</p>
            </div>
          </div>
          <p className="font-body text-xs text-ash-400">Copyright tradingcodeco · <span className="font-arabic">جميع الحقوق محفوظة</span></p>
        </div>
      </footer>
    </div>
  );
}
