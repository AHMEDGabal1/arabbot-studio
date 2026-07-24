import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants, useInView } from 'framer-motion';
import {
  Bot, BarChart3, Shield, ArrowRight,
  CheckCircle2, Globe, Sparkles, Cpu, Layers, FileText,
  Smartphone, Send, Star
} from 'lucide-react';
import { useCountUp } from '../lib/useCountUp';

// ── Dialects Data for Interactive Demo ──
interface DialectOption {
  id: 'egyptian' | 'saudi' | 'levantine' | 'msa';
  name: string;
  nameAr: string;
  flag: string;
  sampleInput: string;
  normalized: string;
  intent: string;
  botReply: string;
  latency: string;
}

const dialectDemos: DialectOption[] = [
  {
    id: 'egyptian',
    name: 'Egyptian Arabic',
    nameAr: 'العامية المصرية',
    flag: '🇪🇬',
    sampleInput: 'سلام عليكم، عايز اعرف مصاريف الشحن للقاهرة بكام وبتاخد كام يوم؟',
    normalized: 'السلام عليكم، أرغب في معرفة تكلفة وسرعة الشحن إلى محافظة القاهرة.',
    intent: 'SHIPPING_INQUIRY',
    botReply: 'أهلاً بحضرتك! الشحن للقاهرة بـ 35 جنيه وبيوصل خلال 24 لـ 48 ساعة من تأكيد الطلب. تحب أساعدك في عمل الطلب دلوقتي؟',
    latency: '0.62s',
  },
  {
    id: 'saudi',
    name: 'Saudi Arabic',
    nameAr: 'العامية السعودية',
    flag: '🇸🇦',
    sampleInput: 'هلا والله، كم سعر التوصيل للرياض وهل عندكم دفع عند الاستلام؟',
    normalized: 'مرحباً، ما هي تكلفة التوصيل إلى مدينة الرياض وهل توجد خدمة الدفع عند الاستلام؟',
    intent: 'PAYMENT_AND_SHIPPING',
    botReply: 'هلا وغلا! التوصيل للرياض بـ 25 ريال ومجاني للطلبات فوق 200 ريال. ونعم، خدمة الدفع عند الاستلام متاحة بكل سرور!',
    latency: '0.58s',
  },
  {
    id: 'levantine',
    name: 'Levantine Arabic',
    nameAr: 'العامية الشامية',
    flag: '🇱🇧',
    sampleInput: 'مرحبا، قديش بياخد وقت التوصيل لبيروت؟ وفي إمكانية للتبديل؟',
    normalized: 'مرحباً، كم يستغرق وقت التوصيل إلى بيروت وهل توجد سياسة استبدال؟',
    intent: 'EXCHANGE_AND_DELIVERY',
    botReply: 'أهلاً وسهلاً! التوصيل بياخد من يومين لـ 3 أيام. وأكيد، الاستبدال متاح مجاناً خلال 14 يوم من تاريخ الاستلام.',
    latency: '0.71s',
  },
  {
    id: 'msa',
    name: 'Modern Standard Arabic',
    nameAr: 'الفصحى المعاصرة',
    flag: '🌍',
    sampleInput: 'السلام عليكم، ما هي سياسة الضمان والاسترجاع المعتمدة لديكم؟',
    normalized: 'السلام عليكم، ما هي سياسة الضمان والاسترجاع المعتمدة لديكم؟',
    intent: 'WARRANTY_POLICY',
    botReply: 'أهلاً بك! جميع منتجاتنا مغطاة بضمان ذهبي لمدة عام كامل، مع إمكانية الاسترجاع أو الاستبدال الشامل خلال 14 يوماً من الاستلام.',
    latency: '0.54s',
  },
];

// ── Framer Motion Variants ──
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

// ── Counting Stat Card Component ──
function CountingStatCard({ label, target, suffix, change, up }: { label: string; target: number; suffix: string; change: string; up: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useCountUp(target, 1200, isInView);
  const displayCount = target >= 1000 ? (count / 1000).toFixed(1) : count;

  return (
    <motion.div 
      ref={ref} 
      whileHover={{ y: -4 }}
      className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-sand-200 shadow-sm relative overflow-hidden group hover:border-terracotta-300 transition-all"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-terracotta-500/10 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
      <p className="text-xs font-bold text-ash-400 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-navy-900 font-display">{displayCount}{suffix}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${up ? 'bg-success-50 text-success-700' : 'bg-error-50 text-error-700'}`}>
          {change}
        </span>
      </div>
    </motion.div>
  );
}

// ── Interactive Engine Playground Component ──
function InteractiveEnginePlayground() {
  const [selectedDialect, setSelectedDialect] = useState<DialectOption>(dialectDemos[0]);
  const [customInput, setCustomInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(3);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    { sender: 'user', text: dialectDemos[0].sampleInput, time: '10:42 AM' },
    { sender: 'bot', text: dialectDemos[0].botReply, time: '10:42 AM' }
  ]);

  const handleSelectDialect = (dialect: DialectOption) => {
    setSelectedDialect(dialect);
    setIsProcessing(true);
    setActiveStep(1);

    setTimeout(() => setActiveStep(2), 300);
    setTimeout(() => setActiveStep(3), 600);
    setTimeout(() => {
      setIsProcessing(false);
      setMessages([
        { sender: 'user', text: dialect.sampleInput, time: 'Just now' },
        { sender: 'bot', text: dialect.botReply, time: 'Just now' }
      ]);
    }, 800);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const userText = customInput;
    setCustomInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText, time: 'Just now' }]);
    setIsProcessing(true);
    setActiveStep(1);

    setTimeout(() => setActiveStep(2), 400);
    setTimeout(() => setActiveStep(3), 800);
    setTimeout(() => {
      setIsProcessing(false);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `أهلاً بك! تم استلام استفسارك: "${userText}". جاري تجهيز الرد التلقائي فوراً بفضل محرك الذكاء الاصطناعي.`,
          time: 'Just now'
        }
      ]);
    }, 1000);
  };

  return (
    <div className="bg-navy-900 rounded-3xl p-6 lg:p-10 border border-navy-700 shadow-2xl text-white relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Panel: Dialect Selector & AI Processing Trace */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-terracotta-500/20 border border-terracotta-500/30 text-terracotta-300 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> Interactive Dialect Engine
            </div>
            <h3 className="font-display text-2xl lg:text-3xl font-extrabold text-white mb-2">
              Select Arabic Dialect
            </h3>
            <p className="text-navy-200 text-sm">
              See how ArabBot normalizes regional dialects, detects user intent, and generates natural responses in real-time.
            </p>
          </div>

          {/* Dialect Buttons */}
          <div className="grid grid-cols-2 gap-3">
            {dialectDemos.map((d) => {
              const isSelected = selectedDialect.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => handleSelectDialect(d)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-terracotta-600 to-terracotta-500 border-terracotta-400 text-white shadow-lg shadow-terracotta-500/25 scale-[1.02]'
                      : 'bg-navy-800/80 border-navy-700 text-navy-200 hover:border-navy-500 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{d.flag}</span>
                    <div>
                      <div className="font-bold text-sm leading-tight">{d.name}</div>
                      <div className="font-arabic text-xs opacity-80" dir="rtl">{d.nameAr}</div>
                    </div>
                  </div>
                  {isSelected && <CheckCircle2 className="w-4 h-4 text-white shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Real-time AI Pipeline Processing Steps */}
          <div className="bg-navy-800/90 border border-navy-700 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs text-navy-300 font-mono">
              <span className="flex items-center gap-1.5 text-terracotta-400 font-bold">
                <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} /> PIPELINE DIAGNOSTICS
              </span>
              <span className="text-success-500 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse"></span> Latency: {selectedDialect.latency}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Step 1: Normalization */}
              <div className={`p-3 rounded-xl border transition-all ${
                activeStep >= 1 ? 'bg-navy-700/60 border-terracotta-500/40 text-sand-50' : 'bg-navy-900/40 border-navy-700/50 text-navy-400'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>1. Dialect Normalizer (توحيد اللهجة)</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-terracotta-500/20 text-terracotta-300">
                    {selectedDialect.id}
                  </span>
                </div>
                <p className="font-arabic text-ash-300 text-xs leading-relaxed" dir="rtl">
                  "{selectedDialect.normalized}"
                </p>
              </div>

              {/* Step 2: Intent Routing */}
              <div className={`p-3 rounded-xl border transition-all ${
                activeStep >= 2 ? 'bg-navy-700/60 border-terracotta-500/40 text-sand-50' : 'bg-navy-900/40 border-navy-700/50 text-navy-400'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>2. Intent & RAG Matching (تحديد الهدف والقصد)</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-gold-500/20 text-gold-300">
                    Confidence 98.6%
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-ash-300">
                  <Layers className="w-3.5 h-3.5 text-gold-400" /> Intent: <span className="text-terracotta-300 font-bold">{selectedDialect.intent}</span>
                </div>
              </div>

              {/* Step 3: Gemini AI Output */}
              <div className={`p-3 rounded-xl border transition-all ${
                activeStep >= 3 ? 'bg-navy-700/60 border-success-500/40 text-sand-50' : 'bg-navy-900/40 border-navy-700/50 text-navy-400'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>3. Gemini 2.5 Response Generation</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-success-500/20 text-success-300">
                    Completed
                  </span>
                </div>
                <p className="text-navy-300 text-[11px]">Output generated naturally matching dialect tone and user persona.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Phone Mockup Container */}
        <div className="lg:col-span-6">
          <div className="bg-navy-950 border border-navy-700 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
            {/* Phone Header */}
            <div className="bg-navy-800 border-b border-navy-700 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-terracotta-500 to-terracotta-600 flex items-center justify-center text-white font-bold shadow-md">
                    <Bot className="w-5 h-5" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-success-500 border-2 border-navy-800 rounded-full"></span>
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    ArabBot Assistant <span className="text-[10px] bg-terracotta-500/20 text-terracotta-300 px-2 py-0.5 rounded-full border border-terracotta-500/30">WhatsApp Verified</span>
                  </div>
                  <div className="text-xs text-navy-300 flex items-center gap-1 font-arabic" dir="rtl">
                    متصل الآن • خدمة العملاء التلقائية
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-navy-400">
                <Shield className="w-4 h-4 text-success-500" />
                <span className="text-xs font-mono">E2E Encrypted</span>
              </div>
            </div>

            {/* Phone Chat Messages */}
            <div className="p-5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-navy-900 via-navy-950 to-navy-950 flex-1 overflow-y-auto flex flex-col justify-end space-y-4">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    {msg.sender === 'bot' && (
                      <div className="w-7 h-7 rounded-full bg-terracotta-500/20 border border-terracotta-500/30 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-terracotta-400" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl max-w-[85%] text-sm font-arabic leading-relaxed shadow-lg ${
                        msg.sender === 'user'
                          ? 'bg-terracotta-500 text-white rounded-tr-none'
                          : 'bg-navy-800 border border-navy-700 text-sand-50 rounded-tl-none'
                      }`}
                      dir="rtl"
                    >
                      <div>{msg.text}</div>
                      <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${msg.sender === 'user' ? 'text-terracotta-100 justify-end' : 'text-navy-400 justify-start'}`} dir="ltr">
                        {msg.time} {msg.sender === 'user' && <CheckCircle2 className="w-3 h-3 text-terracotta-200" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2.5 items-center"
                >
                  <div className="w-7 h-7 rounded-full bg-terracotta-500/20 border border-terracotta-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-terracotta-400" />
                  </div>
                  <div className="bg-navy-800 border border-navy-700 text-navy-300 text-xs px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-terracotta-400 animate-ping"></span>
                    <span className="font-arabic" dir="rtl">جاري كتابة الرد بالذكاء الاصطناعي...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Custom Query Input Box */}
            <form onSubmit={handleSendCustom} className="p-3 bg-navy-800 border-t border-navy-700 flex items-center gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="اكتب رسالة تجريبية بالعامية..."
                className="flex-1 bg-navy-900 border border-navy-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-navy-400 focus:outline-none focus:border-terracotta-500 font-arabic text-right"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={isProcessing || !customInput.trim()}
                className="w-10 h-10 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Interactive Pricing Calculator Component ──
function InteractivePricing() {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: 'Starter',
      nameAr: 'البداية الذكية',
      desc: 'Perfect for small stores & startups launching their first bot.',
      priceMonthly: 39,
      priceYearly: 29,
      messages: '5,000 msgs/mo',
      bots: '1 WhatsApp Bot',
      features: [
        'Google Gemini 2.5 AI Engine',
        'Egyptian, Saudi & MSA Dialects',
        'Basic Knowledge Base (Up to 20 PDFs)',
        'Human Handoff Queue',
        'Email Support',
      ],
      popular: false,
      cta: 'Start Free Trial',
    },
    {
      name: 'Pro Business',
      nameAr: 'الاحترافي للأعمال',
      desc: 'Designed for growing brands requiring high volume and live agents.',
      priceMonthly: 99,
      priceYearly: 79,
      messages: '50,000 msgs/mo',
      bots: '5 Active WhatsApp Bots',
      features: [
        'All Dialects (Egyptian, Saudi, Levantine, MSA)',
        'Unlimited RAG Vector Search Knowledge Base',
        'Multi-Agent Handoff Dashboard',
        'Custom Webhooks & CRM Integrations',
        'Real-time Analytics & Sentiment Insights',
        'Priority 24/7 WhatsApp Support',
      ],
      popular: true,
      cta: 'Get Started Pro',
    },
    {
      name: 'Enterprise',
      nameAr: 'المؤسسات الكبرى',
      desc: 'Tailored solutions for enterprises needing SLA & custom LLM fine-tuning.',
      priceMonthly: 299,
      priceYearly: 239,
      messages: 'Unlimited msgs',
      bots: 'Unlimited Bots',
      features: [
        'Custom Fine-Tuned AI Models',
        'Dedicated Cloud & SQLite/PostgreSQL Database',
        'Custom Meta WhatsApp API Onboarding',
        '99.99% Guaranteed SLA Uptime',
        'Dedicated Account Manager & Setup Specialist',
        'Custom Security Audit & On-Premises Option',
      ],
      popular: false,
      cta: 'Contact Enterprise',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mb-14">
        <span className={`text-sm font-bold ${!isYearly ? 'text-navy-900' : 'text-ash-400'}`}>Monthly Billing</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="w-14 h-8 bg-navy-800 rounded-full p-1 relative transition-colors"
        >
          <motion.div
            animate={{ x: isYearly ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-6 h-6 rounded-full bg-terracotta-500 shadow-md"
          />
        </button>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${isYearly ? 'text-navy-900' : 'text-ash-400'}`}>
          Annual Billing <span className="bg-terracotta-100 text-terracotta-700 text-xs px-2 py-0.5 rounded-full font-extrabold">Save 20%</span>
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid lg:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, i) => (
          <motion.div
            key={i}
            whileHover={{ y: -6 }}
            className={`rounded-3xl p-8 border flex flex-col justify-between transition-all duration-300 relative ${
              plan.popular
                ? 'bg-navy-900 text-white border-terracotta-500 shadow-2xl ring-2 ring-terracotta-500/50 scale-[1.02]'
                : 'bg-white text-navy-900 border-sand-200 shadow-sm hover:shadow-md'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-terracotta-500 to-terracotta-600 text-white text-xs font-extrabold uppercase px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Most Popular Choice
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className={`font-display text-2xl font-extrabold ${plan.popular ? 'text-white' : 'text-navy-900'}`}>{plan.name}</h3>
                  <p className="font-arabic text-xs font-bold text-terracotta-500" dir="rtl">{plan.nameAr}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${plan.popular ? 'bg-navy-800 text-terracotta-300' : 'bg-sand-100 text-ash-600'}`}>
                  {plan.bots}
                </div>
              </div>

              <p className={`text-sm mb-6 ${plan.popular ? 'text-navy-200' : 'text-ash-500'}`}>{plan.desc}</p>

              {/* Price */}
              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold font-display">${isYearly ? plan.priceYearly : plan.priceMonthly}</span>
                <span className={`text-xs font-bold ${plan.popular ? 'text-navy-300' : 'text-ash-400'}`}>/ month</span>
              </div>

              {/* Feature List */}
              <ul className="space-y-3.5 text-sm mb-8">
                {plan.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-terracotta-400' : 'text-success-600'}`} />
                    <span className={plan.popular ? 'text-navy-100' : 'text-ash-700'}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className={`w-full btn justify-center py-3.5 rounded-xl font-bold transition-all ${
                plan.popular
                  ? 'btn-primary shadow-lg shadow-terracotta-500/25'
                  : 'bg-navy-900 text-white hover:bg-navy-800'
              }`}
            >
              {plan.cta}
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ── Main Landing Page Component ──
export default function Landing() {
  return (
    <div className="min-h-screen bg-sand-50 font-body selection:bg-terracotta-100 selection:text-terracotta-900">
      {/* ── Sticky Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-sand-200/80 bg-white/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden border border-sand-200 shadow-sm group-hover:scale-105 transition-transform">
              <img src="/logo.jpg" alt="ArabBot Studio" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold text-navy-900 tracking-tight leading-none">ArabBot Studio</span>
              <span className="font-arabic text-[11px] text-terracotta-600 font-bold leading-none mt-0.5" dir="rtl">منصة بوتات الذكاء الاصطناعي</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-ash-600">
            <a href="#demo" className="hover:text-terracotta-600 transition-colors">Live Engine Demo</a>
            <a href="#features" className="hover:text-terracotta-600 transition-colors">Capabilities</a>
            <a href="#how-it-works" className="hover:text-terracotta-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-terracotta-600 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="font-bold text-sm text-navy-900 hover:text-terracotta-600 transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary text-sm px-5 py-2.5 shadow-md shadow-terracotta-500/20 hover:scale-105 transition-all">
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Dynamic Glowing Ambient Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-terracotta-400/20 rounded-full blur-[120px] -z-10 animate-float-slow"></div>
        <div className="absolute top-40 right-10 w-80 h-80 bg-gold-400/20 rounded-full blur-[100px] -z-10 animate-float"></div>

        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            {/* Pill Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-sand-200 shadow-sm text-terracotta-700 text-xs font-bold uppercase tracking-wider mb-8">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-terracotta-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-terracotta-500"></span>
              </span>
              <span>Gemini 2.5 Powered • Native Egyptian, Saudi & MSA Arabic</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeInUp} className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold text-navy-900 tracking-tight leading-[1.08] mb-6">
              Build WhatsApp Bots <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-terracotta-600 via-terracotta-500 to-gold-500 relative">
                That Understand Arabic Dialects
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p variants={fadeInUp} className="font-body text-lg sm:text-xl text-ash-600 max-w-2xl mx-auto leading-relaxed mb-10">
              Transform customer service with AI agents fluent in regional Arabic. Seamless RAG knowledge search, instant human handoff, and official Meta WhatsApp integration.
            </motion.p>

            {/* CTA Action Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn btn-primary px-8 py-4 text-base shadow-xl shadow-terracotta-500/25 w-full sm:w-auto justify-center rounded-2xl hover:scale-105 transition-all">
                <span className="font-bold">Start Building Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#demo" className="btn bg-white text-navy-900 border border-sand-200 hover:border-sand-300 px-8 py-4 text-base shadow-sm w-full sm:w-auto justify-center font-bold rounded-2xl hover:bg-sand-50 transition-all">
                <Sparkles className="w-5 h-5 text-terracotta-500" />
                <span>Test Live Engine Demo</span>
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
          <CountingStatCard label="Active Conversations" target={1250000} suffix="+" change="+24% mo" up={true} />
          <CountingStatCard label="Arabic Intent Accuracy" target={99} suffix=".4%" change="Target Met" up={true} />
          <CountingStatCard label="Avg Response Latency" target={650} suffix="ms" change="Sub-Second" up={true} />
          <CountingStatCard label="Support Costs Saved" target={70} suffix="%" change="-70% Work" up={true} />
        </div>
      </section>

      {/* ── Live Interactive Engine Demo Section ── */}
      <section id="demo" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-navy-900 mb-3 tracking-tight">
            Try The Live Arabic Engine
          </h2>
          <p className="font-body text-ash-600 text-base">
            Click any dialect below to see how ArabBot parses input, routes intent, and formats natural responses.
          </p>
        </div>
        <InteractiveEnginePlayground />
      </section>

      {/* ── Bento Grid Core Capabilities ── */}
      <section id="features" className="py-24 px-6 bg-white border-y border-sand-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-terracotta-600 font-bold text-xs uppercase tracking-widest bg-terracotta-50 px-3.5 py-1.5 rounded-full border border-terracotta-100">
              Enterprise Grade AI Architecture
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-navy-900 mt-4 mb-4 tracking-tight">
              Designed for Arabic E-Commerce & Service
            </h2>
            <p className="font-body text-ash-600 text-lg">
              Everything required to deploy reliable, high-converting WhatsApp automation in Saudi Arabia, Egypt, UAE, and across the MENA region.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Bento Card 1: Dialect Intelligence */}
            <motion.div
              whileHover={{ y: -4 }}
              className="lg:col-span-2 bg-gradient-to-br from-sand-50 via-white to-sand-100 rounded-3xl p-8 sm:p-10 border border-sand-200 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-terracotta-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-terracotta-500/20">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="font-display text-3xl font-extrabold text-navy-900 mb-2">Native Dialect Intelligence</h3>
                <p className="font-arabic text-sm text-terracotta-600 font-bold mb-4" dir="rtl">فهم الفصحى والعاميات المصرية، السعودية والشامية</p>
                <p className="text-ash-600 text-base max-w-xl leading-relaxed mb-6">
                  Standard AI models fail on Arabic regional slang, misinterpreting customer requests. Our specialized prompt normalization pipeline maps local idioms accurately into structured intent definitions.
                </p>
              </div>

              {/* Mini Dialect Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-sand-200 text-center font-bold text-xs text-navy-900">🇪🇬 Egyptian</div>
                <div className="bg-white p-3 rounded-xl border border-sand-200 text-center font-bold text-xs text-navy-900">🇸🇦 Saudi / Gulf</div>
                <div className="bg-white p-3 rounded-xl border border-sand-200 text-center font-bold text-xs text-navy-900">🇱🇧 Levantine</div>
                <div className="bg-white p-3 rounded-xl border border-sand-200 text-center font-bold text-xs text-navy-900">🌍 Standard MSA</div>
              </div>
            </motion.div>

            {/* Bento Card 2: Human Agent Handoff */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-navy-900 text-white rounded-3xl p-8 sm:p-10 border border-navy-700 shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-navy-800 border border-navy-600 text-terracotta-400 rounded-2xl flex items-center justify-center mb-6">
                  <Shield className="w-7 h-7" />
                </div>
                <h3 className="font-display text-2xl font-extrabold mb-2">Fail-Safe Human Escalation</h3>
                <p className="font-arabic text-xs text-terracotta-400 font-bold mb-4" dir="rtl">تحويل فوري للعنصر البشري عند الحساسية</p>
                <p className="text-navy-200 text-sm leading-relaxed mb-6">
                  When low confidence or explicit human requests occur, ArabBot seamlessly transitions control to your agent dashboard without dropping customer context.
                </p>
              </div>

              <div className="bg-navy-800 border border-navy-700 p-4 rounded-2xl flex items-center justify-between text-xs font-mono text-terracotta-300">
                <span>Confidence Threshold &lt; 0.70</span>
                <span className="bg-terracotta-500/20 text-terracotta-300 px-2 py-0.5 rounded border border-terracotta-500/30">Auto Escalated</span>
              </div>
            </motion.div>

            {/* Bento Card 3: RAG Knowledge Base */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-sand-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-sand-100 text-navy-900 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-navy-900 mb-2">RAG Knowledge Search</h3>
              <p className="text-ash-500 text-sm leading-relaxed mb-4">
                Upload your store FAQs, PDF catalogs, or return policies. ArabBot indexes knowledge items instantly for grounding.
              </p>
              <div className="text-xs font-bold text-terracotta-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Grounded in business truth
              </div>
            </motion.div>

            {/* Bento Card 4: Meta WhatsApp API */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-sand-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-success-50 text-success-700 rounded-2xl flex items-center justify-center mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-navy-900 mb-2">Meta WhatsApp Business API</h3>
              <p className="text-ash-500 text-sm leading-relaxed mb-4">
                Built directly on official Cloud API endpoints with HMAC SHA256 Webhook verification for 100% compliance.
              </p>
              <div className="text-xs font-bold text-success-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Official Meta Cloud Partner API
              </div>
            </motion.div>

            {/* Bento Card 5: Real-time Analytics */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-sand-200 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-terracotta-50 text-terracotta-600 rounded-2xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-navy-900 mb-2">Real-Time Insights</h3>
              <p className="text-ash-500 text-sm leading-relaxed mb-4">
                Track intent breakdowns, customer satisfaction trends, peak message hours, and human agent resolution metrics.
              </p>
              <div className="text-xs font-bold text-navy-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-terracotta-500" /> Exportable CSV & Real-Time Charts
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="py-24 px-6 bg-sand-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-extrabold text-navy-900 mb-3 tracking-tight">How It Works</h2>
            <p className="font-body text-ash-600 text-lg">Go from registration to live Arabic bot deployment in under 5 minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl border border-sand-200 shadow-sm relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-terracotta-500 text-white font-extrabold text-xl flex items-center justify-center mb-6">
                1
              </div>
              <h3 className="font-display text-xl font-extrabold text-navy-900 mb-2">Connect Meta Webhook</h3>
              <p className="font-arabic text-xs font-bold text-terracotta-600 mb-3" dir="rtl">ربط حساب واتساب المعتمد</p>
              <p className="text-ash-500 text-sm leading-relaxed">
                Paste your Meta Phone ID & Access Token. Our automated handshake establishes secure webhooks instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl border border-sand-200 shadow-sm relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-navy-900 text-white font-extrabold text-xl flex items-center justify-center mb-6">
                2
              </div>
              <h3 className="font-display text-xl font-extrabold text-navy-900 mb-2">Upload Knowledge & FAQs</h3>
              <p className="font-arabic text-xs font-bold text-terracotta-600 mb-3" dir="rtl">تغدية قاعدة المعرفة</p>
              <p className="text-ash-500 text-sm leading-relaxed">
                Input store policy FAQs, shipping rates, and product details. The AI uses this grounded truth for every response.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl border border-sand-200 shadow-sm relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-gold-500 text-white font-extrabold text-xl flex items-center justify-center mb-6">
                3
              </div>
              <h3 className="font-display text-xl font-extrabold text-navy-900 mb-2">Activate & Monitor</h3>
              <p className="font-arabic text-xs font-bold text-terracotta-600 mb-3" dir="rtl">تفعيل البوت ومتابعة التحويلات</p>
              <p className="text-ash-500 text-sm leading-relaxed">
                Toggle your bot live. Watch automated conversations flow in real-time and handle agent handoffs seamlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" className="py-24 px-6 bg-white border-t border-sand-200">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-terracotta-600 font-bold text-xs uppercase tracking-widest bg-terracotta-50 px-3.5 py-1.5 rounded-full border border-terracotta-100">
            Transparent Pricing
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-navy-900 mt-4 mb-3 tracking-tight">
            Flexible Plans for Every Scale
          </h2>
          <p className="font-body text-ash-600 text-lg">
            Start with our 14-day free trial. No credit card required. Upgrade as your message volume grows.
          </p>
        </div>

        <InteractivePricing />
      </section>

      {/* ── Customer Success Testimonials ── */}
      <section className="py-24 px-6 bg-sand-50 border-t border-sand-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-extrabold text-navy-900 mb-3 tracking-tight">
              Trusted by Top Brands in MENA
            </h2>
            <p className="font-body text-ash-600 text-lg">See how businesses across Egypt, KSA, and UAE transform customer support.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-sand-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-gold-500 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-gold-500" />
                  ))}
                </div>
                <p className="font-arabic text-ash-700 text-sm leading-relaxed mb-6" dir="rtl">
                  "البوت أحدث نقلة نوعية في متجرنا بالرياض. العملاء بيتكلموا باللهجة السعودية والبوت بيرد في ثواني بنفس الأسلوب. نسبة المبيعات زادت 35%!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-sand-100">
                <div className="w-10 h-10 rounded-full bg-terracotta-100 font-bold text-terracotta-700 flex items-center justify-center text-sm">
                  م.ش
                </div>
                <div>
                  <div className="font-bold text-navy-900 text-sm">محمد الشمري</div>
                  <div className="text-xs text-ash-400">مؤسس متجر الفخامة • الرياض</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-sand-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-gold-500 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-gold-500" />
                  ))}
                </div>
                <p className="font-arabic text-ash-700 text-sm leading-relaxed mb-6" dir="rtl">
                  "الميزة الحقيقية هي التحويل للبشر عند الحاجة. البوت بيجاوب على الأسئلة الشائعة، ولو في مشكلة بيحول للـ Support Team فوراً مع السجل الكامل!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-sand-100">
                <div className="w-10 h-10 rounded-full bg-navy-100 font-bold text-navy-700 flex items-center justify-center text-sm">
                  س.ع
                </div>
                <div>
                  <div className="font-bold text-navy-900 text-sm">سارة عبد الرحمن</div>
                  <div className="text-xs text-ash-400">مديرة خدمة العملاء • القاهرة</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-sand-200 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-gold-500 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-gold-500" />
                  ))}
                </div>
                <p className="font-arabic text-ash-700 text-sm leading-relaxed mb-6" dir="rtl">
                  "ربط قاعدة المعرفة بملفات الـ PDF كان ممتاز. البوت بيجيب الإجابات الدقيقة من كتالوج المنتجات بدون أي هلوسة أو أخطاء."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-sand-100">
                <div className="w-10 h-10 rounded-full bg-gold-100 font-bold text-gold-800 flex items-center justify-center text-sm">
                  ط.خ
                </div>
                <div>
                  <div className="font-bold text-navy-900 text-sm">طارق الخالد</div>
                  <div className="text-xs text-ash-400">رئيس العمليات • دبي</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── High-Converting Final CTA ── */}
      <section className="py-24 px-6 bg-navy-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight">
            Ready to Launch Your Intelligent Arabic WhatsApp Bot?
          </h2>
          <p className="font-body text-xl text-navy-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of forward-thinking brands delivering instant, natural Arabic support on WhatsApp today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn btn-primary px-10 py-4 text-lg font-bold shadow-xl shadow-terracotta-500/30 rounded-2xl hover:scale-105 transition-all">
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-sand-200 py-12 px-6 bg-white text-ash-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl overflow-hidden border border-sand-200">
              <img src="/logo.jpg" alt="ArabBot Studio" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-display font-extrabold text-navy-900">ArabBot Studio</span>
              <p className="text-xs text-ash-400 font-arabic" dir="rtl">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#demo" className="hover:text-terracotta-600 transition-colors">Demo</a>
            <a href="#features" className="hover:text-terracotta-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-terracotta-600 transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-terracotta-600 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
