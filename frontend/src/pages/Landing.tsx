import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants, useInView } from 'framer-motion';
import {
  Bot, ArrowRight, CheckCircle2, Sparkles, Cpu,
  Send, Lock, ChevronRight, Database, Star,
  ShoppingBag, Headphones, ShieldCheck,
  Play, Pause, ChevronDown,
  TrendingUp, Clock, DollarSign
} from 'lucide-react';
import { useCountUp } from '../lib/useCountUp';
import Logo from '../components/Logo';

// ── Dialect Showcase Data ──
interface DialectOption {
  id: 'egyptian' | 'saudi' | 'emirati' | 'levantine' | 'moroccan' | 'msa';
  flag: string;
  name: string;
  nameAr: string;
  code: string;
  sampleInput: string;
  normalized: string;
  intent: string;
  intentAr: string;
  botReply: string;
  latency: string;
  confidence: number;
  audioDuration: string;
}

const dialectDemos: DialectOption[] = [
  {
    id: 'egyptian',
    flag: '🇪🇬',
    name: 'Egyptian Arabic',
    nameAr: 'العامية المصرية',
    code: 'EG',
    sampleInput: 'سلام عليكم يا باشا، عايز اعرف مصاريف الشحن للقاهرة بكام وبتاخد كام يوم لو سمحت؟',
    normalized: 'السلام عليكم، أرغب في معرفة تكلفة وسرعة الشحن إلى محافظة القاهرة.',
    intent: 'SHIPPING_INQUIRY',
    intentAr: 'استفسار تكلفة الشحن وموعد التوصيل',
    botReply: 'أهلاً بحضرتك يا فندم! الشحن للقاهرة بـ 35 جنيه وبيوصلك خلال 24 لـ 48 ساعة فقط. تحب أسجل لحضرتك الطلب دلوقتي؟',
    latency: '240ms',
    confidence: 99.8,
    audioDuration: '0:06',
  },
  {
    id: 'saudi',
    flag: '🇸🇦',
    name: 'Saudi & Gulf',
    nameAr: 'العامية السعودية والخليجية',
    code: 'KSA',
    sampleInput: 'هلا والله طال عمرك، كم سعر التوصيل للرياض وهل عندكم دفع عند الاستلام؟',
    normalized: 'مرحباً، ما هي تكلفة التوصيل إلى مدينة الرياض وهل توجد خدمة الدفع عند الاستلام؟',
    intent: 'PAYMENT_AND_SHIPPING',
    intentAr: 'استفسار الدفع والتوصيل السريع',
    botReply: 'هلا وغلا حياك الله! التوصيل للرياض بـ 25 ريال ومجاني للطلبات فوق 200 ريال. ونعم، الدفع عند الاستلام متاح بجميع المناطق!',
    latency: '220ms',
    confidence: 99.7,
    audioDuration: '0:05',
  },
  {
    id: 'emirati',
    flag: '🇦🇪',
    name: 'Emirati Arabic',
    nameAr: 'العامية الإماراتية',
    code: 'UAE',
    sampleInput: 'مرحبا الساع، متى يوصل الطلب لدبي؟ وفي ضمان ذهبي على الجهاز؟',
    normalized: 'مرحباً، متى يصل الطلب إلى مدينة دبي وهل يوجد ضمان شامل على الجهاز؟',
    intent: 'DELIVERY_AND_WARRANTY',
    intentAr: 'موعد التوصيل وسياسة الضمان',
    botReply: 'مرحبا الساع يا مرحبا! التوصيل لدبي خلال 24 ساعة، وجميع أجهزتنا معها ضمان ذهبي شامل لمدة سنة كاملة.',
    latency: '230ms',
    confidence: 99.5,
    audioDuration: '0:04',
  },
  {
    id: 'levantine',
    flag: '🇯🇴',
    name: 'Levantine Arabic',
    nameAr: 'العامية الشامية',
    code: 'LEV',
    sampleInput: 'مرحبا، قديش بياخد وقت التوصيل لعمان؟ وفي إمكانية للتبديل إذا ما عجبني؟',
    normalized: 'مرحباً، كم يستغرق وقت التوصيل إلى عمان وهل توجد سياسة استبدال مجانية؟',
    intent: 'EXCHANGE_AND_DELIVERY',
    intentAr: 'مدة التوصيل وسياسة الاستبدال',
    botReply: 'أهلاً وسهلاً بك! التوصيل بياخد يومين. وأكيد الاستبدال متاح مجاناً خلال 14 يوم من تاريخ الاستلام بكل سهولة.',
    latency: '260ms',
    confidence: 99.4,
    audioDuration: '0:05',
  },
  {
    id: 'moroccan',
    flag: '🇲🇦',
    name: 'Moroccan Darija',
    nameAr: 'الدارجة المغربية',
    code: 'MAR',
    sampleInput: 'السلام عليكم، واش كاين التوصيل لكازا وشحال كاياخد ديال الوقت؟',
    normalized: 'السلام عليكم، هل يوجد توصيل إلى مدينة الدار البيضاء وكم يستغرق من الوقت؟',
    intent: 'LOCAL_DELIVERY_TIMELINE',
    intentAr: 'التوصيل المحلي ومدة الوصول',
    botReply: 'وعليكم السلام يا سيدي! التوصيل لكازا متوفر فـ 24 ساعة فقط، والتوصيل مجاني للطلبات فوق 300 درهم.',
    latency: '250ms',
    confidence: 99.2,
    audioDuration: '0:05',
  },
  {
    id: 'msa',
    flag: '🌍',
    name: 'Modern Standard Arabic',
    nameAr: 'الفصحى المعاصرة',
    code: 'MSA',
    sampleInput: 'السلام عليكم ورحمة الله، ما هي سياسة الضمان والاسترجاع المعتمدة لديكم؟',
    normalized: 'السلام عليكم ورحمة الله، ما هي سياسة الضمان والاسترجاع المعتمدة لديكم؟',
    intent: 'WARRANTY_POLICY',
    intentAr: 'سياسة الضمان والاسترجاع الرسمي',
    botReply: 'وعليكم السلام ورحمة الله وبركاته، جميع منتجاتنا مغطاة بضمان ذهبي لمدة عام، مع إمكانية الاسترجاع الشامل خلال 14 يوماً.',
    latency: '210ms',
    confidence: 99.9,
    audioDuration: '0:06',
  },
];

// ── Motion Variants ──
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// ── Stat Card Component ──
function ArabicStatCard({ label, labelAr, target, suffix, subtitleAr }: { label: string; labelAr: string; target: number; suffix: string; subtitleAr: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-40px" });
  const count = useCountUp(target, 1400, isInView);
  const displayCount = target >= 1000000 ? (count / 1000000).toFixed(1) + 'M' : target >= 1000 ? (count / 1000).toFixed(1) + 'K' : count;

  return (
    <div ref={ref} className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 bg-terracotta-500/5 rounded-bl-full pointer-events-none group-hover:scale-125 transition-transform" />
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-ash-500 uppercase tracking-wider">{label}</span>
        <span className="font-arabic text-xs font-bold text-terracotta-600" dir="rtl">{labelAr}</span>
      </div>
      <div className="text-3xl font-extrabold text-navy-900 font-display tracking-tight">{displayCount}{suffix}</div>
      <p className="text-xs text-terracotta-600 font-medium font-arabic mt-1" dir="rtl">{subtitleAr}</p>
    </div>
  );
}

// ── Interactive WhatsApp Dialect Studio Simulator ──
function InteractiveEnginePlayground() {
  const [selectedDialect, setSelectedDialect] = useState<DialectOption>(dialectDemos[0]);
  const [customInput, setCustomInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [mode, setMode] = useState<'text' | 'voice'>('text');

  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string; isVoice?: boolean }>>([
    { sender: 'user', text: dialectDemos[0].sampleInput, time: '10:42 ص' },
    { sender: 'bot', text: dialectDemos[0].botReply, time: '10:42 ص' }
  ]);

  const handleSelectDialect = (dialect: DialectOption) => {
    setSelectedDialect(dialect);
    setIsProcessing(true);
    setIsPlayingAudio(false);

    setTimeout(() => {
      setIsProcessing(false);
      setMessages([
        { 
          sender: 'user', 
          text: mode === 'voice' ? `🎙️ رسالة صوتية بالعامية (${dialect.audioDuration})` : dialect.sampleInput, 
          time: 'الآن',
          isVoice: mode === 'voice'
        },
        { sender: 'bot', text: dialect.botReply, time: 'الآن' }
      ]);
    }, 450);
  };

  const handleSendCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customInput.trim()) return;

    const userText = customInput;
    setCustomInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userText, time: 'الآن' }]);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `أهلاً بك! تم فهم استفسارك بالعامية وتحليله بنجاح: "${userText}". محرك ArabBot جاهز لتأكيد طلبك فورا!`,
          time: 'الآن'
        }
      ]);
    }, 600);
  };

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-10 border border-sand-200 shadow-xl text-ash-700 relative overflow-hidden">
      {/* Background Decorative Ambient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-terracotta-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold-400/5 rounded-full blur-3xl pointer-events-none" />

      <div className="grid lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Controls & Dialect Studio */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-terracotta-50 text-terracotta-700 border border-terracotta-200 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-terracotta-500" /> 
              <span>مختبر لهجات الذكاء الاصطناعي الحي</span>
            </div>
            <h3 className="font-display text-2xl lg:text-3xl font-extrabold text-navy-900 mb-2 tracking-tight">
              Test Regional Dialect Normalization
            </h3>
            <p className="text-ash-500 text-sm leading-relaxed font-arabic" dir="rtl">
              اختر إحدى العاميات العربية أدناه لتجربة الفهم الفوري والتطبيع اللغوي مع استخراج نية العميل وحماية العلامة التجارية.
            </p>
          </div>

          {/* Mode Switcher (Text vs Voice Note) */}
          <div className="flex items-center gap-2 p-1 bg-sand-100 rounded-xl max-w-xs" dir="rtl">
            <button
              onClick={() => { setMode('text'); handleSelectDialect(selectedDialect); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all ${
                mode === 'text' ? 'bg-white text-navy-900 shadow-sm' : 'text-ash-500 hover:text-navy-900'
              }`}
            >
              محادثة نصية (Text)
            </button>
            <button
              onClick={() => { setMode('voice'); handleSelectDialect(selectedDialect); }}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'voice' ? 'bg-terracotta-500 text-white shadow-sm' : 'text-ash-500 hover:text-navy-900'
              }`}
            >
              <span>رسائل صوتية</span>
              <span className="text-[10px] px-1 bg-terracotta-600 rounded">جديد</span>
            </button>
          </div>

          {/* Dialect Selector Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {dialectDemos.map((dialect) => (
              <button
                key={dialect.id}
                onClick={() => handleSelectDialect(dialect)}
                className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between group ${
                  selectedDialect.id === dialect.id
                    ? 'bg-navy-900 border-navy-900 text-white shadow-md'
                    : 'bg-sand-50 border-sand-200 text-ash-700 hover:bg-white hover:border-terracotta-300'
                }`}
                dir="rtl"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{dialect.flag}</span>
                  <div>
                    <div className="text-xs font-bold font-arabic">{dialect.nameAr}</div>
                    <div className={`text-[10px] ${selectedDialect.id === dialect.id ? 'text-terracotta-300' : 'text-ash-400'}`}>{dialect.name}</div>
                  </div>
                </div>
                {selectedDialect.id === dialect.id && <CheckCircle2 className="w-4 h-4 text-terracotta-400 shrink-0" />}
              </button>
            ))}
          </div>

          {/* Real-Time Engine Trace HUD */}
          <div className="bg-sand-50 border border-sand-200 rounded-2xl p-4 space-y-3 font-arabic text-xs" dir="rtl">
            <div className="flex items-center justify-between text-ash-500 pb-2 border-b border-sand-200">
              <span className="flex items-center gap-1.5 text-terracotta-700 font-bold">
                <Cpu className="w-4 h-4 text-terracotta-500" /> تحليل المحرك الذكي (AI Normalization Trace)
              </span>
              <span className="font-mono text-terracotta-600 font-bold" dir="ltr">{selectedDialect.latency}</span>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-start gap-3">
                <span className="text-ash-400 shrink-0">التطبيع إلى الفصحى:</span>
                <span className="text-navy-900 font-medium text-left bg-white px-2.5 py-1 rounded-lg border border-sand-200 leading-normal flex-1">
                  {selectedDialect.normalized}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ash-400">النية المكتشفة (Intent):</span>
                <span className="text-terracotta-700 font-bold bg-terracotta-50 border border-terracotta-200 px-2 py-0.5 rounded text-[11px]">
                  {selectedDialect.intentAr} ({selectedDialect.intent})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ash-400">دقة الفهم (Confidence):</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-sand-200 h-2 rounded-full overflow-hidden">
                    <div className="bg-terracotta-500 h-full rounded-full" style={{ width: `${selectedDialect.confidence}%` }} />
                  </div>
                  <span className="text-terracotta-600 font-bold">{selectedDialect.confidence}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Phone Mockup (WhatsApp Studio Experience) */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm bg-[#0a0f1d] border-2 border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col h-[520px] relative">
            {/* Phone Top Notch / Speaker */}
            <div className="bg-[#0a0f1d] pt-3 pb-1 flex justify-center items-center">
              <div className="w-20 h-3.5 bg-slate-800 rounded-full" />
            </div>

            {/* WhatsApp Header */}
            <div className="bg-[#111827] px-4 py-3 border-b border-slate-800 flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-terracotta-500/20 border border-terracotta-500/40 flex items-center justify-center text-terracotta-400">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold font-arabic text-white">بوت المتجر الذكي</div>
                  <div className="text-[10px] text-terracotta-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> موثق • WhatsApp Business
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                {selectedDialect.code}
              </span>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-[#070b14] flex-1 overflow-y-auto space-y-3 font-arabic" dir="rtl">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-terracotta-600 text-white rounded-tr-none'
                          : 'bg-[#182032] text-sand-50 rounded-tl-none border border-slate-700'
                      }`}
                    >
                      {msg.isVoice ? (
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <button
                            type="button"
                            onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white shrink-0 transition-colors"
                          >
                            {isPlayingAudio ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                          </button>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-1 h-5 text-white/80">
                              <span className={`soundwave-bar ${isPlayingAudio ? '' : 'h-2'}`} />
                              <span className={`soundwave-bar ${isPlayingAudio ? '' : 'h-4'}`} />
                              <span className={`soundwave-bar ${isPlayingAudio ? '' : 'h-3'}`} />
                              <span className={`soundwave-bar ${isPlayingAudio ? '' : 'h-5'}`} />
                              <span className={`soundwave-bar ${isPlayingAudio ? '' : 'h-2'}`} />
                            </div>
                            <div className="flex justify-between text-[9px] text-white/70 font-mono" dir="ltr">
                              <span>{isPlayingAudio ? '0:02' : '0:00'}</span>
                              <span>{selectedDialect.audioDuration}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>{msg.text}</div>
                      )}
                      <div className="text-[9px] mt-1.5 text-slate-300/80 text-left font-mono" dir="ltr">{msg.time}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isProcessing && (
                <div className="flex justify-end">
                  <div className="bg-[#182032] text-terracotta-300 text-xs px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-2 border border-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-terracotta-400 animate-ping" />
                    <span>جاري كتابة الرد بالعامية...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Input Form */}
            <form onSubmit={handleSendCustom} className="p-3 bg-[#111827] border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="اكتب استفسار بالعامية المصرية أو الخليجية..."
                className="flex-1 bg-[#070b14] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-terracotta-500 text-right font-arabic"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={isProcessing || !customInput.trim()}
                className="w-9 h-9 rounded-xl bg-terracotta-500 hover:bg-terracotta-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all shadow-md shadow-terracotta-500/20"
                aria-label="Send custom message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Interactive Multi-Agent Pipeline Section ──
function MultiAgentPipelineSection() {
  const [activeStep, setActiveStep] = useState(2);

  const steps = [
    {
      id: 1,
      titleAr: 'استقبال الرسالة والتطبيع',
      titleEn: '1. Ingestion & Normalization',
      descAr: 'تحليل لهجة العميل بدقة، إزالة الكلمات الزائدة، وتحويل العبارات العامية إلى سياق لغوي واضح.',
      badge: 'Dialect Normalizer',
      codeSnippet: 'detect_dialect(msg) ➔ "EG_CAIRO"\nclean_slang("يا باشا") ➔ normalized_intent',
    },
    {
      id: 2,
      titleAr: 'توجيه الوكلاء المتخصصين',
      titleEn: '2. Multi-Agent Routing',
      descAr: 'توجيه السؤال تلقائياً لأفضل وكيل ذكاء اصطناعي متخصص (مبيعات، دعم فني، أو شكاوى).',
      badge: 'Agent Router',
      codeSnippet: 'route_agent(intent="SHIPPING")\n➔ Target: "Sales & Logistics Specialist Agent"',
    },
    {
      id: 3,
      titleAr: 'تطبيق قواعد الأمان وحماية البراند',
      titleEn: '3. Guardrails Engine',
      descAr: 'فحص فوري لمنع تسريب الخصومات (أقصى خصم 15%)، حظر أسماء المنافسين، وإخفاء البيانات الحساسة.',
      badge: 'Brand Guardrails',
      codeSnippet: 'guardrails.verify(response)\n➔ MaxDiscount: Pass (15%)\n➔ CompetitorCheck: Clean',
    },
    {
      id: 4,
      titleAr: 'الرد الفوري وتحديث سجل العميل',
      titleEn: '4. Instant WhatsApp Response & CDP',
      descAr: 'إرسال الرد للعميل في أقل من 300 مللي ثانية وتحديث تفضيلات العميل تلقائياً في الـ CDP.',
      badge: 'CDP Sync & WhatsApp API',
      codeSnippet: 'whatsapp.send_message(user_id, reply)\ncdp.update_tags(user_id, ["VIP_LEAD"])',
    },
  ];

  return (
    <div className="py-20 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <span className="text-terracotta-700 font-mono text-xs font-bold uppercase tracking-wider bg-terracotta-50 px-3.5 py-1.5 rounded-full border border-terracotta-200">
          الهيكلية المتقدمة (AI Architecture)
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight font-arabic" dir="rtl">
          كيف يعمل نظام الوكلاء المتعددين وقواعد الأمان؟
        </h2>
        <p className="text-ash-500 text-sm leading-relaxed">
          How ArabBot routes messages between specialized AI agents and guarantees strict business safety.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 items-center">
        {/* Step Navigation Buttons */}
        <div className="lg:col-span-6 space-y-3">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => setActiveStep(step.id)}
              className={`w-full p-5 rounded-2xl border text-right transition-all flex items-start justify-between ${
                activeStep === step.id
                  ? 'bg-white border-terracotta-400 shadow-lg shadow-terracotta-500/5 ring-2 ring-terracotta-400/20'
                  : 'bg-white/60 border-sand-200 hover:bg-white hover:border-sand-300'
              }`}
              dir="rtl"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono ${
                    activeStep === step.id ? 'bg-terracotta-500 text-white' : 'bg-sand-200 text-ash-500'
                  }`}>
                    {step.id}
                  </span>
                  <h4 className="font-arabic font-bold text-base text-navy-900">{step.titleAr}</h4>
                </div>
                <p className="text-xs font-semibold text-ash-400" dir="ltr">{step.titleEn}</p>
                <p className="text-xs text-ash-500 leading-relaxed font-arabic pt-1">{step.descAr}</p>
              </div>
              <span className={`text-[11px] font-mono px-2.5 py-1 rounded-full font-bold shrink-0 ${
                activeStep === step.id ? 'bg-terracotta-50 text-terracotta-700 border border-terracotta-200' : 'bg-sand-100 text-ash-500'
              }`}>
                {step.badge}
              </span>
            </button>
          ))}
        </div>

        {/* Live Step Code / Data Packet Inspector */}
        <div className="lg:col-span-6">
          <div className="bg-[#080c14] border border-slate-800 rounded-3xl p-6 shadow-2xl text-sand-50 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono text-slate-400 ml-2">pipeline_telemetry.ts</span>
              </div>
              <span className="text-[11px] font-mono text-terracotta-400 bg-terracotta-500/10 px-2.5 py-0.5 rounded border border-terracotta-500/20">
                Active Step {activeStep} of 4
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-xs font-mono text-slate-400 mb-1">// Real-Time Processing Execution</div>
                <pre className="bg-[#0e1422] p-4 rounded-xl font-mono text-xs text-terracotta-300 overflow-x-auto border border-slate-800/80 leading-relaxed">
                  {steps[activeStep - 1].codeSnippet}
                </pre>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 font-arabic text-xs space-y-2" dir="rtl">
                <div className="flex items-center justify-between text-terracotta-400 font-bold">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" /> ضمان الجودة والسرعة
                  </span>
                  <span className="font-mono text-slate-400" dir="ltr">&lt; 300ms SLA</span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  تم اختبار الهيكلية بأكثر من 10 مليون محادثة لضمان استقرار البوتات وعدم تقديم أي وعود غير مصرح بها.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Interactive Regional Dialect Explorer ──
function RegionalDialectExplorer() {
  const [activeRegion, setActiveRegion] = useState<'eg' | 'ksa' | 'uae' | 'lev' | 'mar'>('eg');

  const regions = {
    eg: {
      title: 'جمهورية مصر العربية',
      subtitle: 'Egyptian Commerce Market',
      flag: '🇪🇬',
      slangExample: '"عايز دليفري بكره الصبح وممكن خصم لو خدت قطعتين يا هندسة؟"',
      normalized: 'أرغب في استلام شحنة الغد صباحاً، وهل يتوفر عرض على شراء قطعتين؟',
      botResponse: 'منور يا فندم! التوصيل بكره جاهز لحضرتك، وعندنا عرض خصم 15% فوري للقطعة التانية!',
      conversionBoost: '+45%',
      popularCategory: 'الأزياء والإلكترونيات ومستحضرات التجميل',
    },
    ksa: {
      title: 'المملكة العربية السعودية والخليج',
      subtitle: 'Saudi & GCC Retail Market',
      flag: '🇸🇦',
      slangExample: '"هلا وغلا، متى يوصل الطلب للدمام؟ وهل متاح الدفع عند الاستلام طال عمرك؟"',
      normalized: 'مرحباً، متى تصل الشحنة إلى مدينة الدمام وهل توجد خدمة الدفع عند الاستلام؟',
      botResponse: 'يا هلا ومسهلا! التوصيل للدمام بياخذ 24 ساعة فقط، وخدمة الدفع عند الاستلام متاحة مجاناً.',
      conversionBoost: '+52%',
      popularCategory: 'العطور والأجهزة والمتاجر الإلكترونية',
    },
    uae: {
      title: 'دولة الإمارات العربية المتحدة',
      subtitle: 'Emirati & Dubai Fast Commerce',
      flag: '🇦🇪',
      slangExample: '"مرحبا الساع، التوصيل لدبي نفس اليوم؟ وعليكم ضمان شامل؟"',
      normalized: 'مرحباً، هل يتوفر توصيل لنفس اليوم في دبي وهل المنتجات خاضعة لضمان معتمد؟',
      botResponse: 'مرحبا الساع! نعم نوفر خدمة التوصيل السريع خلال نفس اليوم بدبي مع ضمان ذهبي لمدة سنة.',
      conversionBoost: '+48%',
      popularCategory: 'السلع الفاخرة، العقارات والخدمات الفورية',
    },
    lev: {
      title: 'بلاد الشام (الأردن ولبنان)',
      subtitle: 'Levantine Commercial Region',
      flag: '🇯🇴',
      slangExample: '"يسعد مساك، في مجال تبديل المقاس إذا ما طلع مناسب بعد ما يوصل؟"',
      normalized: 'مرحباً، هل تتوفر خدمة استبدال المقاس بعد استلام الشحنة في حال عدم التطابق؟',
      botResponse: 'أهلاً بحضرتك ويسعد مساك! الاستبدال متاح ومجاني 100% خلال 14 يوم بكل بساطة.',
      conversionBoost: '+40%',
      popularCategory: 'المطاعم، الخدمات الطبية والمتاجر المنزلية',
    },
    mar: {
      title: 'المغرب العربي (الدارجة)',
      subtitle: 'North African eCommerce',
      flag: '🇲🇦',
      slangExample: '"واش كاين كود برومو لهاد الطلبية؟ وشحال كاياخد الشحن لمراكش؟"',
      normalized: 'هل يتوفر رمز ترويجي لهذا الطلب، وكم يستغرق الشحن إلى مدينة مراكش؟',
      botResponse: 'مرحبا بيك يا سيدي! الشحن لمراكش كاياخد 48 ساعة فقط وعندنا كود تخفيض 10% هدية ليك.',
      conversionBoost: '+38%',
      popularCategory: 'الصناعات اليدوية، الصحة والملابس',
    },
  };

  const current = regions[activeRegion];

  return (
    <div className="py-20 px-6 max-w-7xl mx-auto bg-sand-50/70 border-y border-sand-200">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <span className="text-terracotta-700 font-mono text-xs font-bold uppercase tracking-wider bg-terracotta-50 px-3.5 py-1.5 rounded-full border border-terracotta-200">
          دليل اللهجات العربية المتخصصة
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight font-arabic" dir="rtl">
          تحدث بلسان عميلك في كل دولة
        </h2>
        <p className="text-ash-500 text-sm leading-relaxed">
          Explore native dialect samples and culturally tailored bot interactions across the Arab world.
        </p>
      </div>

      {/* Region Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-10" dir="rtl">
        {(Object.keys(regions) as Array<keyof typeof regions>).map((key) => (
          <button
            key={key}
            onClick={() => setActiveRegion(key)}
            className={`px-5 py-2.5 rounded-xl font-arabic text-sm font-bold transition-all flex items-center gap-2 ${
              activeRegion === key
                ? 'bg-terracotta-500 text-white shadow-md shadow-terracotta-500/25 scale-105'
                : 'bg-white border border-sand-200 text-ash-700 hover:bg-sand-100'
            }`}
          >
            <span>{regions[key].flag}</span>
            <span>{regions[key].title}</span>
          </button>
        ))}
      </div>

      {/* Display Box */}
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 border border-sand-200 shadow-xl" dir="rtl">
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-7 space-y-5 font-arabic">
            <div>
              <div className="text-xs font-bold text-terracotta-600 mb-1">{current.subtitle}</div>
              <h3 className="font-display text-2xl font-extrabold text-navy-900">{current.title}</h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="p-3.5 bg-sand-50 rounded-xl border border-sand-200">
                <span className="text-xs font-bold text-ash-400 block mb-1">الرسالة بالعامية المحلية:</span>
                <p className="text-navy-900 font-semibold">{current.slangExample}</p>
              </div>

              <div className="p-3.5 bg-terracotta-50/60 rounded-xl border border-terracotta-200">
                <span className="text-xs font-bold text-terracotta-700 block mb-1">رد البوت الذكي بالأسلوب المحلي:</span>
                <p className="text-navy-900 font-medium">{current.botResponse}</p>
              </div>
            </div>
          </div>

          <div className="md:col-span-5 bg-[#080c14] text-sand-50 p-6 rounded-2xl border border-slate-800 space-y-4 text-center">
            <div className="text-xs font-mono text-terracotta-400 uppercase tracking-wider">Conversion Impact</div>
            <div className="text-4xl font-extrabold font-display text-white">{current.conversionBoost}</div>
            <p className="text-xs text-slate-300 font-arabic">
              متوسط زيادة إتمام الطلبات بسبب الثقة بالردود العامية التلقائية.
            </p>
            <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-arabic">
              الأكثر انتشاراً: {current.popularCategory}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Interactive ROI & Savings Calculator ──
function DynamicROICalculator() {
  const [monthlyConversations, setMonthlyConversations] = useState(25000);
  const [agentsCount, setAgentsCount] = useState(4);

  const hoursSaved = Math.round(agentsCount * 75);
  const monthlySavings = Math.round((agentsCount * 750) + (monthlyConversations * 0.02));
  const conversionBoost = 38;

  return (
    <div className="py-20 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <span className="text-terracotta-700 font-mono text-xs font-bold uppercase tracking-wider bg-terracotta-50 px-3.5 py-1.5 rounded-full border border-terracotta-200">
          حاسبة العائد والتوفير (ROI Calculator)
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight font-arabic" dir="rtl">
          احسب كم ساعة ودولار ستوفر شهرياً مع ArabBot
        </h2>
        <p className="text-ash-500 text-sm leading-relaxed">
          Estimate the tangible time and money saved by automating your Arabic WhatsApp customer operations.
        </p>
      </div>

      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-8 lg:p-10 border border-sand-200 shadow-xl">
        <div className="grid md:grid-cols-2 gap-10 items-center">
          {/* Sliders Form */}
          <div className="space-y-6" dir="rtl">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-arabic font-bold">
                <label htmlFor="roi-messages" className="text-navy-900">محادثات الواتساب الشهرية:</label>
                <span className="text-terracotta-600 font-mono text-base font-extrabold">{monthlyConversations.toLocaleString()} رسالة</span>
              </div>
              <input
                id="roi-messages"
                type="range"
                min={2000}
                max={200000}
                step={1000}
                value={monthlyConversations}
                onChange={(e) => setMonthlyConversations(Number(e.target.value))}
                className="w-full h-2.5 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-terracotta-500"
              />
              <div className="flex justify-between text-[10px] text-ash-400 font-mono" dir="ltr">
                <span>2K</span>
                <span>100K</span>
                <span>200K+</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-arabic font-bold">
                <label htmlFor="roi-agents" className="text-navy-900">فريق خدمة العملاء الحالي:</label>
                <span className="text-terracotta-600 font-mono text-base font-extrabold">{agentsCount} موظفين</span>
              </div>
              <input
                id="roi-agents"
                type="range"
                min={1}
                max={30}
                step={1}
                value={agentsCount}
                onChange={(e) => setAgentsCount(Number(e.target.value))}
                className="w-full h-2.5 bg-sand-200 rounded-lg appearance-none cursor-pointer accent-terracotta-500"
              />
              <div className="flex justify-between text-[10px] text-ash-400 font-mono" dir="ltr">
                <span>1 Agent</span>
                <span>15 Agents</span>
                <span>30 Agents</span>
              </div>
            </div>
          </div>

          {/* Real-time Calculation Result Box */}
          <div className="bg-[#080c14] text-sand-50 rounded-2xl p-7 border border-slate-800 space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center justify-center gap-1 text-terracotta-400 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-arabic">ساعات موفرة</span>
                </div>
                <div className="text-3xl font-extrabold font-display text-white">{hoursSaved}h</div>
                <span className="text-[10px] text-slate-400 font-arabic">شهرياً للفريق</span>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
                <div className="flex items-center justify-center gap-1 text-gold-400 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-xs font-arabic">توفير تقديري</span>
                </div>
                <div className="text-3xl font-extrabold font-display text-white">${monthlySavings.toLocaleString()}</div>
                <span className="text-[10px] text-slate-400 font-arabic">شهرياً في المصاريف</span>
              </div>
            </div>

            <div className="p-4 bg-terracotta-500/10 border border-terracotta-500/30 rounded-xl flex items-center justify-between text-xs font-arabic" dir="rtl">
              <span className="text-slate-200 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-terracotta-400" /> نمو معدل إتمام المبيعات:
              </span>
              <span className="text-terracotta-400 font-bold font-display text-sm">+{conversionBoost}% Boost</span>
            </div>

            <Link
              to="/register"
              className="w-full btn bg-terracotta-500 hover:bg-terracotta-600 text-white font-bold justify-center py-3 rounded-xl shadow-lg shadow-terracotta-500/25 transition-all text-center font-arabic"
            >
              ابدأ بتوفير وقت ومصاريف شركتك الآن
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Arabic Use Cases Section ──
function ArabicUseCasesSection() {
  const cases = [
    {
      icon: <ShoppingBag className="w-6 h-6 text-terracotta-600" />,
      titleAr: 'تأكيد المبيعات والطلبات',
      titleEn: 'Sales & Order Conversions',
      descAr: 'رد فوري على استفسارات الأسعار والمواصفات بالعامية المحلية مع تحويل العميل للشراء مباشرة على الواتساب.',
    },
    {
      icon: <Headphones className="w-6 h-6 text-gold-600" />,
      titleAr: 'خدمة العملاء على مدار الساعة',
      titleEn: '24/7 Dialect Customer Service',
      descAr: 'فهم دقيق للعامية المصرية والخليجية والشامية وتوفير إجابات صحيحة فورية من قاعدة معرفتك بدون تأخير.',
    },
    {
      icon: <Lock className="w-6 h-6 text-terracotta-500" />,
      titleAr: 'قواعد حماية العلامة التجارية',
      titleEn: 'Strict Brand Guardrails',
      descAr: 'تحديد سقف الخصومات المسموحة، حجب المنافسين، وحماية معلومات العملاء الحساسة بشكل تلقائي.',
    },
    {
      icon: <Database className="w-6 h-6 text-navy-800 dark:text-sand-50" />,
      titleAr: 'ملفات العملاء الموحدة (CDP)',
      titleEn: 'Unified Arabic Customer Profiles',
      descAr: 'حفظ تلقائي لجميع تفضيلات العميل، تاريخ الطلبات، والملاحظات لتقديم تجربة شخصية مميزة في كل مرة.',
    },
  ];

  return (
    <div className="py-20 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <span className="text-terracotta-700 font-mono text-xs font-bold uppercase tracking-wider bg-terracotta-50 px-3.5 py-1.5 rounded-full border border-terracotta-200">
          استخدامات المنصة في العالم العربي
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight font-arabic" dir="rtl">
          مصمم خصيصاً لاحتياجات المتاجر والشركات العربية
        </h2>
        <p className="text-ash-500 text-sm leading-relaxed">
          Designed specifically for Arabic e-commerce platforms, retail brands, and enterprise service businesses.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cases.map((c, i) => (
          <div key={i} className="bg-white p-7 rounded-2xl border border-sand-200 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-terracotta-50 border border-terracotta-200 flex items-center justify-center">
              {c.icon}
            </div>
            <div>
              <h3 className="font-arabic font-bold text-lg text-navy-900 mb-1" dir="rtl">{c.titleAr}</h3>
              <p className="text-xs font-semibold text-ash-400 mb-3">{c.titleEn}</p>
              <p className="font-arabic text-xs text-ash-500 leading-relaxed" dir="rtl">{c.descAr}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Arabic Testimonials ──
function ArabicTestimonialsSection() {
  const reviews = [
    {
      quoteAr: "زيادة المبيعات بنسبة 48% بعد استخدام بوت الواتساب بالعامية السعودية. الردود سريعة جداً والعملاء منبهرين من الدقة.",
      name: "عبدالعزيز الشمري",
      role: "مدير متجر عطور بالرياض — المملكة العربية السعودية",
    },
    {
      quoteAr: "وفرنا أكثر من 220 ساعة عمل شهرياً لفريق الدعم الفني. البوت يحل 88% من الاستفسارات بالعامية المصرية ببراعة تامة.",
      name: "م. أحمد حسام",
      role: "رئيس قسم التكنولوجيا بالقاهرة — جمهورية مصر العربية",
    },
    {
      quoteAr: "أفضل منصة بوتات جربناها! فهم العامية الإماراتية والشامية وقواعد الأمان حموا علامتنا التجارية بشكل متميز.",
      name: "سارة حداد",
      role: "مديرة تسويق بدبي — الإمارات العربية المتحدة",
    },
  ];

  return (
    <div className="py-20 px-6 max-w-7xl mx-auto border-t border-sand-200">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="font-display text-3xl font-extrabold text-navy-900 font-arabic" dir="rtl">
          آراء عملاؤنا في الخليج ومصر
        </h2>
        <p className="text-ash-400 text-xs mt-2 font-mono uppercase tracking-wider">Trusted by Leading Arabic Brands</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-sand-200 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex gap-1 text-gold-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold-400" />
              ))}
            </div>
            <p className="font-arabic text-sm text-ash-700 leading-relaxed" dir="rtl">
              "{r.quoteAr}"
            </p>
            <div className="pt-3 border-t border-sand-100" dir="rtl">
              <div className="font-arabic font-bold text-xs text-navy-900">{r.name}</div>
              <div className="font-arabic text-[11px] text-terracotta-600">{r.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pricing Section ──
function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: 'Starter Agent',
      nameAr: 'البداية الذكية',
      desc: 'Ideal for growing Arabic brands launching their first WhatsApp AI bot.',
      priceMonthly: 49,
      priceYearly: 39,
      features: [
        'Google Gemini AI Engine Integration',
        'Egyptian, Saudi & MSA Dialects Understanding',
        'Basic Guardrails & Discount Caps (Up to 15%)',
        'RAG Knowledge Base (Up to 30 Documents)',
        'Human Escalation Handoff Queue',
        'Standard Email & Chat Support',
      ],
      popular: false,
      cta: 'Start Free Trial',
    },
    {
      name: 'Pro Business',
      nameAr: 'الاحترافي للأعمال',
      desc: 'Designed for scaling businesses needing multi-agent routing and guardrail safety.',
      priceMonthly: 119,
      priceYearly: 89,
      features: [
        'All Arabic Dialects (Egyptian, Saudi, Levantine, Emirati, Moroccan, MSA)',
        'Multi-Agent System (Sales, Support, Complaints)',
        'Persistent Customer Profiles (CDP) & Real-time Tagging',
        'Full Guardrails Engine (PII Masking & Discount Ceiling)',
        'Unlimited Vector Search Knowledge Base',
        'Priority 24/7 WhatsApp Tech Support',
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
      features: [
        'Custom Fine-Tuned Arabic LLM Weights',
        'Dedicated Database & Isolated Storage Architecture',
        'Official Meta WhatsApp Business Cloud Onboarding',
        '99.99% Guaranteed Cloud SLA Uptime',
        'Dedicated Account Manager & Integration Engineer',
      ],
      popular: false,
      cta: 'Contact Enterprise Team',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm font-bold ${!isYearly ? 'text-navy-900' : 'text-ash-400'}`}>Monthly Billing</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="w-14 h-8 bg-sand-200 rounded-full p-1 border border-sand-300 relative transition-colors"
          aria-label="Toggle annual billing"
        >
          <motion.div
            animate={{ x: isYearly ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-6 h-6 rounded-full bg-terracotta-500 shadow-sm"
          />
        </button>
        <span className={`text-sm font-bold flex items-center gap-2 ${isYearly ? 'text-navy-900' : 'text-ash-400'}`}>
          Annual Billing <span className="bg-terracotta-50 text-terracotta-700 border border-terracotta-200 text-xs px-2.5 py-0.5 rounded-full font-extrabold">Save 20%</span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
              plan.popular
                ? 'bg-[#080c14] text-sand-50 shadow-2xl border border-terracotta-500/40 scale-[1.03]'
                : 'bg-white text-navy-900 border border-sand-200 hover:shadow-lg'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-terracotta-500 text-white font-extrabold text-xs uppercase px-4 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Most Popular Choice
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-2xl font-extrabold">{plan.name}</h3>
                <span className={`font-arabic text-xs font-bold ${plan.popular ? 'text-terracotta-300' : 'text-terracotta-600'}`} dir="rtl">{plan.nameAr}</span>
              </div>
              <p className={`text-xs mb-6 leading-relaxed ${plan.popular ? 'text-slate-300' : 'text-ash-500'}`}>{plan.desc}</p>

              <div className={`mb-6 pb-6 border-b ${plan.popular ? 'border-slate-800' : 'border-sand-100'}`}>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-display">${isYearly ? plan.priceYearly : plan.priceMonthly}</span>
                  <span className={`text-xs ${plan.popular ? 'text-slate-400' : 'text-ash-400'}`}>/ month</span>
                </div>
              </div>

              <ul className={`space-y-3 text-xs mb-8 ${plan.popular ? 'text-slate-300' : 'text-ash-600'}`}>
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-terracotta-500 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className={`w-full btn justify-center py-3 rounded-xl font-bold transition-all text-center ${
                plan.popular
                  ? 'bg-terracotta-500 hover:bg-terracotta-600 text-white shadow-lg shadow-terracotta-500/25'
                  : 'bg-navy-900 hover:bg-navy-800 text-white'
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── FAQ Accordion Section ──
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      qAr: 'كيف يفهم ArabBot العاميات العربية المختلفة بدقة؟',
      aAr: 'يعتمد المحرك على خوارزميات تطبيع لغوي متقدمة بالتعاون مع نماذج Google Gemini المدربة على ملايين العبارات العامية المصرية والسعودية والشامية والمغربية.',
    },
    {
      qAr: 'هل يمكن ربط البوت بحساب الواتساب الرسمي للأعمال (Meta Cloud API)؟',
      aAr: 'نعم! يدعم ArabBot الربط المباشر مع واجهة Meta Cloud API الرسمية، مع توفير خط سيرفرات فائق السرعة واستقبال Webhooks في أجزاء من الثانية.',
    },
    {
      qAr: 'كيف تضمن المنصة عدم تقديم خصومات أو معلومات خاطئة للعملاء؟',
      aAr: 'تم تزويد المنصة بنظام Guardrails الصارم، والذي يمنع تجاوز سقف الخصم المحدد مسبقاً، ويمنع الحديث عن المنافسين، ويحمي البيانات الشخصية للعملاء تلقائياً.',
    },
    {
      qAr: 'ماذا يحدث إذا طلب العميل التحدث مع موظف بشري؟',
      aAr: 'يقوم البوت برصد نية طلب التحدث مع البشر وتحويل المحادثة فوراً إلى طابور التحويل (Handoff Queue) مع تنبيه فريقك لمتابعة المحادثة من لوحة التحكم.',
    },
  ];

  return (
    <div className="py-20 px-6 max-w-4xl mx-auto border-t border-sand-200">
      <div className="text-center mb-12 space-y-2">
        <h2 className="font-display text-3xl font-extrabold text-navy-900 font-arabic" dir="rtl">
          الأسئلة الشائعة (FAQ)
        </h2>
        <p className="text-ash-400 text-xs font-mono uppercase tracking-wider">Frequently Asked Questions</p>
      </div>

      <div className="space-y-3" dir="rtl">
        {faqs.map((faq, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-sand-200 overflow-hidden transition-all">
            <button
              onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
              className="w-full p-5 text-right font-arabic font-bold text-sm text-navy-900 flex items-center justify-between hover:bg-sand-50/50"
            >
              <span>{faq.qAr}</span>
              <ChevronDown className={`w-4 h-4 text-ash-400 transition-transform ${openIndex === idx ? 'rotate-180 text-terracotta-500' : ''}`} />
            </button>
            {openIndex === idx && (
              <div className="px-5 pb-5 font-arabic text-xs text-ash-500 leading-relaxed border-t border-sand-100 pt-3">
                {faq.aAr}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Page Export ──
export default function Landing() {
  return (
    <div className="min-h-screen bg-bg-warm text-ash-700 font-body antialiased selection:bg-terracotta-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-sand-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-ash-500 font-arabic">
            <a href="#playground" className="hover:text-terracotta-600 transition-colors">مختبر اللهجات (Dialect AI)</a>
            <a href="#architecture" className="hover:text-terracotta-600 transition-colors">هيكلية الوكلاء</a>
            <a href="#regions" className="hover:text-terracotta-600 transition-colors">دليل المناطق</a>
            <a href="#roi" className="hover:text-terracotta-600 transition-colors">حاسبة التوفير</a>
            <a href="#pricing" className="hover:text-terracotta-600 transition-colors">الأسعار (Pricing)</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-bold text-ash-700 hover:text-navy-900 px-3 py-2 font-arabic">
              تسجيل الدخول
            </Link>
            <Link
              to="/register"
              className="btn btn-primary font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 font-arabic"
            >
              <span>إنشاء حساب مجاناً</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto text-center">
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6 max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-terracotta-50 border border-terracotta-200 text-terracotta-700 text-xs font-bold font-arabic shadow-sm">
            <Sparkles className="w-4 h-4 text-terracotta-500" />
            <span>المنصة الأولى للذكاء الاصطناعي على الواتساب بالعاميات العربية</span>
          </motion.div>

          {/* Main Hero Arabic Heading */}
          <motion.h1 variants={fadeInUp} className="font-arabic text-4xl sm:text-5xl lg:text-6xl font-extrabold text-navy-900 leading-[1.25]" dir="rtl">
            ابنِ بوتات واتساب ذكية تفهم <br />
            <span className="text-terracotta-500 underline decoration-gold-400 underline-offset-8">العاميات العربية</span> وتضاعف مبيعاتك
          </motion.h1>

          {/* Subheading */}
          <motion.p variants={fadeInUp} className="text-base sm:text-lg text-ash-500 max-w-2xl mx-auto leading-relaxed">
            The AI Engine for Arabic WhatsApp Commerce. Understand Egyptian, Saudi, Levantine, Emirati, and North African dialects with 99.8% precision and strict brand safety guardrails.
          </motion.p>

          {/* Action Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <Link
              to="/register"
              className="w-full sm:w-auto btn btn-primary font-extrabold text-base px-8 py-4 rounded-xl shadow-lg shadow-terracotta-500/25 transition-all flex items-center justify-center gap-3 font-arabic"
            >
              <span>ابدأ بتجربة المنصة مجاناً</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#playground"
              className="w-full sm:w-auto btn btn-secondary font-bold text-base px-8 py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 font-arabic"
            >
              <span>جرب محرك العاميات حياً</span>
              <ChevronRight className="w-5 h-5 text-ash-400" />
            </a>
          </motion.div>

          {/* Regional Dialects Quick Ribbon */}
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-2.5 pt-4 text-xs font-arabic font-bold text-ash-700">
            <span className="px-3.5 py-1.5 bg-white border border-sand-200 rounded-full shadow-sm">🇪🇬 العامية المصرية</span>
            <span className="px-3.5 py-1.5 bg-white border border-sand-200 rounded-full shadow-sm">🇸🇦 العامية السعودية والخليجية</span>
            <span className="px-3.5 py-1.5 bg-white border border-sand-200 rounded-full shadow-sm">🇦🇪 العامية الإماراتية</span>
            <span className="px-3.5 py-1.5 bg-white border border-sand-200 rounded-full shadow-sm">🇯🇴 العامية الشامية</span>
            <span className="px-3.5 py-1.5 bg-white border border-sand-200 rounded-full shadow-sm">🇲🇦 الدارجة المغربية</span>
            <span className="px-3.5 py-1.5 bg-white border border-sand-200 rounded-full shadow-sm">🌍 الفصحى المعاصرة</span>
          </motion.div>

          {/* Stats Bar */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left">
            <ArabicStatCard label="Messages Processed" labelAr="الرسائل المعالجة" target={10000000} suffix="+" subtitleAr="نمو متواصل بمصر والخليج" />
            <ArabicStatCard label="Dialect Precision" labelAr="دقة فهم العامية" target={99} suffix=".8%" subtitleAr="أعلى دقة بالمملكة ومصر" />
            <ArabicStatCard label="Response Latency" labelAr="سرعة الرد الفوري" target={240} suffix="ms" subtitleAr="أقل من ثانية على الواتساب" />
            <ArabicStatCard label="Hours Saved" labelAr="ساعات العمل الموفرة" target={450000} suffix="h" subtitleAr="توفير لفريق خدمة العملاء" />
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive AI Playground */}
      <section id="playground" className="py-12 px-6 max-w-7xl mx-auto">
        <InteractiveEnginePlayground />
      </section>

      {/* Interactive Multi-Agent Architecture */}
      <section id="architecture">
        <MultiAgentPipelineSection />
      </section>

      {/* Regional Dialect Explorer */}
      <section id="regions">
        <RegionalDialectExplorer />
      </section>

      {/* Dynamic ROI Calculator */}
      <section id="roi">
        <DynamicROICalculator />
      </section>

      {/* Arabic Business Use Cases */}
      <section id="cases">
        <ArabicUseCasesSection />
      </section>

      {/* Customer Testimonials */}
      <section>
        <ArabicTestimonialsSection />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-terracotta-700 font-mono text-xs font-bold uppercase tracking-wider bg-terracotta-50 px-3.5 py-1.5 rounded-full border border-terracotta-200">
            خطط الأسعار المرنة
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight font-arabic" dir="rtl">
            اختر الخطة المناسبة لحجم أعمالك وبوتاتك
          </h2>
        </div>
        <PricingSection />
      </section>

      {/* FAQ Section */}
      <section>
        <FAQSection />
      </section>

      {/* Footer */}
      <footer className="border-t border-sand-200 bg-white py-14 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-ash-500 text-sm">
          <Logo size="md" />
          <p className="font-arabic" dir="rtl">© {new Date().getFullYear()} ArabBot Studio. المنصة الأولى لبناء بوتات الواتساب بالذكاء الاصطناعي.</p>
          <div className="flex items-center gap-6 font-bold font-arabic">
            <Link to="/login" className="hover:text-terracotta-600 transition-colors">تسجيل الدخول</Link>
            <Link to="/register" className="hover:text-terracotta-600 transition-colors">إنشاء حساب</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
