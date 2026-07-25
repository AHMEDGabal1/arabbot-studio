import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants, useInView } from 'framer-motion';
import {
  Bot, Shield, ArrowRight,
  CheckCircle2, Globe, Sparkles, Cpu, Layers, FileText,
  Send, Star, Users, ShieldAlert, Zap, MessageSquare
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
    latency: '0.52s',
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
    latency: '0.48s',
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
    latency: '0.61s',
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
    latency: '0.44s',
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
      className="bg-white/90 backdrop-blur-md p-6 rounded-2xl border border-emerald-100 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-slate-900 font-display">{displayCount}{suffix}</span>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${up ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700'}`}>
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
          text: `أهلاً بك! تم استلام استفسارك: "${userText}". جاري تجهيز الرد التلقائي فوراً بفضل محرك الذكاء الاصطناعي على واتساب.`,
          time: 'Just now'
        }
      ]);
    }, 1000);
  };

  return (
    <div className="bg-[#0b141a] rounded-3xl p-6 lg:p-10 border border-emerald-900/50 shadow-2xl text-white relative overflow-hidden">
      {/* Background WhatsApp Glow Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Panel: Dialect Selector & AI Processing Trace */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" /> WhatsApp Native AI Engine
            </div>
            <h3 className="font-display text-2xl lg:text-3xl font-extrabold text-white mb-2">
              Select Arabic Dialect
            </h3>
            <p className="text-slate-300 text-sm">
              See how ArabBot normalizes regional dialects, enforces guardrails, and routes to specialist agents in real-time.
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
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/25 scale-[1.02]'
                      : 'bg-[#111b21] border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:text-white'
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
          <div className="bg-[#111b21] border border-slate-800 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Cpu className="w-4 h-4 animate-spin" style={{ animationDuration: '4s' }} /> PIPELINE DIAGNOSTICS
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Latency: {selectedDialect.latency}
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Step 1: Normalization */}
              <div className={`p-3 rounded-xl border transition-all ${
                activeStep >= 1 ? 'bg-[#202c33] border-emerald-500/40 text-white' : 'bg-[#111b21] border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>1. Dialect Normalizer (توحيد اللهجة)</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    {selectedDialect.id}
                  </span>
                </div>
                <p className="font-arabic text-slate-300 text-xs leading-relaxed" dir="rtl">
                  "{selectedDialect.normalized}"
                </p>
              </div>

              {/* Step 2: Intent & Guardrail */}
              <div className={`p-3 rounded-xl border transition-all ${
                activeStep >= 2 ? 'bg-[#202c33] border-emerald-500/40 text-white' : 'bg-[#111b21] border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>2. Specialist Agent & Guardrails Check</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300">
                    Passed 100%
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-slate-300">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" /> Intent: <span className="text-emerald-300 font-bold">{selectedDialect.intent}</span>
                </div>
              </div>

              {/* Step 3: Gemini AI Output */}
              <div className={`p-3 rounded-xl border transition-all ${
                activeStep >= 3 ? 'bg-[#202c33] border-emerald-500/40 text-white' : 'bg-[#111b21] border-slate-800 text-slate-500'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span>3. WhatsApp Response Generation</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Completed
                  </span>
                </div>
                <p className="text-slate-300 text-[11px]">Output generated in natural dialect, verified against safety rules.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Phone Mockup Container (WhatsApp UI Theme) */}
        <div className="lg:col-span-6">
          <div className="bg-[#111b21] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[520px]">
            {/* WhatsApp Header */}
            <div className="bg-[#202c33] border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md">
                    <MessageSquare className="w-5 h-5 fill-white text-emerald-600" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#202c33] rounded-full"></span>
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    ArabBot Assistant <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">Official WhatsApp API</span>
                  </div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1 font-arabic" dir="rtl">
                    متصل الآن • خدمة العملاء بالذكاء الاصطناعي
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 text-slate-400">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono">Meta Verified</span>
              </div>
            </div>

            {/* Phone Chat Messages */}
            <div className="p-5 bg-[#0b141a] bg-[radial-gradient(#1f2c34_1px,transparent_1px)] [background-size:16px_16px] flex-1 overflow-y-auto flex flex-col justify-end space-y-4">
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
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl max-w-[85%] text-sm font-arabic leading-relaxed shadow-lg ${
                        msg.sender === 'user'
                          ? 'bg-[#005c4b] text-white rounded-tr-none'
                          : 'bg-[#202c33] border border-slate-700/60 text-slate-100 rounded-tl-none'
                      }`}
                      dir="rtl"
                    >
                      <div>{msg.text}</div>
                      <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${msg.sender === 'user' ? 'text-emerald-200 justify-end' : 'text-slate-400 justify-start'}`} dir="ltr">
                        {msg.time} {msg.sender === 'user' && <CheckCircle2 className="w-3 h-3 text-emerald-300" />}
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
                  <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="bg-[#202c33] border border-slate-700 text-slate-300 text-xs px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-arabic" dir="rtl">جاري كتابة الرد بالذكاء الاصطناعي...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Custom Query Input Box */}
            <form onSubmit={handleSendCustom} className="p-3 bg-[#202c33] border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="اكتب رسالة تجريبية بالعامية..."
                className="flex-1 bg-[#111b21] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-arabic text-right"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={isProcessing || !customInput.trim()}
                className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all shadow-md shadow-emerald-500/20"
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
      messages: 'Active Contact Pricing',
      bots: '1 WhatsApp Bot',
      features: [
        'Google Gemini AI Engine',
        'Egyptian, Saudi & MSA Dialects',
        'Guardrails & Discount Safety Rules',
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
      messages: 'Active Contact Pricing',
      bots: '5 Active WhatsApp Bots',
      features: [
        'All Dialects (Egyptian, Saudi, Levantine, MSA)',
        'Specialist Agent Routing (Sales, Support, FAQ)',
        'Customer Profiles (CDP) & History Memory',
        'Full Guardrails Engine (Forbidden Words, Max Discount)',
        'Unlimited RAG Vector Search Knowledge Base',
        'Multi-Agent Handoff Dashboard',
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
      messages: 'Custom Active Contact Tiers',
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
        <span className={`text-sm font-bold ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Monthly Billing</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="w-14 h-8 bg-[#111b21] rounded-full p-1 relative transition-colors"
        >
          <motion.div
            animate={{ x: isYearly ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-6 h-6 rounded-full bg-emerald-500 shadow-md"
          />
        </button>
        <span className={`text-sm font-bold flex items-center gap-1.5 ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
          Annual Billing <span className="bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full font-extrabold border border-emerald-200">Save 20%</span>
        </span>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -6 }}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
              plan.popular
                ? 'bg-[#0b141a] text-white border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 scale-[1.03]'
                : 'bg-white text-slate-900 border border-emerald-100 shadow-sm hover:shadow-md'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white font-extrabold text-xs uppercase px-4 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Most Popular Choice
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-2xl font-extrabold">{plan.name}</h3>
                <span className={`font-arabic text-xs font-bold ${plan.popular ? 'text-emerald-400' : 'text-emerald-700'}`} dir="rtl">
                  {plan.nameAr}
                </span>
              </div>
              <p className={`text-xs mb-6 ${plan.popular ? 'text-slate-300' : 'text-slate-500'}`}>{plan.desc}</p>

              <div className="mb-6 pb-6 border-b border-slate-200/20">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-display">${isYearly ? plan.priceYearly : plan.priceMonthly}</span>
                  <span className={`text-xs ${plan.popular ? 'text-slate-300' : 'text-slate-500'}`}>/ month</span>
                </div>
                <p className={`text-xs font-bold mt-2 ${plan.popular ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {plan.messages} • {plan.bots}
                </p>
              </div>

              <ul className="space-y-3.5 text-xs mb-8">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5">
                    <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <span className={plan.popular ? 'text-slate-200' : 'text-slate-600'}>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className={`w-full btn justify-center py-3.5 rounded-xl font-bold transition-all ${
                plan.popular
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
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
    <div className="min-h-screen bg-slate-50 font-body selection:bg-emerald-100 selection:text-emerald-900">
      {/* ── Sticky Navbar ── */}
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <MessageSquare className="w-6 h-6 fill-white text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg font-extrabold text-slate-900 tracking-tight leading-none">ArabBot Studio</span>
              <span className="font-arabic text-[11px] text-emerald-700 font-bold leading-none mt-0.5" dir="rtl">منصة بوتات الواتساب الذكية</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#demo" className="hover:text-emerald-600 transition-colors">Live Engine Demo</a>
            <a href="#features" className="hover:text-emerald-600 transition-colors">Capabilities</a>
            <a href="#how-it-works" className="hover:text-emerald-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            <Link to="/login" className="font-bold text-sm text-slate-900 hover:text-emerald-600 transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link to="/register" className="btn bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-5 py-2.5 shadow-md shadow-emerald-500/20 hover:scale-105 transition-all">
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-24 pb-20 px-6 max-w-7xl mx-auto overflow-hidden">
        {/* Dynamic Glowing Ambient WhatsApp Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[120px] -z-10 animate-float-slow"></div>
        <div className="absolute top-40 right-10 w-80 h-80 bg-teal-500/15 rounded-full blur-[100px] -z-10 animate-float"></div>

        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            {/* Pill Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-emerald-200 shadow-sm text-emerald-800 text-xs font-bold uppercase tracking-wider mb-8">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>WhatsApp AI Engine • Guardrails Safety + Specialist Agents + CDP</span>
            </motion.div>

            {/* Headline */}
            <motion.h1 variants={fadeInUp} className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.08] mb-6">
              Build WhatsApp AI Bots <br className="hidden sm:inline" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 relative">
                That Speak Arabic Dialects
              </span>
            </motion.h1>

            {/* Subheading */}
            <motion.p variants={fadeInUp} className="font-body text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
              Transform WhatsApp customer support with specialized AI agents, business guardrails safety, persistent customer memory (CDP), and native Egyptian & Gulf dialect understanding.
            </motion.p>

            {/* CTA Action Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 text-base shadow-xl shadow-emerald-500/25 w-full sm:w-auto justify-center rounded-2xl hover:scale-105 transition-all font-bold">
                <span>Start Building Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#demo" className="btn bg-white text-slate-900 border border-emerald-200 hover:border-emerald-300 px-8 py-4 text-base shadow-sm w-full sm:w-auto justify-center font-bold rounded-2xl hover:bg-emerald-50/50 transition-all">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span>Test Live Engine Demo</span>
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Metrics Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
          <CountingStatCard label="Active Conversations" target={1250000} suffix="+" change="+24% mo" up={true} />
          <CountingStatCard label="Arabic Intent Accuracy" target={99} suffix=".4%" change="Target Met" up={true} />
          <CountingStatCard label="Avg Response Latency" target={480} suffix="ms" change="Sub-Second" up={true} />
          <CountingStatCard label="Support Costs Saved" target={70} suffix="%" change="-70% Work" up={true} />
        </div>
      </section>

      {/* ── Live Interactive Engine Demo Section ── */}
      <section id="demo" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
            Try The Live WhatsApp Arabic Engine
          </h2>
          <p className="font-body text-slate-600 text-base">
            Click any dialect below to see how ArabBot parses input, enforces guardrails, routes to specialist agents, and sends natural WhatsApp responses.
          </p>
        </div>
        <InteractiveEnginePlayground />
      </section>

      {/* ── Bento Grid Core Capabilities ── */}
      <section id="features" className="py-24 px-6 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-700 font-bold text-xs uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
              Enterprise Grade WhatsApp AI Platform
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 mt-4 mb-4 tracking-tight">
              Designed for Arabic E-Commerce & Customer Service
            </h2>
            <p className="font-body text-slate-600 text-lg">
              Everything required to deploy reliable, high-converting WhatsApp automation in Saudi Arabia, Egypt, UAE, and across the MENA region.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Bento Card 1: Dialect Intelligence */}
            <motion.div
              whileHover={{ y: -4 }}
              className="lg:col-span-2 bg-gradient-to-br from-emerald-50/40 via-white to-emerald-50/20 rounded-3xl p-8 sm:p-10 border border-emerald-200 shadow-sm relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="font-display text-3xl font-extrabold text-slate-900 mb-2">Native Dialect Intelligence</h3>
                <p className="font-arabic text-sm text-emerald-700 font-bold mb-4" dir="rtl">فهم الفصحى والعاميات المصرية، السعودية والشامية</p>
                <p className="text-slate-600 text-base max-w-xl leading-relaxed mb-6">
                  Standard AI models fail on Arabic regional slang, misinterpreting customer requests. Our specialized prompt normalization pipeline maps local idioms accurately into structured intent definitions.
                </p>
              </div>

              {/* Mini Dialect Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center font-bold text-xs text-slate-900">🇪🇬 Egyptian</div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center font-bold text-xs text-slate-900">🇸🇦 Saudi / Gulf</div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center font-bold text-xs text-slate-900">🇱🇧 Levantine</div>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 text-center font-bold text-xs text-slate-900">🌍 Standard MSA</div>
              </div>
            </motion.div>

            {/* Bento Card 2: Safety & Guardrails Engine */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-[#0b141a] text-white rounded-3xl p-8 sm:p-10 border border-emerald-900/50 shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-[#111b21] border border-slate-800 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="font-display text-2xl font-extrabold mb-2">AI Guardrails & Safety Engine</h3>
                <p className="font-arabic text-xs text-emerald-400 font-bold mb-4" dir="rtl">حماية وتأمين الردود ومنع هلوسة الخصومات</p>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Enforce strict business safety. Block unauthorized discount claims, censor forbidden words, enforce terms disclaimers, and prevent ReDoS attacks before responses hit WhatsApp.
                </p>
              </div>

              <div className="bg-[#111b21] border border-slate-800 p-4 rounded-2xl flex items-center justify-between text-xs font-mono text-emerald-300">
                <span>Max Discount Limit: 30%</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">Auto Block & Sanitize</span>
              </div>
            </motion.div>

            {/* Bento Card 3: Multi-Agent Specialist Routing */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2">Specialist Agent Routing</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Route sales, support, complaints, and FAQs to dedicated specialized AI agent personas with custom prompts and temperatures.
              </p>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Sales, Support & Complaints Agents
              </div>
            </motion.div>

            {/* Bento Card 4: Customer Profiles (CDP) */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-teal-50 text-teal-700 rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2">Customer CDP & Memory</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Build persistent customer profiles across conversations. Tag VIP buyers, save agent notes, and inject customer history directly into LLM prompts.
              </p>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Persistent Cross-Channel Memory
              </div>
            </motion.div>

            {/* Bento Card 5: RAG Knowledge Base */}
            <motion.div
              whileHover={{ y: -4 }}
              className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 bg-slate-100 text-slate-900 rounded-2xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2">RAG Knowledge Search</h3>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Upload store FAQs, PDF catalogs, or return policies. ArabBot indexes knowledge items instantly for grounding.
              </p>
              <div className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Grounded in business truth
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="py-24 px-6 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">How It Works</h2>
            <p className="font-body text-slate-600 text-lg">Go from registration to live WhatsApp Arabic bot deployment in under 5 minutes.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center mb-6 shadow-md shadow-emerald-500/20">
                1
              </div>
              <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2">Connect Meta Webhook</h3>
              <p className="font-arabic text-xs font-bold text-emerald-700 mb-3" dir="rtl">ربط حساب واتساب المعتمد</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Paste your Meta Phone ID & Access Token. Our automated handshake establishes secure webhooks instantly.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#0b141a] text-white font-extrabold text-xl flex items-center justify-center mb-6">
                2
              </div>
              <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2">Configure Agents & Rules</h3>
              <p className="font-arabic text-xs font-bold text-emerald-700 mb-3" dir="rtl">إعداد الوكلاء وقواعد الأمان</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Seed built-in Egyptian agent prompts, set maximum discount rules, and upload FAQs or PDF catalogs.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white font-extrabold text-xl flex items-center justify-center mb-6">
                3
              </div>
              <h3 className="font-display text-xl font-extrabold text-slate-900 mb-2">Activate & Monitor</h3>
              <p className="font-arabic text-xs font-bold text-emerald-700 mb-3" dir="rtl">تفعيل البوت ومتابعة العملاء</p>
              <p className="text-slate-600 text-sm leading-relaxed">
                Toggle your bot live. Watch automated conversations flow in real-time and manage customer profiles & handoffs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" className="py-24 px-6 bg-white border-t border-slate-200">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-emerald-700 font-bold text-xs uppercase tracking-widest bg-emerald-50 px-3.5 py-1.5 rounded-full border border-emerald-200">
            Transparent Pricing
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-slate-900 mt-4 mb-3 tracking-tight">
            Flexible Plans for Every Scale
          </h2>
          <p className="font-body text-slate-600 text-lg">
            Start with our 14-day free trial. No credit card required. Upgrade as your active customer volume grows.
          </p>
        </div>

        <InteractivePricing />
      </section>

      {/* ── Customer Success Testimonials ── */}
      <section className="py-24 px-6 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">
              Trusted by Top Brands in MENA
            </h2>
            <p className="font-body text-slate-600 text-lg">See how businesses across Egypt, KSA, and UAE transform WhatsApp support.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-emerald-500 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="font-arabic text-slate-700 text-sm leading-relaxed mb-6" dir="rtl">
                  "البوت أحدث نقلة نوعية في متجرنا بالرياض. العملاء بيتكلموا باللهجة السعودية والبوت بيرد في ثواني بنفس الأسلوب ومؤمن بقواعد الأمان!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 font-bold text-emerald-800 flex items-center justify-center text-sm">
                  م.ش
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">محمد الشمري</div>
                  <div className="text-xs text-slate-500">مؤسس متجر الفخامة • الرياض</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-emerald-500 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="font-arabic text-slate-700 text-sm leading-relaxed mb-6" dir="rtl">
                  "سجل العملاء CDP والتحويل للبشر ممتاز جداً. البوت بيتعرف على العميل الـ VIP وبيظهر للـ Agent كل تاريخ المحادثات والملاحظات!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-teal-100 font-bold text-teal-800 flex items-center justify-center text-sm">
                  س.ع
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">سارة عبد الرحمن</div>
                  <div className="text-xs text-slate-500">مديرة خدمة العملاء • القاهرة</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-emerald-500 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="font-arabic text-slate-700 text-sm leading-relaxed mb-6" dir="rtl">
                  "قواعد الأمان منعت تماماً تقديم أي خصومات غير مصرح بها. الـ Guardrails بتفلتر الردود قبل ما توصل للواتساب بدون أي تأخير."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 font-bold text-emerald-800 flex items-center justify-center text-sm">
                  ط.خ
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">طارق الخالد</div>
                  <div className="text-xs text-slate-500">رئيس العمليات • دبي</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── High-Converting Final CTA ── */}
      <section className="py-24 px-6 bg-[#0b141a] text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold mb-6 tracking-tight">
            Ready to Launch Your WhatsApp AI Agent Today?
          </h2>
          <p className="font-body text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join hundreds of forward-thinking brands delivering instant, natural Arabic support with built-in guardrails safety.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" className="btn bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 text-lg font-bold shadow-xl shadow-emerald-500/30 rounded-2xl hover:scale-105 transition-all">
              Create Your Free Account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 py-12 px-6 bg-white text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
              <MessageSquare className="w-4 h-4 fill-white text-emerald-600" />
            </div>
            <div>
              <span className="font-display font-extrabold text-slate-900">ArabBot Studio</span>
              <p className="text-xs text-slate-400 font-arabic" dir="rtl">جميع الحقوق محفوظة © {new Date().getFullYear()}</p>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#demo" className="hover:text-emerald-600 transition-colors">Demo</a>
            <a href="#features" className="hover:text-emerald-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-emerald-600 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
