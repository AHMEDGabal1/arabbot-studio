import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, type Variants, useInView } from 'framer-motion';
import {
  Bot, ArrowRight, CheckCircle2, Sparkles, Cpu,
  Send, Lock, ChevronRight, Database, Star,
  ShoppingBag, Headphones
} from 'lucide-react';
import { useCountUp } from '../lib/useCountUp';
import Logo from '../components/Logo';

// ── Arabic Dialects Data (No Emojis) ──
interface DialectOption {
  id: 'egyptian' | 'saudi' | 'levantine' | 'emirati' | 'msa';
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
}

const dialectDemos: DialectOption[] = [
  {
    id: 'egyptian',
    name: 'Egyptian Dialects',
    nameAr: 'العامية المصرية',
    code: 'EG',
    sampleInput: 'سلام عليكم يا باشا، عايز اعرف مصاريف الشحن للقاهرة بكام وبتاخد كام يوم؟',
    normalized: 'السلام عليكم، أرغب في معرفة تكلفة وسرعة الشحن إلى محافظة القاهرة.',
    intent: 'SHIPPING_INQUIRY',
    intentAr: 'استفسار الشحن والتوصيل',
    botReply: 'أهلاً بحضرتك يا فندم! الشحن للقاهرة بـ 35 جنيه وبيوصل خلال 24 لـ 48 ساعة فقط. تحب أسجل لحضرتك الطلب دلوقتي؟',
    latency: '0.31s',
    confidence: 99.8,
  },
  {
    id: 'saudi',
    name: 'Saudi & Gulf',
    nameAr: 'العامية السعودية والخليجية',
    code: 'KSA',
    sampleInput: 'هلا والله طال عمرك، كم سعر التوصيل للرياض وهل عندكم دفع عند الاستلام؟',
    normalized: 'مرحباً، ما هي تكلفة التوصيل إلى مدينة الرياض وهل توجد خدمة الدفع عند الاستلام؟',
    intent: 'PAYMENT_AND_SHIPPING',
    intentAr: 'استفسار الدفع والتوصيل',
    botReply: 'هلا وغلا حياك الله! التوصيل للرياض بـ 25 ريال ومجاني للطلبات فوق 200 ريال. ونعم، الدفع عند الاستلام متاح بجميع المناطق!',
    latency: '0.28s',
    confidence: 99.6,
  },
  {
    id: 'emirati',
    name: 'Emirati & Gulf',
    nameAr: 'العامية الإماراتية',
    code: 'UAE',
    sampleInput: 'مرحبا الساع، متى يوصل الطلب لدبي؟ وفي ضمان على الجهاز؟',
    normalized: 'مرحباً، متى يصل الطلب إلى مدينة دبي وهل يوجد ضمان على الجهاز؟',
    intent: 'DELIVERY_AND_WARRANTY',
    intentAr: 'موعد التوصيل والضمان',
    botReply: 'مرحبا الساع يا مرحبا! التوصيل لدبي خلال 24 ساعة، وجميع أجهزتنا معها ضمان ذهبي شامل لمدة سنة كاملة.',
    latency: '0.29s',
    confidence: 99.4,
  },
  {
    id: 'levantine',
    name: 'Levantine Arabic',
    nameAr: 'العامية الشامية',
    code: 'LEV',
    sampleInput: 'مرحبا، قديش بياخد وقت التوصيل لعمان؟ وفي إمكانية للتبديل إذا ما عجبني؟',
    normalized: 'مرحباً، كم يستغرق وقت التوصيل إلى عمان وهل توجد سياسة استبدال؟',
    intent: 'EXCHANGE_AND_DELIVERY',
    intentAr: 'التبديل والاستبدال',
    botReply: 'أهلاً وسهلاً بك! التوصيل بياخد يومين. وأكيد الاستبدال متاح مجاناً خلال 14 يوم من تاريخ الاستلام بكل سهولة.',
    latency: '0.34s',
    confidence: 99.3,
  },
  {
    id: 'msa',
    name: 'Modern Standard',
    nameAr: 'الفصحى المعاصرة',
    code: 'MSA',
    sampleInput: 'السلام عليكم ورحمة الله، ما هي سياسة الضمان والاسترجاع المعتمدة لديكم؟',
    normalized: 'السلام عليكم ورحمة الله، ما هي سياسة الضمان والاسترجاع المعتمدة لديكم؟',
    intent: 'WARRANTY_POLICY',
    intentAr: 'سياسة الضمان والاسترجاع',
    botReply: 'وعليكم السلام ورحمة الله وبركاته، جميع منتجاتنا مغطاة بضمان ذهبي لمدة عام، مع إمكانية الاسترجاع الشامل خلال 14 يوماً.',
    latency: '0.24s',
    confidence: 99.9,
  },
];

// ── Motion Variants ──
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

// ── Stat Card Component ──
function ArabicStatCard({ label, labelAr, target, suffix, subtitleAr }: { label: string; labelAr: string; target: number; suffix: string; subtitleAr: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const count = useCountUp(target, 1200, isInView);
  const displayCount = target >= 1000000 ? (count / 1000000).toFixed(1) + 'M' : target >= 1000 ? (count / 1000).toFixed(1) + 'K' : count;

  return (
    <div ref={ref} className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="font-arabic text-xs font-bold text-emerald-600" dir="rtl">{labelAr}</span>
      </div>
      <div className="text-3xl font-extrabold text-slate-900 font-display tracking-tight">{displayCount}{suffix}</div>
      <p className="text-xs text-emerald-600 font-medium font-arabic mt-1" dir="rtl">{subtitleAr}</p>
    </div>
  );
}

// ── Interactive Engine Playground (Clean, Emoji-Free) ──
function InteractiveEnginePlayground() {
  const [selectedDialect, setSelectedDialect] = useState<DialectOption>(dialectDemos[0]);
  const [customInput, setCustomInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    { sender: 'user', text: dialectDemos[0].sampleInput, time: '10:42 ص' },
    { sender: 'bot', text: dialectDemos[0].botReply, time: '10:42 ص' }
  ]);

  const handleSelectDialect = (dialect: DialectOption) => {
    setSelectedDialect(dialect);
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setMessages([
        { sender: 'user', text: dialect.sampleInput, time: 'الآن' },
        { sender: 'bot', text: dialect.botReply, time: 'الآن' }
      ]);
    }, 500);
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
          text: `أهلاً بك! تم فهم استفسارك بالعامية: "${userText}". جاري تنفيذ طلبك فوراً عبر محرك ArabBot الذكي.`,
          time: 'الآن'
        }
      ]);
    }, 700);
  };

  return (
    <div className="bg-white rounded-3xl p-6 lg:p-10 border border-slate-200 shadow-xl text-slate-900 relative overflow-hidden">
      <div className="grid lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Left Controls */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" /> 
              <span>مختبر لهجات الذكاء الاصطناعي</span>
            </div>
            <h3 className="font-display text-2xl lg:text-3xl font-extrabold text-slate-900 mb-2 tracking-tight">
              Test Regional Dialect Normalization
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed font-arabic" dir="rtl">
              اختر إحدى العاميات العربية أدناه للتجربة الحية لكيفية فهم وتطبيع العاميات، استخراج نية العميل، والرد الفوري بالأمان التام.
            </p>
          </div>

          {/* Dialect Selector Tabs */}
          <div className="grid grid-cols-2 gap-3">
            {dialectDemos.map((dialect) => (
              <button
                key={dialect.id}
                onClick={() => handleSelectDialect(dialect)}
                className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between ${
                  selectedDialect.id === dialect.id
                    ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                dir="rtl"
              >
                <div className="flex items-center gap-2.5">
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                    selectedDialect.id === dialect.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {dialect.code}
                  </span>
                  <div>
                    <div className="text-xs font-bold font-arabic">{dialect.nameAr}</div>
                    <div className={`text-[10px] ${selectedDialect.id === dialect.id ? 'text-emerald-400' : 'text-slate-500'}`}>{dialect.name}</div>
                  </div>
                </div>
                {selectedDialect.id === dialect.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              </button>
            ))}
          </div>

          {/* Engine Trace */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 font-arabic text-xs" dir="rtl">
            <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-slate-200">
              <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Cpu className="w-4 h-4 text-emerald-600" /> تحليل المحرك الذكي (AI Processing Trace)
              </span>
              <span className="font-mono text-slate-600" dir="ltr">{selectedDialect.latency}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">النية المكتشفة (Intent):</span>
              <span className="text-slate-900 font-bold bg-slate-200 px-2 py-0.5 rounded text-[11px]">{selectedDialect.intentAr} ({selectedDialect.intent})</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">دقة الفهم (Confidence):</span>
              <span className="text-emerald-600 font-bold">{selectedDialect.confidence}%</span>
            </div>
          </div>
        </div>

        {/* Right Phone Mockup */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[490px]">
            {/* Header */}
            <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between" dir="rtl">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-emerald-300" />
                </div>
                <div>
                  <div className="text-xs font-bold font-arabic text-white">بوت خدمة العملاء الذكي</div>
                  <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> موثق • WhatsApp Business
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-slate-950 flex-1 overflow-y-auto space-y-3 font-arabic" dir="rtl">
              <AnimatePresence mode="popLayout">
                {messages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                  >
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] text-xs leading-relaxed shadow-sm ${
                        msg.sender === 'user'
                          ? 'bg-emerald-600 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                      }`}
                    >
                      <div>{msg.text}</div>
                      <div className="text-[9px] mt-1 text-slate-300 text-left font-mono" dir="ltr">{msg.time}</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isProcessing && (
                <div className="flex justify-end">
                  <div className="bg-slate-800 text-emerald-400 text-xs px-3 py-2 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>جاري كتابة الرد بالعامية...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendCustom} className="p-2.5 bg-slate-900 border-t border-slate-800 flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="اكتب رسالة بالعامية المصرية أو السعودية..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 text-right font-arabic"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={isProcessing || !customInput.trim()}
                className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 disabled:opacity-40 transition-all"
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

// ── Arabic Use Cases (Clean Vector Icons, No Emojis) ──
function ArabicUseCasesSection() {
  const cases = [
    {
      icon: <ShoppingBag className="w-6 h-6 text-emerald-600" />,
      titleAr: 'تأكيد المبيعات والطلبات',
      titleEn: 'Sales & Order Conversions',
      descAr: 'رد فوري على استفسارات الأسعار والمواصفات بالعامية المحلية مع تحويل العميل للشراء مباشرة على الواتساب.',
    },
    {
      icon: <Headphones className="w-6 h-6 text-teal-600" />,
      titleAr: 'خدمة العملاء على مدار الساعة',
      titleEn: '24/7 Dialect Customer Service',
      descAr: 'فهم دقيق للعامية المصرية والخليجية والشامية وتوفير إجابات صحيحة فورية من قاعدة معرفتك بدون تأخير.',
    },
    {
      icon: <Lock className="w-6 h-6 text-amber-600" />,
      titleAr: 'قواعد حماية العلامة التجارية',
      titleEn: 'Strict Brand Guardrails',
      descAr: 'تحديد سقف الخصومات المسموحة، حجب المنافسين، وحماية معلومات العملاء الحساسة بشكل تلقائي.',
    },
    {
      icon: <Database className="w-6 h-6 text-blue-600" />,
      titleAr: 'ملفات العملاء الموحدة (CDP)',
      titleEn: 'Unified Arabic Customer Profiles',
      descAr: 'حفظ تلقائي لجميع تفضيلات العميل، تاريخ الطلبات، والملاحظات لتقديم تجربة شخصية مميزة في كل مرة.',
    },
  ];

  return (
    <div className="py-16 px-6 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
        <span className="text-emerald-700 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          استخدامات المنصة في العالم العربي
        </span>
        <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-arabic" dir="rtl">
          مصمم خصيصاً لااحتياجات المتاجر والشركات العربية
        </h2>
        <p className="text-slate-600 text-sm leading-relaxed">
          Designed specifically for Arabic e-commerce platforms, retail brands, and service businesses.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cases.map((c, i) => (
          <div key={i} className="bg-white p-7 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              {c.icon}
            </div>
            <div>
              <h3 className="font-arabic font-bold text-lg text-slate-900 mb-1" dir="rtl">{c.titleAr}</h3>
              <p className="text-xs font-semibold text-slate-400 mb-3">{c.titleEn}</p>
              <p className="font-arabic text-xs text-slate-600 leading-relaxed" dir="rtl">{c.descAr}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Arabic Testimonials (Clean) ──
function ArabicTestimonialsSection() {
  const reviews = [
    {
      quoteAr: "زيادة المبيعات بنسبة 45% بعد استخدام بوت الواتساب بالعامية السعودية. الردود سريعة والعملاء مبسوطين جداً.",
      name: "عبدالعزيز الشمري",
      role: "مدير متجر عطور بالرياض — المملكة العربية السعودية",
    },
    {
      quoteAr: "وفرنا أكثر من 200 ساعة عمل شهرياً لفريق الدعم. البوت بيحل 85% من الاستفسارات بالعامية المصرية ببراعة.",
      name: "م. أحمد حسام",
      role: "رئيس قسم التكنولوجيا بالقاهرة — جمهورية مصر العربية",
    },
    {
      quoteAr: "أفضل منصة بوتات جربناها! فهم العامية الشامية وقواعد الأمان حموا علاماتنا التجارية بشكل ممتاز.",
      name: "سارة حداد",
      role: "مديرة تسويق بدبي — الإمارات العربية المتحدة",
    },
  ];

  return (
    <div className="py-16 px-6 max-w-7xl mx-auto border-t border-slate-200">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="font-display text-3xl font-extrabold text-slate-900 font-arabic" dir="rtl">
          آراء عملاؤنا في الخليج ومصر
        </h2>
        <p className="text-slate-500 text-xs mt-2 font-mono uppercase tracking-wider">Trusted by Leading Arabic Brands</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {reviews.map((r, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4">
            <div className="flex gap-1 text-amber-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400" />
              ))}
            </div>
            <p className="font-arabic text-sm text-slate-700 leading-relaxed" dir="rtl">
              "{r.quoteAr}"
            </p>
            <div className="pt-3 border-t border-slate-100" dir="rtl">
              <div className="font-arabic font-bold text-xs text-slate-900">{r.name}</div>
              <div className="font-arabic text-[11px] text-emerald-600">{r.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pricing Section (No Emojis) ──
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
        'Basic Guardrails & Discount Caps',
        'RAG Knowledge Base (Up to 25 Documents)',
        'Human Escalation Handoff Queue',
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
        'All Arabic Dialects (Egyptian, Saudi, Levantine, Emirati, MSA)',
        'Multi-Agent System (Sales, Support, Complaints)',
        'Persistent Customer Profiles (CDP) & Notes',
        'Full Guardrails Engine (PII & Discount Caps)',
        'Unlimited Vector Search Knowledge Base',
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
      features: [
        'Custom Fine-Tuned Arabic LLM Models',
        'Dedicated Database & Isolated Storage',
        'Official Meta WhatsApp Business Onboarding',
        '99.99% Guaranteed SLA Uptime',
        'Dedicated Account Manager & Setup Engineer',
      ],
      popular: false,
      cta: 'Contact Enterprise Team',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Toggle */}
      <div className="flex items-center justify-center gap-4 mb-12">
        <span className={`text-sm font-bold ${!isYearly ? 'text-slate-900' : 'text-slate-500'}`}>Monthly Billing</span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="w-14 h-8 bg-slate-200 rounded-full p-1 border border-slate-300 relative transition-colors"
        >
          <motion.div
            animate={{ x: isYearly ? 24 : 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="w-6 h-6 rounded-full bg-emerald-600 shadow-sm"
          />
        </button>
        <span className={`text-sm font-bold flex items-center gap-2 ${isYearly ? 'text-slate-900' : 'text-slate-500'}`}>
          Annual Billing <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-0.5 rounded-full font-extrabold">Save 20%</span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {plans.map((plan, idx) => (
          <div
            key={idx}
            className={`rounded-3xl p-8 flex flex-col justify-between transition-all relative ${
              plan.popular
                ? 'bg-slate-900 text-white shadow-2xl scale-[1.02]'
                : 'bg-white text-slate-900 border border-slate-200 hover:shadow-lg'
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 font-extrabold text-xs uppercase px-4 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Most Popular Choice
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-display text-2xl font-extrabold">{plan.name}</h3>
                <span className={`font-arabic text-xs font-bold ${plan.popular ? 'text-emerald-400' : 'text-emerald-600'}`} dir="rtl">{plan.nameAr}</span>
              </div>
              <p className={`text-xs mb-6 leading-relaxed ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>{plan.desc}</p>

              <div className={`mb-6 pb-6 border-b ${plan.popular ? 'border-slate-800' : 'border-slate-100'}`}>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold font-display">${isYearly ? plan.priceYearly : plan.priceMonthly}</span>
                  <span className={`text-xs ${plan.popular ? 'text-slate-400' : 'text-slate-500'}`}>/ month</span>
                </div>
              </div>

              <ul className={`space-y-3 text-xs mb-8 ${plan.popular ? 'text-slate-300' : 'text-slate-600'}`}>
                {plan.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <Link
              to="/register"
              className={`w-full btn justify-center py-3 rounded-xl font-bold transition-all text-center ${
                plan.popular
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
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

// ── Main Page Export (Clean & Professional, Zero Emojis) ──
export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-50/60 text-slate-900 font-body antialiased selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Logo size="md" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600 font-arabic">
            <a href="#features" className="hover:text-emerald-600 transition-colors">المزايا (Features)</a>
            <a href="#playground" className="hover:text-emerald-600 transition-colors">تجربة العامية (Dialect AI)</a>
            <a href="#cases" className="hover:text-emerald-600 transition-colors">استخدامات المنصة</a>
            <a href="#pricing" className="hover:text-emerald-600 transition-colors">الأسعار (Pricing)</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-bold text-slate-700 hover:text-slate-900 px-3 py-2 font-arabic">
              تسجيل الدخول
            </Link>
            <Link
              to="/register"
              className="btn bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all flex items-center gap-2 font-arabic"
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
          <motion.div variants={fadeInUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold font-arabic shadow-sm">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>المنصة الأولى للذكاء الاصطناعي على الواتساب بالعاميات العربية</span>
          </motion.div>

          {/* Hero Main Arabic Heading */}
          <motion.h1 variants={fadeInUp} className="font-arabic text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 leading-[1.25]" dir="rtl">
            ابنِ بوتات واتساب ذكية تفهم <br />
            <span className="text-emerald-600 underline decoration-emerald-300 underline-offset-8">العاميات العربية</span> وتضاعف مبيعاتك
          </motion.h1>

          {/* English Sub-heading */}
          <motion.p variants={fadeInUp} className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            The AI Engine for Arabic WhatsApp Commerce. Understand Egyptian, Saudi, Levantine, and Gulf dialects with 99%+ accuracy and strict business safety rules.
          </motion.p>

          {/* Action Buttons */}
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
            <Link
              to="/register"
              className="w-full sm:w-auto btn bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-base px-8 py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-3 font-arabic"
            >
              <span>ابدأ بتجربة المنصة مجاناً</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href="#playground"
              className="w-full sm:w-auto btn bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-base px-8 py-4 rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 font-arabic"
            >
              <span>جرب محرك العاميات حياً</span>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </a>
          </motion.div>

          {/* Dialect Clean Pills */}
          <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-3 pt-4 text-xs font-arabic font-bold text-slate-700">
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">العامية المصرية</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">العامية السعودية والخليجية</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">العامية الإماراتية</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">العامية الشامية</span>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-full shadow-sm">الفصحى المعاصرة</span>
          </motion.div>

          {/* Stats Bar */}
          <motion.div variants={fadeInUp} className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 text-left">
            <ArabicStatCard label="Messages Processed" labelAr="الرسائل المعالجة" target={10000000} suffix="+" subtitleAr="نمو متواصل بمصر والخليج" />
            <ArabicStatCard label="Dialect Precision" labelAr="دقة فهم العامية" target={99} suffix=".8%" subtitleAr="أعلى دقة بالمملكة ومصر" />
            <ArabicStatCard label="Response Latency" labelAr="سرعة الرد الفوري" target={320} suffix="ms" subtitleAr="أقل من ثانية على الواتساب" />
            <ArabicStatCard label="Hours Saved" labelAr="ساعات العمل الموفرة" target={450000} suffix="h" subtitleAr="توفير لفريق خدمة العملاء" />
          </motion.div>
        </motion.div>
      </section>

      {/* Interactive AI Playground */}
      <section id="playground" className="py-12 px-6 max-w-7xl mx-auto">
        <InteractiveEnginePlayground />
      </section>

      {/* Arabic Business Use Cases */}
      <section id="cases">
        <ArabicUseCasesSection />
      </section>

      {/* Arabic Customer Testimonials */}
      <section>
        <ArabicTestimonialsSection />
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-3">
          <span className="text-emerald-700 font-mono text-xs font-bold uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            خطط الأسعار المرنة
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-arabic" dir="rtl">
            اختر الخطة المناسبة لحجم أعمالك وبوتاتك
          </h2>
        </div>
        <PricingSection />
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-14 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 text-slate-600 text-sm">
          <Logo size="md" />
          <p className="font-arabic" dir="rtl">© {new Date().getFullYear()} ArabBot Studio. المنصة الأولى لبناء بوتات الواتساب بالذكاء الاصطناعي.</p>
          <div className="flex items-center gap-6 font-bold font-arabic">
            <Link to="/login" className="hover:text-emerald-600 transition-colors">تسجيل الدخول</Link>
            <Link to="/register" className="hover:text-emerald-600 transition-colors">إنشاء حساب</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
