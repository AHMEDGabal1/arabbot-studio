import { Link } from 'react-router-dom';
import { Bot, MessageCircle, BarChart3, Shield, ArrowRight, Sparkles, Workflow, Globe, Network, LineChart } from 'lucide-react';

const features = [
  { icon: Bot, title: 'Smart WhatsApp Bots', desc: 'AI-powered bots that understand Arabic and English, handle orders, answer FAQs, and qualify leads 24/7.' },
  { icon: MessageCircle, title: 'Natural Conversations', desc: 'Powered by Google Gemini. Your bot understands intent, remembers context, and responds like a human agent.' },
  { icon: BarChart3, title: 'Analytics & Insights', desc: 'Track conversations, monitor intent trends, and measure bot performance with real-time dashboards.' },
  { icon: Shield, title: 'Human Handoff', desc: 'Seamlessly escalate to a human agent when the bot needs help. No dropped conversations.' },
];

const steps = [
  { icon: Bot, step: '01', title: 'Create Your Bot', desc: 'Set up a bot in minutes. Configure its channel, system prompt, and knowledge base.' },
  { icon: Workflow, step: '02', title: 'Train & Customize', desc: 'Add FAQs, set fallback messages, and define when to hand off to humans.' },
  { icon: Globe, step: '03', title: 'Deploy & Monitor', desc: 'Connect to WhatsApp, go live, and watch your bot handle conversations in real time.' },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-warm noise-overlay">
      {/* Decorative orbs */}
      <div className="orb orb-terracotta w-[400px] h-[400px] -top-32 -right-32 animate-float-slow" />
      <div className="orb orb-gold w-[300px] h-[300px] top-1/2 -left-40 animate-float" />
      <div className="orb orb-terracotta w-[200px] h-[200px] bottom-0 right-1/4 animate-orb" />

      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-sand-200/60 bg-bg-warm/80 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center">
              <span className="font-display text-sm font-bold text-terracotta-400">A</span>
            </div>
            <span className="font-display text-lg font-semibold text-navy-900">ArabBot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="btn btn-secondary text-sm px-4 py-2">Sign In</Link>
            <Link to="/register" className="btn btn-primary text-sm px-4 py-2 group relative overflow-hidden">
              <span className="relative z-10 flex items-center gap-1.5">Get Started <ArrowRight className="w-3.5 h-3.5" /></span>
              <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative pt-24 pb-20 px-6 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] border-2 border-terracotta-500/10 rotate-12 animate-float-slow" />
        <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] border border-gold-400/5 rotate-45 animate-float" />
        <div className="max-w-4xl mx-auto text-center relative perspective">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-terracotta-50 border border-terracotta-200/50 text-terracotta-600 text-xs font-medium mb-6 tilt-item">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered WhatsApp Bot Platform
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold text-navy-900 leading-tight mb-5 tilt-item-deep">
            Build WhatsApp bots<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-terracotta-500 via-gold-500 to-terracotta-400 animate-gradient">that speak your language</span>
          </h1>
          <p className="font-body text-lg text-ash-500 max-w-2xl mx-auto leading-relaxed mb-8 tilt-item">
            ArabBot Studio lets you create intelligent WhatsApp bots for your business — 
            with AI that understands Arabic, seamless human handoff, and real-time analytics.
          </p>
          <div className="flex items-center justify-center gap-3 tilt-item-deep">
            <Link
              to="/register"
              className="btn btn-primary px-6 py-3 text-base group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Create Your Free Bot <ArrowRight className="w-4 h-4" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
            <Link
              to="/login"
              className="btn btn-secondary px-6 py-3 text-base"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 relative">
        <div className="orb orb-gold w-[250px] h-[250px] -top-20 left-1/4 animate-float pointer-events-none" />
        <div className="max-w-6xl mx-auto relative">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-semibold text-navy-900 mb-3">Everything you need</h2>
            <p className="font-body text-ash-500 max-w-xl mx-auto">From bot creation to deployment and monitoring — all in one dashboard.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 perspective">
            {features.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="card card-hover p-6 tilt-3d tilt-3d-shine animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-10 h-10 rounded-lg bg-terracotta-500/10 flex items-center justify-center mb-4 tilt-item">
                  <Icon className="w-5 h-5 text-terracotta-500" />
                </div>
                <h3 className="font-display text-base font-semibold text-navy-900 mb-2 tilt-item">{title}</h3>
                <p className="font-body text-sm text-ash-500 leading-relaxed tilt-item">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-6 bg-navy-800 relative overflow-hidden">
        <div className="absolute inset-0 grain-bg" />
        <div className="orb orb-terracotta w-[350px] h-[350px] -bottom-40 -right-40 animate-float-slow pointer-events-none" />
        <div className="max-w-4xl mx-auto relative perspective">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl font-semibold text-sand-50 mb-3">How it works</h2>
            <p className="font-body text-ash-400 max-w-xl mx-auto">Get your bot live in 3 simple steps.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(({ icon: Icon, step, title, desc }, i) => (
              <div
                key={step}
                className="text-center tilt-3d animate-fade-up p-6 rounded-xl hover:bg-navy-700/30 transition-colors"
                style={{ animationDelay: `${i * 0.12}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-terracotta-500/15 border border-terracotta-500/20 flex items-center justify-center mx-auto mb-4 tilt-item">
                  <Icon className="w-6 h-6 text-terracotta-400" />
                </div>
                <span className="font-display text-xs font-semibold text-terracotta-400 tracking-widest uppercase tilt-item">{step}</span>
                <h3 className="font-display text-lg font-semibold text-sand-50 mt-2 mb-2 tilt-item">{title}</h3>
                <p className="font-body text-sm text-ash-400 leading-relaxed tilt-item">{desc}</p>
              </div>
            ))}
          </div>

          {/* Connection line between steps */}
          <div className="hidden md:flex justify-center gap-8 mt-8 opacity-20">
            {[...Array(2)].map((_, i) => (
              <Network key={i} className="w-8 h-8 text-terracotta-400" />
            ))}
          </div>
        </div>
      </section>

      {/* Graph / Visual section */}
      <section className="py-20 px-6 relative overflow-hidden">
        <div className="orb orb-gold w-[200px] h-[200px] top-1/3 right-0 animate-orb pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="flex items-center justify-center gap-2 text-terracotta-500/30 mb-6">
            <LineChart className="w-12 h-12" />
            <BarChart3 className="w-12 h-12" />
            <Network className="w-12 h-12" />
          </div>
          <h2 className="font-display text-3xl font-semibold text-navy-900 mb-3">Real-time insights at a glance</h2>
          <p className="font-body text-ash-500 max-w-xl mx-auto mb-8">
            Monitor conversation volume, track intent trends, and measure bot performance 
            with beautiful charts and analytics.
          </p>
          <div className="card p-8 max-w-2xl mx-auto relative overflow-hidden perspective">
            <div className="absolute top-0 right-0 w-48 h-48 bg-terracotta-500/5 rounded-bl-full pointer-events-none" />
            <div className="grid grid-cols-3 gap-4 mb-6 tilt-item">
              {[
                { label: 'Conversations', value: '1.2K', change: '+12%' },
                { label: 'Messages', value: '8.4K', change: '+8%' },
                { label: 'Handoffs', value: '24', change: '-3%' },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-lg bg-sand-50">
                  <p className="font-body text-xs text-ash-400 mb-1">{stat.label}</p>
                  <p className="font-display text-2xl font-semibold text-navy-900">{stat.value}</p>
                  <span className={`font-body text-xs ${stat.change.startsWith('+') ? 'text-emerald-600' : 'text-terracotta-600'}`}>
                    {stat.change}
                  </span>
                </div>
              ))}
            </div>
            {/* Mini bar chart */}
            <div className="flex items-end justify-center gap-2 h-20 mb-3 tilt-item-deep">
              {[35, 52, 48, 70, 65, 85, 72, 90, 78, 60, 55, 42].map((h, i) => (
                <div
                  key={i}
                  className="w-5 rounded-t-sm transition-all duration-500 hover:scale-110"
                  style={{
                    height: `${h}%`,
                    background: i === 7 ? 'var(--color-terracotta-500)' : 'var(--color-terracotta-300)',
                  }}
                />
              ))}
            </div>
            <p className="font-body text-xs text-ash-400 text-center tilt-item">Last 12 days — message volume</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center card p-12 relative overflow-hidden perspective">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-terracotta-500/5 rounded-full pointer-events-none" />
          <div className="tilt-item-deep">
            <h2 className="font-display text-3xl font-semibold text-navy-900 mb-3">Ready to build your bot?</h2>
            <p className="font-body text-ash-500 mb-8 max-w-lg mx-auto">Start for free. No credit card required. Your first bot is minutes away.</p>
            <Link
              to="/register"
              className="btn btn-primary px-8 py-3 text-base group relative overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                Get Started Free <ArrowRight className="w-4 h-4" />
              </span>
              <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-navy-700 flex items-center justify-center">
              <span className="font-display text-[10px] font-bold text-terracotta-400">A</span>
            </div>
            <span className="font-display text-sm font-semibold text-navy-900">ArabBot Studio</span>
          </div>
          <p className="font-body text-xs text-ash-400">Copyright tradingcodeco</p>
        </div>
      </footer>
    </div>
  );
}
