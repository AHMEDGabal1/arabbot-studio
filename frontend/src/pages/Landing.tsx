import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants, useInView } from 'framer-motion';
import {
  Bot, MessageCircle, BarChart3, Shield, ArrowRight,
  CheckCircle2, Globe, Network, Check, Activity
} from 'lucide-react';
import { useCountUp } from '../lib/useCountUp';

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

const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

function ChatSimulator() {
  const messagesList = [
    { sender: 'user', text: 'مرحباً! هل يمكنني الاستفسار عن خدماتكم؟', delay: 1000 },
    { sender: 'bot', text: 'أهلاً بك! بالتأكيد، نحن منصة لتصميم وإدارة بوتات واتساب الذكية. كيف يمكنني مساعدتك اليوم؟', delay: 2000 },
    { sender: 'user', text: 'هل تدعمون اللغة العربية الفصحى والعامية؟', delay: 1500 },
    { sender: 'bot', text: 'نعم، بفضل محرك Gemini الذكي، يفهم البوت العربية الفصحى والعاميات المحلية المختلفة بدقة وسرعة.', delay: 2500 },
    { sender: 'user', text: 'ممتاز، أود تجربة المنصة.', delay: 1200 },
    { sender: 'bot', text: 'رائع! يمكنك البدء بإنشاء حساب مجاني فوراً وتفعيل أول بوت لك في دقائق.', delay: 2000 }
  ];

  const [visibleMessages, setVisibleMessages] = useState<typeof messagesList>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let timer: any;
    
    const showNextMessage = () => {
      if (index >= messagesList.length) {
        timer = setTimeout(() => {
          setVisibleMessages([]);
          setIndex(0);
        }, 5000);
        return;
      }

      const nextMsg = messagesList[index];
      
      if (nextMsg.sender === 'bot') {
        setIsTyping(true);
        timer = setTimeout(() => {
          setIsTyping(false);
          setVisibleMessages(prev => [...prev, nextMsg]);
          setIndex(prev => prev + 1);
        }, nextMsg.delay);
      } else {
        timer = setTimeout(() => {
          setVisibleMessages(prev => [...prev, nextMsg]);
          setIndex(prev => prev + 1);
        }, nextMsg.delay);
      }
    };

    showNextMessage();
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div className="bg-white border border-sand-200 rounded-2xl shadow-xl overflow-hidden max-w-md mx-auto h-[420px] flex flex-col">
      <div className="bg-sand-50 border-b border-sand-200 p-4 flex items-center gap-3 shrink-0">
        <div className="w-10 h-10 bg-terracotta-100 rounded-full flex items-center justify-center">
          <Bot className="w-5 h-5 text-terracotta-600" />
        </div>
        <div>
          <div className="font-bold text-navy-900 text-sm">ArabBot Assistant</div>
          <div className="text-xs text-success-600 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-success-500 block"></span> Online
          </div>
        </div>
      </div>
      <div className="p-5 bg-sand-50/50 flex-1 overflow-y-auto flex flex-col justify-end min-h-0">
        <div className="space-y-4 overflow-y-auto pr-1">
          {visibleMessages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-6 h-6 rounded-full bg-terracotta-100 shrink-0 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-terracotta-600"/>
                </div>
              )}
              {msg.sender === 'user' && (
                <div className="w-6 h-6 rounded-full bg-sand-200 shrink-0"></div>
              )}
              <div 
                className={`text-sm p-3 rounded-2xl shadow-sm max-w-[80%] font-arabic ${
                  msg.sender === 'user' 
                    ? 'bg-terracotta-500 text-white rounded-tr-none' 
                    : 'bg-white border border-sand-200 text-ash-700 rounded-tl-none'
                }`}
                dir="rtl"
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-2"
            >
              <div className="w-6 h-6 rounded-full bg-terracotta-100 shrink-0 flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-terracotta-600"/>
              </div>
              <div className="bg-white border border-sand-200 text-ash-400 text-sm py-2.5 px-4 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-ash-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-ash-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-ash-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function CountingStatCard({ label, target, suffix, change, up }: { label: string; target: number; suffix: string; change: string; up: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useCountUp(target, 1200, isInView);
  const displayCount = target >= 1000 ? (count / 1000).toFixed(1) : count;

  return (
    <motion.div 
      ref={ref} 
      whileHover={{ y: -4 }}
      className="bg-white p-5 rounded-2xl border border-sand-200 shadow-sm"
    >
      <p className="text-xs font-bold text-ash-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-extrabold text-navy-900">{displayCount}{suffix}</span>
        <span className={`text-xs font-bold ${up ? 'text-success-600' : 'text-error-600'}`}>{change}</span>
      </div>
    </motion.div>
  );
}

function InteractiveChart() {
  const data = [
    { day: 'Jul 04', volume: 350 },
    { day: 'Jul 05', volume: 520 },
    { day: 'Jul 06', volume: 480 },
    { day: 'Jul 07', volume: 700 },
    { day: 'Jul 08', volume: 650 },
    { day: 'Jul 09', volume: 850 },
    { day: 'Jul 10', volume: 720 },
    { day: 'Jul 11', volume: 900 },
    { day: 'Jul 12', volume: 780 },
    { day: 'Jul 13', volume: 600 },
    { day: 'Jul 14', volume: 550 },
    { day: 'Jul 15', volume: 420 },
  ];

  const maxVolume = 900;
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <div className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm relative">
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm font-bold text-navy-900">Message Volume</p>
        <span className="text-xs text-ash-400 font-medium">Daily Active Conversations</span>
      </div>
      <div className="flex items-end justify-between gap-1.5 h-32 relative">
        {data.map((item, i) => {
          const heightPct = (item.volume / maxVolume) * 100;
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`w-full rounded-t-sm transition-all duration-200 cursor-pointer relative ${
                isHovered ? 'bg-terracotta-500' : 'bg-sand-200'
              }`}
              style={{ height: `${heightPct}%` }}
            >
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-navy-900 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap z-20">
                  {item.day}: {item.volume} msgs
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-sand-50 font-body selection:bg-terracotta-100 selection:text-terracotta-900">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-sand-200 bg-white/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-sand-200 shadow-sm">
              <img src="/logo.jpg" alt="ArabBot" className="w-full h-full object-cover" />
            </div>
            <span className="font-display text-lg font-bold text-navy-900 tracking-tight">ArabBot</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="font-medium text-sm text-ash-600 hover:text-navy-900 transition-colors">Sign In</Link>
            <Link to="/register" className="btn btn-primary text-sm px-5 py-2 shadow-sm hover:shadow-md transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Creative Background Elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-terracotta-300/30 rounded-full blur-[100px] -z-10 mix-blend-multiply animate-[float_8s_ease-in-out_infinite]"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-sand-300/40 rounded-full blur-[100px] -z-10 mix-blend-multiply animate-[float_10s_ease-in-out_infinite_reverse]"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMCwwLDAsMC4wNSkiLz48L3N2Zz4=')] opacity-50 -z-10 mask-image-[radial-gradient(ellipse_at_center,black,transparent)]"></div>

        <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="max-w-xl">
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/60 backdrop-blur-md border border-white text-terracotta-700 text-xs font-bold uppercase tracking-wider mb-8 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-terracotta-500"></span>
              </span>
              <span>Next-Gen Bot Platform</span>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="font-display text-5xl md:text-[4rem] font-extrabold text-navy-900 leading-[1.05] mb-6 tracking-tighter">
              Build WhatsApp bots <br/>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-terracotta-600 via-terracotta-500 to-terracotta-400 relative">
                that speak your language
                <svg className="absolute w-full h-3 -bottom-1 left-0 text-terracotta-200/50" viewBox="0 0 100 10" preserveAspectRatio="none"><path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="2"/></svg>
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="font-body text-lg md:text-xl text-ash-600 leading-relaxed mb-10 max-w-lg">
              ArabBot Studio lets you create intelligent WhatsApp bots for your business — with AI that naturally understands Arabic, seamless human handoff, and real-time analytics.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center gap-4">
              <Link to="/register" className="btn btn-primary px-8 py-4 text-base shadow-lg shadow-terracotta-500/20 group w-full sm:w-auto justify-center rounded-xl hover:-translate-y-1 transition-all duration-300">
                <span className="flex items-center gap-2 font-bold">
                  Start Building <ArrowRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
              <Link to="/login" className="btn bg-white text-navy-900 border border-sand-200 hover:bg-sand-50 hover:border-sand-300 px-8 py-4 text-base shadow-sm w-full sm:w-auto justify-center font-bold rounded-xl transition-all duration-300">
                View Demo
              </Link>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="mt-12 flex items-center gap-8 text-sm text-ash-500 font-medium">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-terracotta-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-terracotta-500" />
                </div>
                Powered by Gemini
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-success-500" />
                </div>
                Native Arabic
              </div>
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="relative hidden lg:block max-w-md mx-auto w-full">
            {/* Mockup Container with continuous floating animation */}
            <div className="relative z-10 animate-[float_6s_ease-in-out_infinite] hover:animate-none transition-transform duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-terracotta-500/10 to-transparent rounded-[2rem] blur-2xl transform translate-y-8 -translate-x-4"></div>
              <ChatSimulator />
            </div>
            
            {/* Decorative Floating Element */}
            <div className="absolute -bottom-4 -left-12 bg-white/80 backdrop-blur-md border border-white p-5 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center gap-4 z-30 animate-[float_5s_ease-in-out_infinite_reverse]">
               <div className="relative w-12 h-12 bg-gradient-to-br from-success-100 to-success-50 rounded-xl flex items-center justify-center shrink-0 border border-success-200">
                 <Activity className="w-6 h-6 text-success-600" />
                 <span className="absolute -top-1 -right-1 flex h-3 w-3">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-3 w-3 bg-success-500 border-2 border-white"></span>
                 </span>
               </div>
               <div>
                 <div className="text-[11px] text-ash-500 font-bold uppercase tracking-widest leading-none mb-1.5">Response Time</div>
                 <div className="font-display font-extrabold text-navy-900 text-lg leading-none">&lt; 1 second</div>
               </div>
            </div>
            
            {/* Additional floating decoration */}
            <div className="absolute top-16 -right-12 bg-white/90 backdrop-blur-sm border border-white px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-30 animate-[float_7s_ease-in-out_infinite] flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-navy-50 flex items-center justify-center text-lg">🚀</div>
              <div className="flex flex-col">
                <span className="text-[10px] text-ash-400 font-bold uppercase tracking-wider">Status</span>
                <span className="font-display font-bold text-sm text-navy-900 leading-none">Deployed</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section (Bento Box) */}
      <section className="py-24 px-6 bg-white border-y border-sand-200">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} className="mb-16 max-w-2xl">
            <h2 className="font-display text-4xl font-extrabold text-navy-900 mb-4 tracking-tight">Everything you need</h2>
            <p className="font-body text-ash-600 text-lg">From bot creation to deployment and monitoring — all in one powerful, unified dashboard.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Main Feature 1 */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="md:col-span-2 bg-gradient-to-br from-sand-50 to-white rounded-3xl p-8 lg:p-10 border border-sand-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-terracotta-100 rounded-full blur-3xl opacity-50 transition-opacity group-hover:opacity-70"></div>
              
              <div className="relative z-10 flex flex-col h-full justify-between">
                <div>
                  <div className="w-14 h-14 bg-white rounded-2xl border border-sand-100 flex items-center justify-center mb-8 shadow-sm group-hover:shadow-md transition-all group-hover:scale-105">
                    <Bot className="w-7 h-7 text-terracotta-600" />
                  </div>
                  <h3 className="font-display text-3xl font-extrabold text-navy-900 mb-4 tracking-tight">Smart WhatsApp Bots</h3>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-terracotta-50 border border-terracotta-100 rounded-full mb-6">
                    <span className="w-2 h-2 rounded-full bg-terracotta-500 animate-pulse"></span>
                    <span className="font-arabic text-xs text-terracotta-700 font-bold tracking-wide" dir="rtl">بوتات واتساب ذكية</span>
                  </div>
                  <p className="font-body text-ash-600 text-lg max-w-lg leading-relaxed">
                    AI-powered bots that understand Arabic and English, handle orders, answer FAQs, and qualify leads 24/7 without breaking a sweat.
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Main Feature 2 */}
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-gradient-to-br from-navy-800 to-navy-900 text-white rounded-3xl p-8 lg:p-10 border border-navy-700 shadow-xl transition-all relative overflow-hidden group ring-1 ring-white/5 ring-inset"
            >
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-terracotta-500/20 rounded-full blur-3xl group-hover:bg-terracotta-500/30 transition-colors duration-500"></div>
              
              <div className="relative z-10">
                <div className="w-14 h-14 bg-navy-800 rounded-2xl border border-navy-600 flex items-center justify-center mb-8 group-hover:border-terracotta-500/50 transition-colors group-hover:scale-105">
                  <MessageCircle className="w-7 h-7 text-terracotta-400" />
                </div>
                <h3 className="font-display text-3xl font-extrabold mb-4 tracking-tight">Natural flow</h3>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-navy-800 border border-navy-600 rounded-full mb-6">
                  <span className="w-2 h-2 rounded-full bg-terracotta-400 shadow-[0_0_8px_rgba(233,183,65,0.8)]"></span>
                  <span className="font-arabic text-xs text-terracotta-300 font-bold tracking-wide" dir="rtl">محادثات طبيعية</span>
                </div>
                <p className="font-body text-navy-200 text-base leading-relaxed">
                  Powered by Google Gemini. Your bot understands intent, remembers context, and responds like a seasoned human agent.
                </p>
              </div>
            </motion.div>

            {/* Secondary Features */}
            {secondaryFeatures.map((f, i) => (
              <motion.div 
                key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="bg-white rounded-3xl p-8 border border-sand-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-sand-50 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500 origin-top-right"></div>
                <div className="w-12 h-12 bg-sand-50 rounded-2xl border border-sand-100 flex items-center justify-center mb-6 group-hover:bg-terracotta-50 group-hover:border-terracotta-100 transition-colors">
                  <f.icon className="w-6 h-6 text-ash-700 group-hover:text-terracotta-600 transition-colors" />
                </div>
                <h3 className="font-display text-xl font-extrabold text-navy-900 mb-2 tracking-tight">{f.title}</h3>
                {f.titleAr && <p className="font-arabic text-xs text-terracotta-600 font-bold mb-4" dir="rtl">{f.titleAr}</p>}
                <p className="font-body text-ash-500 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
            
            <motion.div 
              initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="bg-gradient-to-br from-terracotta-500 to-terracotta-700 text-white rounded-3xl p-8 flex flex-col justify-center items-center text-center shadow-lg hover:shadow-xl transition-all relative overflow-hidden group"
            >
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out"></div>
               <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
               <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-black/10 rounded-full blur-2xl"></div>
               
               <div className="relative z-10 w-full">
                 <h3 className="font-display text-2xl font-extrabold mb-8 tracking-tight">Ready to build?</h3>
                 <Link to="/register" className="btn bg-white text-terracotta-700 hover:bg-sand-50 border-none shadow-md hover:shadow-lg font-bold w-full justify-center py-4 rounded-xl transition-all hover:scale-[1.02]">
                   Get Started Free
                 </Link>
               </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 px-6 bg-sand-50">
        <div className="max-w-6xl mx-auto">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={fadeInUp} className="text-center mb-16">
            <h2 className="font-display text-4xl font-extrabold text-navy-900 mb-4 tracking-tight">How it works</h2>
            <p className="font-body text-ash-600 text-lg">Three steps from setup to live — no fuss, no delay.</p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div key={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="relative">
                {/* Connecting line */}
                {i < steps.length - 1 && <div className="hidden md:block absolute top-8 left-16 w-[calc(100%-2rem)] h-px border-t-2 border-dashed border-sand-200 z-0"></div>}
                <div className="bg-white w-16 h-16 rounded-2xl border border-sand-200 shadow-sm flex items-center justify-center mb-6 relative z-10 font-display font-bold text-xl text-terracotta-600">
                  {i + 1}
                </div>
                <h3 className="font-display text-xl font-bold text-navy-900 mb-2">{s.title}</h3>
                {s.titleAr && <p className="font-arabic text-sm text-terracotta-600 font-bold mb-3" dir="rtl">{s.titleAr}</p>}
                <p className="font-body text-ash-600 leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Analytics Mockup */}
      <section className="py-24 px-6 bg-white border-t border-sand-200">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="lg:w-1/2">
            <h2 className="font-display text-4xl font-extrabold text-navy-900 mb-4 tracking-tight">Real-time insights</h2>
            <p className="font-body text-ash-600 text-lg mb-8">
              Monitor conversation volume, track intent trends, and measure bot performance with a clean, actionable dashboard. No guessing, just data.
            </p>
            <ul className="space-y-4 font-medium text-ash-700">
              <li className="flex items-center gap-3"><Check className="w-5 h-5 text-success-500" /> Exportable reports</li>
              <li className="flex items-center gap-3"><Check className="w-5 h-5 text-success-500" /> Live conversation monitoring</li>
              <li className="flex items-center gap-3"><Check className="w-5 h-5 text-success-500" /> Sentiment analysis</li>
            </ul>
          </motion.div>
          
          <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="lg:w-1/2 w-full">
            <div className="bg-sand-50 rounded-3xl border border-sand-200 p-6 shadow-sm">
              <div className="grid grid-cols-2 gap-4 mb-6">
                {stats.slice(0,2).map((stat, i) => (
                  <CountingStatCard key={i} {...stat} />
                ))}
              </div>
              <InteractiveChart />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 bg-navy-900 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">Ready to build your bot?</h2>
          <p className="font-body text-xl text-navy-200 mb-10">Start for free. No credit card required. Your first intelligent agent is minutes away.</p>
          <Link to="/register" className="btn btn-primary px-10 py-4 text-lg font-bold shadow-lg rounded-xl">
            Create Your Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200 py-10 px-6 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden border border-sand-200">
              <img src="/logo.jpg" alt="ArabBot" className="w-full h-full object-cover" />
            </div>
            <span className="font-display font-bold text-navy-900">ArabBot Studio</span>
          </div>
          <p className="font-body text-sm text-ash-500 font-medium">© {new Date().getFullYear()} tradingcodeco · All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
