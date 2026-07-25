import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants, useInView } from 'framer-motion';
import {
  Bot, ArrowRight,
  CheckCircle2, Globe, Sparkles, Cpu, FileText,
  Send, Star, Users, ShieldAlert, Zap, MessageSquare,
  Check, Headphones, Play, Volume2
} from 'lucide-react';
import { useCountUp } from '../lib/useCountUp';
import Logo from '../components/Logo';

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
  confidence: number;
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
    latency: '0.32s',
    confidence: 99.8,
  },
  {
    id: 'saudi',
    name: 'Saudi & Gulf',
    nameAr: 'العامية السعودية والخليجية',
    flag: '🇸🇦',
    sampleInput: 'هلا والله، كم سعر التوصيل للرياض وهل عندكم دفع عند الاستلام؟',
    normalized: 'مرحباً، ما هي تكلفة التوصيل إلى مدينة الرياض وهل توجد خدمة الدفع عند الاستلام؟',
    intent: 'PAYMENT_AND_SHIPPING',
    botReply: 'هلا وغلا! التوصيل للرياض بـ 25 ريال ومجاني للطلبات فوق 200 ريال. ونعم، خدمة الدفع عند الاستلام متاحة بكل سرور!',
    latency: '0.29s',
    confidence: 99.5,
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
    latency: '0.35s',
    confidence: 99.2,
  },
  {
    id: 'msa',
    name: 'Modern Standard',
    nameAr: 'الفصحى المعاصرة',
    flag: '🌍',
    sampleInput: 'السلام عليكم، ما هي سياسة الضمان والاسترجاع المعتمدة لديكم؟',
    normalized: 'السلام عليكم، ما هي سياسة الضمان والاسترجاع المعتمدة لديكم؟',
    intent: 'WARRANTY_POLICY',
    botReply: 'أهلاً بك! جميع منتجاتنا مغطاة بضمان ذهبي لمدة عام كامل، مع إمكانية الاسترجاع أو الاستبدال الشامل خلال 14 يوماً من الاستلام.',
    latency: '0.25s',
    confidence: 99.9,
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

// ── Counting Stat Card Component (Dark Cyber Theme) ──
function CountingStatCard({ label, target, suffix, change, up }: { label: string; target: number; suffix: string; change: string; up: boolean }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useCountUp(target, 1200, isInView);
  const displayCount = target >= 1000000 ? (count / 1000000).toFixed(1) + 'M' : target >= 1000 ? (count / 1000).toFixed(1) + 'K' : count;

  return (
    <motion.div 
      ref={ref} 
      whileHover={{ y: -4 }}
      className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group border border-emerald-500/20"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/15 to-transparent rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform duration-500"></div>
      <p className="text-[11px] font-mono font-bold text-emerald-400/80 uppercase tracking-widest mb-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        {label}
      </p>
      <div className="flex items-baseline justify-between">
        <span className="text-3xl font-extrabold text-white font-display tracking-tight text-gradient-emerald">{displayCount}{suffix}</span>
        <span className={`text-[11px] font-bold font-mono px-2 py-0.5 rounded-full border ${up ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-red-500/10 text-red-400 border-red-500/30'}`}>
          {change}
        </span>
      </div>
    </motion.div>
  );
}

// ── Interactive WhatsApp AI Terminal & Playground Component ──
function InteractiveEnginePlayground() {
  const [selectedDialect, setSelectedDialect] = useState<DialectOption>(dialectDemos[0]);
  const [customInput, setCustomInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<number>(3);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
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
          text: `أهلاً بك! تم تحليل استفسارك: "${userText}". جاري تنفيذ طلبك فوراً بمساعدة محرك ArabBot على الواتساب.`,
          time: 'Just now'
        }
      ]);
    }, 1000);
  };

  const simulateAudio = () => {
    setIsPlayingAudio(true);
    setTimeout(() => setIsPlayingAudio(false), 3000);
  };

  return (
    <div className="glass-panel rounded-3xl p-6 lg:p-10 border border-emerald-500/25 shadow-2xl text-white relative overflow-hidden dark-cyber-bg">
      {/* Background WhatsApp Glow Orbs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Panel: Dialect Selector & AI Processing Trace */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} /> Live Arabic NLU Engine Playground
            </div>
            <h3 className="font-display text-2xl lg:text-3xl font-extrabold text-white mb-2 tracking-tight">
              Test Arabic Dialect Understanding
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Experience how ArabBot normalizes regional dialects, enforces strict guardrail safety, and generates contextual WhatsApp responses in under 350ms.
            </p>
          </div>

          {/* Dialect Selection Tabs */}
          <div className="grid grid-cols-2 gap-3">
            {dialectDemos.map((d) => {
              const isSelected = selectedDialect.id === d.id;
              return (
                <button
                  key={d.id}
                  onClick={() => handleSelectDialect(d)}
                  className={`p-3.5 rounded-2xl border text-left transition-all duration-200 flex items-center justify-between ${
                    isSelected
                      ? 'bg-gradient-to-r from-emerald-600/90 to-emerald-500/90 border-emerald-400 text-white shadow-lg shadow-emerald-500/30 scale-[1.02]'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:text-white'
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

          {/* Real-time AI Pipeline Processing Diagnostic Card */}
          <div className="bg-slate-950/80 border border-emerald-500/20 rounded-2xl p-5 space-y-3.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                <Cpu className="w-4 h-4 animate-spin text-emerald-400" style={{ animationDuration: '4s' }} /> ENGINE DIAGNOSTICS HUD
              </span>
              <span className="text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Latency: <strong className="text-white">{selectedDialect.latency}</strong></span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Step 1: Dialect Normalizer */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                activeStep >= 1 ? 'bg-slate-900/90 border-emerald-500/40 text-white shadow-md' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-emerald-400" />
                    <span>1. Dialect Normalizer (توحيد اللهجة)</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Confidence: {selectedDialect.confidence}%
                  </span>
                </div>
                <p className="font-arabic text-emerald-200 text-xs leading-relaxed bg-emerald-950/40 p-2 rounded border border-emerald-500/20" dir="rtl">
                  "{selectedDialect.normalized}"
                </p>
              </div>

              {/* Step 2: Intent & Guardrail Firewall */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                activeStep >= 2 ? 'bg-slate-900/90 border-emerald-500/40 text-white shadow-md' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-teal-400" />
                    <span>2. Safety Guardrails & Intent Router</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Guardrails: PASSED
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-slate-300 bg-slate-950/50 p-2 rounded border border-slate-800">
                  <span>Intent: <span className="text-emerald-300 font-bold">{selectedDialect.intent}</span></span>
                  <span className="text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3 text-emerald-400" /> PII Masked
                  </span>
                </div>
              </div>

              {/* Step 3: Response Generation */}
              <div className={`p-3.5 rounded-xl border transition-all ${
                activeStep >= 3 ? 'bg-slate-900/90 border-emerald-500/40 text-white shadow-md' : 'bg-slate-950/40 border-slate-800/80 text-slate-500'
              }`}>
                <div className="flex items-center justify-between font-bold mb-1">
                  <span className="flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                    <span>3. WhatsApp Response Stream</span>
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                    Ready
                  </span>
                </div>
                <p className="text-slate-400 text-[11px]">Response generated in natural regional dialect with business rules applied.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right WhatsApp Smartphone Frame Simulator */}
        <div className="lg:col-span-6">
          <div className="bg-[#0b141a] border border-emerald-500/30 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[540px] relative glow-border-emerald">
            {/* WhatsApp Header Bar */}
            <div className="bg-[#202c33] border-b border-slate-800 p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/30">
                    <MessageSquare className="w-5 h-5 fill-white text-emerald-600" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#202c33] rounded-full animate-pulse"></span>
                </div>
                <div>
                  <div className="font-bold text-white text-sm flex items-center gap-2">
                    ArabBot AI Assistant 
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">Meta Verified API</span>
                  </div>
                  <div className="text-xs text-emerald-400 flex items-center gap-1 font-arabic" dir="rtl">
                    متصل الآن • رد آلي سريع بالفصحى والعامية
                  </div>
                </div>
              </div>
              <button 
                onClick={simulateAudio} 
                title="Play Audio Voice Demo"
                className={`p-2 rounded-xl border text-xs font-mono flex items-center gap-1.5 transition-all ${
                  isPlayingAudio ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse' : 'bg-slate-800 text-emerald-400 border-slate-700 hover:border-emerald-500'
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">{isPlayingAudio ? 'Playing...' : 'Voice Note'}</span>
              </button>
            </div>

            {/* Phone Audio Waveform Banner */}
            {isPlayingAudio && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-emerald-950/90 border-b border-emerald-500/40 p-3 px-4 flex items-center justify-between text-xs text-emerald-200"
              >
                <div className="flex items-center gap-2">
                  <Headphones className="w-4 h-4 text-emerald-400 animate-bounce" />
                  <span className="font-arabic" dir="rtl">جاري معالجة بصمة الصوت باللهجة {selectedDialect.nameAr}...</span>
                </div>
                <div className="flex items-center gap-1">
                  {[40, 70, 30, 90, 50, 80, 40, 60, 90, 30].map((h, i) => (
                    <span key={i} className="w-1 bg-emerald-400 rounded-full animate-pulse" style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}></span>
                  ))}
                </div>
              </motion.div>
            )}

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
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-emerald-400" />
                      </div>
                    )}
                    <div
                      className={`p-3.5 rounded-2xl max-w-[85%] text-sm font-arabic leading-relaxed shadow-lg ${
                        msg.sender === 'user'
                          ? 'bg-[#005c4b] text-white rounded-tr-none border border-emerald-600/40'
                          : 'bg-[#202c33] border border-slate-700/80 text-slate-100 rounded-tl-none'
                      }`}
                      dir="rtl"
                    >
                      <div>{msg.text}</div>
                      <div className={`text-[10px] mt-1.5 flex items-center gap-1 font-mono ${msg.sender === 'user' ? 'text-emerald-200 justify-end' : 'text-slate-400 justify-start'}`} dir="ltr">
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
                  <div className="bg-[#202c33] border border-slate-700 text-emerald-300 text-xs px-4 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="font-arabic" dir="rtl">جاري كتابة الرد التلقائي بالذكاء الاصطناعي...</span>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Custom Input Box */}
            <form onSubmit={handleSendCustom} className="p-3 bg-[#202c33] border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="اكتب رسالة بالعامية المصرية أو السعودية واختبر الرد..."
                className="flex-1 bg-[#111b21] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 font-arabic text-right"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={isProcessing || !customInput.trim()}
                className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all shadow-lg shadow-emerald-500/30"
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

// ── Interactive ROI & Cost Savings Calculator Component ──
function InteractiveRoiCalculator() {
  const [conversations, setConversations] = useState<number>(50000);

  // Calculations
  const hoursSaved = Math.round((conversations * 4) / 60);
  const dollarsSaved = Math.round(hoursSaved * 7.5);
  const resolutionRate = 84;
  const roiMultiplier = ((dollarsSaved / 149) * 10).toFixed(1);

  return (
    <div className="glass-panel p-8 lg:p-12 rounded-3xl border border-emerald-500/20 relative overflow-hidden dark-cyber-bg">
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30">
              Interactive ROI Estimator
            </span>
            <h3 className="font-display text-3xl font-extrabold text-white mt-3 mb-2 tracking-tight">
              Calculate Your Support Cost Reductions
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Drag the slider below to match your estimated monthly WhatsApp customer conversation volume and discover instant savings.
            </p>
          </div>

          {/* Slider */}
          <div className="space-y-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400 font-bold">Monthly WhatsApp Conversations:</span>
              <span className="font-display text-2xl font-extrabold text-emerald-400 font-mono">
                {conversations.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min={5000}
              max={300000}
              step={5000}
              value={conversations}
              onChange={(e) => setConversations(Number(e.target.value))}
              className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500">
              <span>5,000 / mo</span>
              <span>150,000 / mo</span>
              <span>300,000 / mo</span>
            </div>
          </div>
        </div>

        {/* Result Metrics */}
        <div className="lg:col-span-6 grid grid-cols-2 gap-4">
          <div className="bg-slate-900/90 border border-emerald-500/30 p-6 rounded-2xl text-center relative overflow-hidden group">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase mb-1">Monthly Cost Saved</div>
            <div className="text-3xl lg:text-4xl font-extrabold font-display text-emerald-400 font-mono">
              ${dollarsSaved.toLocaleString()}
            </div>
            <div className="text-[11px] text-emerald-400/80 mt-2 font-arabic" dir="rtl">وفر يصل إلى {dollarsSaved * 50} جـ/ر.س</div>
          </div>

          <div className="bg-slate-900/90 border border-teal-500/30 p-6 rounded-2xl text-center relative overflow-hidden">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase mb-1">Agent Hours Saved</div>
            <div className="text-3xl lg:text-4xl font-extrabold font-display text-teal-300 font-mono">
              {hoursSaved.toLocaleString()} hrs
            </div>
            <div className="text-[11px] text-teal-300/80 mt-2">Freeing agents for complex VIP issues</div>
          </div>

          <div className="bg-slate-900/90 border border-amber-500/30 p-6 rounded-2xl text-center relative overflow-hidden">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase mb-1">Automated Resolution</div>
            <div className="text-3xl lg:text-4xl font-extrabold font-display text-amber-400 font-mono">
              {resolutionRate}%
            </div>
            <div className="text-[11px] text-amber-400/80 mt-2">Zero human agent intervention needed</div>
          </div>

          <div className="bg-slate-900/90 border border-emerald-500/30 p-6 rounded-2xl text-center relative overflow-hidden bg-gradient-to-br from-emerald-950/40 to-slate-900">
            <div className="text-xs font-mono font-bold text-emerald-400 uppercase mb-1">Projected ROI</div>
            <div className="text-3xl lg:text-4xl font-extrabold font-display text-white font-mono">
              {roiMultiplier}x
            </div>
            <div className="text-[11px] text-emerald-400 font-bold mt-2">Return on Platform Investment</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Interactive Dark Pricing Component ──
function InteractivePricing() {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: 'Starter Agent',
      nameAr: 'البداية الذكية',
      desc: 'Ideal for growing e-commerce stores launching their first Arabic WhatsApp bot.',
      priceMonthly: 49,
      priceYearly: 39,
      messages: 'Up to 5,000 Contacts',
      bots: '1 Active WhatsApp Bot',
      features: [
        'Google Gemini AI Engine Integration',
        'Egyptian, Saudi & MSA Dialect Understanding',
        'Basic Safety Rules & Discount Limits',
        'RAG Knowledge Base (Up to 25 Documents)',
        'Human Escalation Handoff Queue',
        'Email & Community Support',
      ],
      popular: false,
      cta: 'Start 14-Day Free Trial',
    },
    {
      name: 'Pro Business',
      nameAr: 'الاحترافي للأعمال',
      desc: 'Designed for scaling brands needing full dialect coverage and guardrails.',
      priceMonthly: 119,
      priceYearly: 89,
      messages: 'Up to 25,000 Contacts',
      bots: '5 Active WhatsApp Bots',
      features: [
        'All Arabic Dialects (Egyptian, Saudi, Levantine, MSA)',
        'Multi-Agent Routing (Sales, Support, Complaints)',
        'Persistent Customer Profiles (CDP) & Notes',
        'Full Guardrails Engine (PII Masking & Discount Cap)',
        'Unlimited RAG Vector Search Knowledge Base',
        'Multi-Agent Live Handoff Workspace',
        'Priority 24/7 WhatsApp Support',
      ],
      popular: true,
      cta: 'Get Started Pro',
    },
    {
      name: 'Enterprise Scale',
      nameAr: 'المؤسسات الكبرى',
      desc: 'Tailored solutions for enterprises requiring custom SLA and dedicated cloud.',
      priceMonthly: 349,
      priceYearly: 279,
      messages: 'Custom Active Contact Tiers',
      bots: 'Unlimited Bots & Workspaces',
      features: [
        'Custom Fine-Tuned Arabic LLM Models',
        'Dedicated SQLite / PostgreSQL Isolated Database',
        'Custom Meta WhatsApp Official API Onboarding',
        '99.99% Guaranteed SLA Uptime',
        'Dedicated Account Manager & Setup Engineer',
        'Custom Security Audit & On-Premises Option',
      ],
      popular: false,
      cta: 'Contact Enterprise Team',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Monthly / Annual Toggle */}
      <div className="flex items-center justify-center gap-4 mb-14">
        <span className={`text-sm font-bold transition-colors ${!isYearly ? 'text-white' : 'text-slate-400'}`}>Monthly Billing</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="w-14 h-8 bg-slate-900 rounded-full p-1 relative border border-slate-700 transition-colors"
        >
          <motion.div
            animate={{ x: isYearly ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-6 h-6 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/50"
          />
        </button>
        <span className={`text-sm font-bold flex items-center gap-2 transition-colors ${isYearly ? 'text-white' : 'text-slate-400'}`}>
          Annual Billing <span className="bg-emerald-500/20 text-emerald-300 text-xs px-2.5 py-0.5 rounded-full font-extrabold border border-emerald-500/30">Save 20%</span>
        </span>
      </div>

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, idx) => (
          <motion.div
            key={idx}
            whileHover={{ y: -6 }}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
              plan.popular
                ? 'bg-slate-900 text-white border-2 border-emerald-500 shadow-2xl shadow-emerald-500/25 scale-[1.03] glow-border-emerald'
                : 'glass-panel text-white border border-slate-800 hover:border-slate-700'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-extrabold text-xs uppercase px-4 py-1 rounded-full shadow-lg tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Most Popular Choice
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-2xl font-extrabold text-white">{plan.name}</h3>
                <span className={`font-arabic text-xs font-bold ${plan.popular ? 'text-emerald-400' : 'text-slate-400'}`} dir="rtl">
                  {plan.nameAr}
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">{plan.desc}</p>

              <div className="mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-display text-white">${isYearly ? plan.priceYearly : plan.priceMonthly}</span>
                  <span className="text-xs text-slate-400">/ month</span>
                </div>
                <p className="text-xs font-bold mt-2 text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" /> {plan.messages} • {plan.bots}
                </p>
              </div>

              <ul className="space-y-3 text-xs mb-8 text-slate-300">
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className={`w-full btn justify-center py-3.5 rounded-xl font-bold transition-all ${
                plan.popular
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
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

// ── Main Landing Page Component (Ultra-Premium Dark Theme) ──
export default function Landing() {
  return (
    <div className="min-h-screen dark-cyber-bg text-slate-100 font-body selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* ── Floating Cyber Glass Navbar ── */}
      <header className="sticky top-4 z-50 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="glass-panel rounded-2xl px-6 h-18 flex items-center justify-between border border-emerald-500/20 shadow-2xl">
          <Link to="/" className="group">
            <Logo size="md" />
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#demo" className="hover:text-emerald-400 transition-colors">Live Playground</a>
            <a href="#architecture" className="hover:text-emerald-400 transition-colors">Architecture</a>
            <a href="#calculator" className="hover:text-emerald-400 transition-colors">ROI Calculator</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Capabilities</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-3 sm:gap-4">
            <Link to="/login" className="font-bold text-sm text-slate-300 hover:text-white transition-colors px-3 py-2">
              Sign In
            </Link>
            <Link to="/register" className="btn bg-emerald-500 hover:bg-emerald-600 text-white text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-emerald-500/25 hover:scale-105 transition-all font-bold">
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero Section ── */}
      <section className="relative pt-20 pb-20 px-6 max-w-7xl mx-auto overflow-hidden cyber-grid-bg">
        {/* Glowing Ambient Background Orbs */}
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-[130px] -z-10 animate-float-slow"></div>
        <div className="absolute top-40 right-10 w-80 h-80 bg-teal-500/15 rounded-full blur-[110px] -z-10 animate-float"></div>

        <div className="text-center max-w-4xl mx-auto mb-16">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
            {/* Live Engine Status Badge */}
            <motion.div variants={fadeInUp} className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-900/90 border border-emerald-500/30 shadow-lg text-emerald-400 text-xs font-mono font-bold uppercase tracking-wider mb-8">
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>META WHATSAPP OFFICIAL API • GEMINI ARABIC LLM v2.4 ONLINE</span>
            </motion.div>

            {/* Main Headline */}
            <motion.h1 variants={fadeInUp} className="font-display text-5xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.08] mb-6">
              Transform WhatsApp into an <br className="hidden sm:inline" />
              <span className="text-gradient-emerald">
                Autonomous Arabic AI Workforce
              </span>
            </motion.h1>

            {/* Arabic Tagline & English Subtitle */}
            <motion.p variants={fadeInUp} className="font-arabic text-xl sm:text-2xl text-emerald-300 font-bold mb-4" dir="rtl">
              منصة وكلاء الواتساب الذكية بتفهم كل اللهجات العربية بدقة 99.4% مع حماية كاملة للمتجر
            </motion.p>
            <motion.p variants={fadeInUp} className="font-body text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Deploy native Egyptian, Saudi, Levantine & Gulf dialect AI agents with automated guardrail safety, persistent customer memory (CDP), and 1-click human agent handoffs.
            </motion.p>

            {/* Action Buttons */}
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-4 text-base shadow-xl shadow-emerald-500/30 w-full sm:w-auto justify-center rounded-2xl hover:scale-105 transition-all font-bold">
                <span>Start Building Free</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#demo" className="btn glass-panel text-white border border-emerald-500/30 hover:border-emerald-400 px-8 py-4 text-base shadow-sm w-full sm:w-auto justify-center font-bold rounded-2xl hover:bg-slate-800/80 transition-all">
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>Test Live Engine Demo</span>
              </a>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating Metrics Counter Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mt-12">
          <CountingStatCard label="Active Conversations" target={5400000} suffix="+" change="+38% MoM" up={true} />
          <CountingStatCard label="Arabic Intent Accuracy" target={99} suffix=".4%" change="Target Met" up={true} />
          <CountingStatCard label="Sub-Second Latency" target={320} suffix="ms" change="Sub-Second" up={true} />
          <CountingStatCard label="Support Cost Savings" target={82} suffix="%" change="-82% Expenses" up={true} />
        </div>
      </section>

      {/* ── Live Interactive Engine Demo Section ── */}
      <section id="demo" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
            Interactive Playground
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-white mt-3 mb-3 tracking-tight">
            Try The Live WhatsApp Arabic Engine
          </h2>
          <p className="font-body text-slate-300 text-base">
            Select a dialect tab or type your own regional Arabic message to test the NLU pipeline, guardrail check, and automated response speed.
          </p>
        </div>
        <InteractiveEnginePlayground />
      </section>

      {/* ── Architecture Pipeline Section ── */}
      <section id="architecture" className="py-24 px-6 bg-slate-950/60 border-y border-slate-800 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
              System Architecture
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mt-3 mb-4 tracking-tight">
              Enterprise Arabic AI Agent Pipeline
            </h2>
            <p className="text-slate-300 text-base sm:text-lg">
              From incoming WhatsApp webhook to Guardrail Firewall and CDP profile injection in under 350ms.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-4 relative">
            {/* Step 1 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center relative space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center font-mono font-bold text-lg">
                01
              </div>
              <h4 className="font-display font-extrabold text-white text-base">Meta Webhook</h4>
              <p className="text-xs text-slate-400">Receives WhatsApp text or audio voice note message.</p>
            </div>

            {/* Step 2 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center relative space-y-3">
              <div className="w-12 h-12 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 mx-auto flex items-center justify-center font-mono font-bold text-lg">
                02
              </div>
              <h4 className="font-display font-extrabold text-white text-base">Dialect NLU</h4>
              <p className="text-xs text-slate-400">Normalizes Egyptian, Saudi, Levantine & Franco-Arabic.</p>
            </div>

            {/* Step 3 */}
            <div className="glass-panel p-6 rounded-2xl border border-emerald-500/40 text-center relative space-y-3 glow-border-emerald">
              <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 mx-auto flex items-center justify-center font-mono font-bold text-lg">
                03
              </div>
              <h4 className="font-display font-extrabold text-white text-base">Safety Guardrails</h4>
              <p className="text-xs text-slate-300">Sanitizes inputs, masks PII & caps max discount claims.</p>
            </div>

            {/* Step 4 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center relative space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center font-mono font-bold text-lg">
                04
              </div>
              <h4 className="font-display font-extrabold text-white text-base">Gemini LLM Router</h4>
              <p className="text-xs text-slate-400">Executes specialist prompt personas with RAG knowledge.</p>
            </div>

            {/* Step 5 */}
            <div className="glass-panel p-6 rounded-2xl border border-slate-800 text-center relative space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center font-mono font-bold text-lg">
                05
              </div>
              <h4 className="font-display font-extrabold text-white text-base">CDP & Handoff</h4>
              <p className="text-xs text-slate-400">Updates customer profile & routes complex cases to human agents.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive ROI Estimator Section ── */}
      <section id="calculator" className="py-24 px-6 max-w-7xl mx-auto">
        <InteractiveRoiCalculator />
      </section>

      {/* ── Capabilities Bento Grid ── */}
      <section id="features" className="py-24 px-6 bg-slate-950/80 border-t border-slate-800">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
              Core Capabilities
            </span>
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mt-3 mb-4 tracking-tight">
              Built Specifically for E-Commerce & Retail in MENA
            </h2>
            <p className="font-body text-slate-300 text-lg">
              Deliver reliable, high-converting WhatsApp automation in Saudi Arabia, Egypt, UAE, Kuwait, and across the region.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Bento Card 1: Dialect Intelligence */}
            <motion.div
              whileHover={{ y: -4 }}
              className="lg:col-span-2 glass-panel p-8 sm:p-10 rounded-3xl border border-emerald-500/30 relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl flex items-center justify-center mb-6 shadow-lg">
                  <Globe className="w-7 h-7" />
                </div>
                <h3 className="font-display text-3xl font-extrabold text-white mb-2">Native Dialect Intelligence</h3>
                <p className="font-arabic text-sm text-emerald-300 font-bold mb-4" dir="rtl">فهم الفصحى والعاميات المصرية، السعودية، الخليجية والشامية</p>
                <p className="text-slate-300 text-base max-w-xl leading-relaxed mb-6">
                  Standard AI models struggle with regional Arabic slang. ArabBot's normalization layer maps local idioms into structured intent definitions with 99.4% accuracy.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center font-bold text-xs text-slate-200">🇪🇬 Egyptian</div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center font-bold text-xs text-slate-200">🇸🇦 Saudi / Gulf</div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center font-bold text-xs text-slate-200">🇱🇧 Levantine</div>
                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-center font-bold text-xs text-slate-200">🌍 Standard MSA</div>
              </div>
            </motion.div>

            {/* Bento Card 2: AI Guardrails & Safety Engine */}
            <motion.div
              whileHover={{ y: -4 }}
              className="glass-panel p-8 sm:p-10 rounded-3xl border border-teal-500/30 relative overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="w-14 h-14 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-2xl flex items-center justify-center mb-6">
                  <ShieldAlert className="w-7 h-7" />
                </div>
                <h3 className="font-display text-2xl font-extrabold text-white mb-2">AI Guardrails Engine</h3>
                <p className="font-arabic text-xs text-teal-300 font-bold mb-4" dir="rtl">حماية الردود ومنع تقديم خصومات عشوائية</p>
                <p className="text-slate-300 text-sm leading-relaxed mb-6">
                  Enforce strict safety rules. Block unauthorized discount claims, censor forbidden words, enforce return policies, and prevent hallucinations.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between text-xs font-mono text-emerald-300">
                <span>Discount Cap: 30% Max</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded border border-emerald-500/30">Auto Sanitize</span>
              </div>
            </motion.div>

            {/* Bento Card 3: Specialist Agent Routing */}
            <motion.div
              whileHover={{ y: -4 }}
              className="glass-panel p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mb-6 border border-emerald-500/30">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-white mb-2">Specialist Agent Routing</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Route sales, order tracking, and complaints to specialized AI agent personas with dedicated instructions.
              </p>
              <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Sales, Support & Order Agents
              </div>
            </motion.div>

            {/* Bento Card 4: Customer Memory CDP */}
            <motion.div
              whileHover={{ y: -4 }}
              className="glass-panel p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-teal-500/20 text-teal-300 rounded-2xl flex items-center justify-center mb-6 border border-teal-500/30">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-white mb-2">Customer CDP & Memory</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Build persistent customer profiles across conversations. Tag VIP buyers, save agent notes, and inject history into prompts.
              </p>
              <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-400" /> Cross-Session Context Retention
              </div>
            </motion.div>

            {/* Bento Card 5: RAG Vector Knowledge */}
            <motion.div
              whileHover={{ y: -4 }}
              className="glass-panel p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/30 transition-all"
            >
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-display text-xl font-extrabold text-white mb-2">RAG Knowledge Search</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Upload store FAQs, PDF catalogs, or return policies. ArabBot indexes knowledge items for instant grounded retrieval.
              </p>
              <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> Grounded Business Truth
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-emerald-400 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-500/10 px-3.5 py-1.5 rounded-full border border-emerald-500/20">
            Transparent Pricing
          </span>
          <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mt-3 mb-3 tracking-tight">
            Flexible Plans for Every Scale
          </h2>
          <p className="font-body text-slate-300 text-lg">
            Start with our 14-day free trial. No credit card required. Upgrade as your WhatsApp contact volume grows.
          </p>
        </div>

        <InteractivePricing />
      </section>

      {/* ── Testimonials Section ── */}
      <section className="py-24 px-6 bg-slate-950/60 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-4xl font-extrabold text-white mb-3 tracking-tight">
              Trusted by Leading MENA Brands
            </h2>
            <p className="font-body text-slate-300 text-lg">See how businesses across Egypt, KSA, and UAE deliver instant Arabic support.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="font-arabic text-slate-200 text-sm leading-relaxed mb-6" dir="rtl">
                  "البوت أحدث نقلة نوعية في متجرنا بالرياض. العملاء بيتكلموا باللهجة السعودية والبوت بيرد في ثواني بنفس الأسلوب ومؤمن بقواعد الأمان!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center text-sm">
                  م.ش
                </div>
                <div>
                  <div className="font-bold text-white text-sm">محمد الشمري</div>
                  <div className="text-xs text-slate-400">مؤسس متجر الفخامة • الرياض</div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="font-arabic text-slate-200 text-sm leading-relaxed mb-6" dir="rtl">
                  "سجل العملاء CDP والتحويل للبشر ممتاز جداً. البوت بيتعرف على العميل الـ VIP وبيظهر للـ Agent كل تاريخ المحادثات والملاحظات!"
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <div className="w-10 h-10 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-bold flex items-center justify-center text-sm">
                  س.ع
                </div>
                <div>
                  <div className="font-bold text-white text-sm">سارة عبد الرحمن</div>
                  <div className="text-xs text-slate-400">مديرة خدمة العملاء • القاهرة</div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-8 rounded-3xl border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="font-arabic text-slate-200 text-sm leading-relaxed mb-6" dir="rtl">
                  "قواعد الأمان منعت تماماً تقديم أي خصومات غير مصرح بها. الـ Guardrails بتفلتر الردود قبل ما توصل للواتساب بدون أي تأخير."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold flex items-center justify-center text-sm">
                  ط.خ
                </div>
                <div>
                  <div className="font-bold text-white text-sm">طارق الخالد</div>
                  <div className="text-xs text-slate-400">رئيس العمليات • دبي</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── High-Impact Call to Action Banner ── */}
      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="glass-panel rounded-3xl p-10 lg:p-16 border border-emerald-500/30 text-center relative overflow-hidden dark-cyber-bg glow-emerald">
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="font-display text-4xl sm:text-5xl font-extrabold text-white mb-6 tracking-tight">
              Ready to Automate Your WhatsApp Support in Arabic?
            </h2>
            <p className="font-body text-lg text-slate-300 mb-10 leading-relaxed">
              Join hundreds of high-growth e-commerce brands delivering instant, natural dialect AI support on WhatsApp today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register" className="btn bg-emerald-500 hover:bg-emerald-600 text-white px-10 py-4 text-lg font-bold shadow-xl shadow-emerald-500/30 rounded-2xl hover:scale-105 transition-all">
                Launch Free Agent Studio
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sleek Cyber Footer ── */}
      <footer className="border-t border-slate-800 py-12 px-6 bg-slate-950 text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <Link to="/" className="group">
            <Logo size="sm" showSubtitle={false} />
          </Link>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>SYSTEM STATUS: 99.99% OPERATIONAL</span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <a href="#demo" className="hover:text-emerald-400 transition-colors">Playground</a>
            <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-emerald-400 transition-colors">Pricing</a>
            <Link to="/login" className="hover:text-emerald-400 transition-colors">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
