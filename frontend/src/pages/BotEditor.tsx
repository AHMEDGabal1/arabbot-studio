import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, Bot as BotIcon, Send, Sliders } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { createBot, getBot, updateBot } from '../lib/api';
import type { BotCreate } from '../types';

const dialectPresets = [
  {
    id: 'egyptian',
    name: 'Egyptian (مصري)',
    prompt: 'أنت مساعد خدمة العملاء الذكي لمتجرنا. تتحدث بالعامية المصرية الودودة والبسيطة، وتساعد العملاء في الاستفسار عن المنتجات، الشحن، والأسعار.',
    fallback: 'ولا يهمك يا فندم، هحولك لواحد من فريق الدعم الفني عشان يساعدك فورا!',
  },
  {
    id: 'saudi',
    name: 'Saudi / Gulf (سعودي)',
    prompt: 'أنت مساعد المبيعات الذكي للعلامة التجارية في السعودية والخليج. تتحدث بالعامية السعودية الراقية والترحيبية (هلا وغلا)، وتوفر جميع تفاصيل المنتجات والشحن.',
    fallback: 'هلا وغلا بك، أبشر! راح أحول محادثتك الآن لزميلنا في خدمة العملاء ليخدمك بشكل أفضل.',
  },
  {
    id: 'levantine',
    name: 'Levantine (شامي)',
    prompt: 'أنت مساعد الدعم الفني بالعامية الشامية الودودة. تجيب عن استفسارات العملاء بلطف ووضوح تامة.',
    fallback: 'تكرم عينك! عم حولك هلا لأحد موظفي الخدمة ليتابع معك فوراً.',
  },
  {
    id: 'msa',
    name: 'Formal MSA (فصحى)',
    prompt: 'أنت ممثل خدمة العملاء الرسمي للشركة. تتحدث باللغة العربية الفصحى المعاصرة والأنيقة مع الالتزام بأعلى معايير الاحترافية.',
    fallback: 'أهلاً بك. نقوم الآن بتحويل محادثتك إلى أحد ممثلي الدعم الفني المختصين لمساعدتك بشكل أفضل.',
  },
];

export default function BotEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [form, setForm] = useState<BotCreate>({
    name: '',
    channel: 'whatsapp',
    wa_phone_number_id: '',
    wa_access_token: '',
    system_prompt: dialectPresets[0].prompt,
    fallback_message: dialectPresets[0].fallback,
    human_handoff_enabled: true,
  });

  // Interactive Live Simulator State
  const [simMessages, setSimMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string }>>([
    { sender: 'user', text: 'سلام عليكم، عايز اعرف اسعار الشحن ومواعيد العمل؟' },
    { sender: 'bot', text: 'أهلاً بحضرتك! الشحن بـ 35 جنيه وبيوصل خلال 24 لـ 48 ساعة. ومواعيد العمل يومياً من 10 صباحاً لـ 11 مساءً.' },
  ]);
  const [simInput, setSimInput] = useState('');
  const [simTyping, setSimTyping] = useState(false);

  useEffect(() => {
    if (!isNew) {
      (async () => {
        try {
          const bot = await getBot(id!);
          setForm({
            name: bot.name,
            channel: bot.channel,
            wa_phone_number_id: bot.wa_phone_number_id || '',
            wa_access_token: bot.wa_access_token || '',
            system_prompt: bot.system_prompt || '',
            fallback_message: bot.fallback_message || '',
            human_handoff_enabled: bot.human_handoff_enabled,
          });
        } catch (e) {
          console.error(e);
          toast.error('Failed to load bot details');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [id, isNew]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (isNew) {
        await createBot(form);
        toast.success('Bot created successfully!');
      } else {
        await updateBot(id!, form);
        toast.success('Bot updated successfully!');
      }
      navigate('/bots');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save bot settings');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof BotCreate, value: any) => setForm((f) => ({ ...f, [key]: value }));

  const applyPreset = (preset: typeof dialectPresets[0]) => {
    setForm((f) => ({
      ...f,
      system_prompt: preset.prompt,
      fallback_message: preset.fallback,
    }));
    toast.success(`Applied ${preset.name} persona preset!`);
  };

  const handleSendSim = (e: FormEvent) => {
    e.preventDefault();
    if (!simInput.trim()) return;

    const userText = simInput;
    setSimInput('');
    setSimMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setSimTyping(true);

    setTimeout(() => {
      setSimTyping(false);
      const isFallback = userText.includes('انسان') || userText.includes('بشري') || userText.includes('مشكلة كبيرة');
      const responseText = isFallback
        ? (form.fallback_message || 'جاري تحويل المحادثة لموظف خدمة العملاء...')
        : `استلمت استفسارك بخصوص: "${userText}". يتم الرد بفضل التوجيه المحدد في النظام: "${form.name || 'البوت'}"!`;

      setSimMessages((prev) => [...prev, { sender: 'bot', text: responseText }]);
    }, 800);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-10 h-10 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin" />
        <p className="text-sm font-medium text-ash-400">Loading bot configurations...</p>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="space-y-6">
      <button
        onClick={() => navigate('/bots')}
        className="group inline-flex items-center gap-1.5 font-body text-sm text-ash-400 hover:text-terracotta-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        Back to bots list
      </button>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-terracotta-500/10 flex items-center justify-center border border-terracotta-500/20">
            <Sparkles className="w-6 h-6 text-terracotta-500" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-extrabold text-navy-900">{isNew ? 'Create New AI Bot' : 'Edit Bot Settings'}</h1>
            <p className="text-xs text-ash-400 font-arabic" dir="rtl">تعديل شخصية البوت، اللهجة، وإعدادات الواتساب</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-terracotta-50 border border-terracotta-300/30 rounded-xl text-sm text-terracotta-700 font-medium">
          {error}
        </div>
      )}

      {/* Main Dual Grid: Left Editor Form, Right Live Simulator */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Editor Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 card p-7 space-y-6 bg-white/80 backdrop-blur-md shadow-sm border-sand-200">
          <div>
            <label htmlFor="bot-name" className="block font-body text-sm font-bold text-navy-900 mb-1.5">
              Bot Name <span className="font-arabic text-ash-400 font-normal text-xs">(اسم البوت)</span>
            </label>
            <input
              id="bot-name"
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              className="input"
              placeholder="e.g. بوت الدعم الفني - القاهرة"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="bot-channel" className="block font-body text-sm font-bold text-navy-900 mb-1.5">
                Channel <span className="font-arabic text-ash-400 font-normal text-xs">(القناة)</span>
              </label>
              <select id="bot-channel" value={form.channel} onChange={(e) => set('channel', e.target.value)} className="input">
                <option value="whatsapp">WhatsApp Business API</option>
                <option value="facebook">Facebook Messenger</option>
              </select>
            </div>

            <div>
              <label htmlFor="wa-phone" className="block font-body text-sm font-bold text-navy-900 mb-1.5">
                Phone Number ID
              </label>
              <input
                id="wa-phone"
                value={form.wa_phone_number_id || ''}
                onChange={(e) => set('wa_phone_number_id', e.target.value)}
                className="input font-mono text-sm"
                placeholder="109876543210"
              />
            </div>
          </div>

          <div>
            <label htmlFor="wa-token" className="block font-body text-sm font-bold text-navy-900 mb-1.5">
              WhatsApp Meta Access Token
            </label>
            <input
              id="wa-token"
              type="password"
              value={form.wa_access_token || ''}
              onChange={(e) => set('wa_access_token', e.target.value)}
              className="input font-mono text-sm tracking-widest"
              placeholder="EAA..."
            />
          </div>

          {/* Preset Buttons */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block font-body text-sm font-bold text-navy-900">
                Arabic Dialect & Persona Presets
              </label>
              <span className="text-xs text-terracotta-600 font-bold">Quick Fill</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {dialectPresets.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="px-3 py-2 bg-sand-50 hover:bg-terracotta-50 hover:border-terracotta-200 border border-sand-200 rounded-xl text-xs font-bold text-navy-900 transition-colors text-center"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="system-prompt" className="block font-body text-sm font-bold text-navy-900 mb-1">
              AI Persona & System Prompt
            </label>
            <p className="text-xs text-ash-400 mb-2">Defines how the bot behaves, speaks Arabic, and responds to users.</p>
            <textarea
              id="system-prompt"
              rows={4}
              value={form.system_prompt || ''}
              onChange={(e) => set('system_prompt', e.target.value)}
              className="input resize-none font-arabic text-sm"
              placeholder="أنت مساعد خدمة العملاء..."
              dir="auto"
            />
          </div>

          <div>
            <label htmlFor="fallback" className="block font-body text-sm font-bold text-navy-900 mb-1">
              Fallback Message (Arabic)
            </label>
            <p className="text-xs text-ash-400 mb-2">Sent when low confidence triggers human agent escalation.</p>
            <input
              id="fallback"
              value={form.fallback_message || ''}
              onChange={(e) => set('fallback_message', e.target.value)}
              className="input font-arabic text-sm"
              dir="rtl"
            />
          </div>

          <div className="flex items-center justify-between p-4 bg-sand-50 rounded-2xl border border-sand-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="handoff"
                checked={form.human_handoff_enabled}
                onChange={(e) => set('human_handoff_enabled', e.target.checked)}
                className="w-4 h-4 text-terracotta-500 rounded focus:ring-terracotta-400"
              />
              <div>
                <label htmlFor="handoff" className="font-body text-sm font-bold text-navy-900 cursor-pointer">
                  Enable Human Agent Escalation
                </label>
                <p className="text-xs text-ash-400" dir="rtl">تحويل المحادثة تلقائياً للفريق عند عدم الفهم</p>
              </div>
            </div>
            <Sliders className="w-5 h-5 text-terracotta-500" />
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-sand-200">
            <button type="submit" disabled={saving} className="btn btn-primary px-6 py-3 font-bold">
              {saving ? 'Saving...' : <><Save className="w-4 h-4" /> {isNew ? 'Create Bot' : 'Save Changes'}</>}
            </button>
            <button type="button" onClick={() => navigate('/bots')} className="btn btn-secondary">
              Cancel
            </button>
          </div>
        </form>

        {/* Right Live Bot Test Simulator Phone */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          <div className="bg-navy-900 rounded-3xl p-5 border border-navy-700 text-white shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-navy-700 mb-4">
              <div className="flex items-center gap-2">
                <BotIcon className="w-5 h-5 text-terracotta-400" />
                <span className="font-bold text-sm font-display">Live Test Simulator</span>
              </div>
              <span className="text-[10px] uppercase font-mono bg-success-500/20 text-success-300 px-2 py-0.5 rounded-full border border-success-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-success-400 rounded-full animate-ping"></span> Real-time
              </span>
            </div>

            {/* Phone Screen */}
            <div className="bg-navy-950 rounded-2xl p-4 h-[360px] overflow-y-auto space-y-3 flex flex-col justify-end">
              <AnimatePresence mode="popLayout">
                {simMessages.map((msg, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-2 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs font-arabic leading-relaxed max-w-[85%] ${
                        msg.sender === 'user'
                          ? 'bg-terracotta-500 text-white rounded-tr-none'
                          : 'bg-navy-800 border border-navy-700 text-sand-50 rounded-tl-none'
                      }`}
                      dir="rtl"
                    >
                      {msg.text}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {simTyping && (
                <div className="flex gap-2 text-xs text-navy-400">
                  <span className="animate-pulse">Gemini Bot is typing...</span>
                </div>
              )}
            </div>

            {/* Sim Input Form */}
            <form onSubmit={handleSendSim} className="mt-3 flex items-center gap-2">
              <input
                type="text"
                value={simInput}
                onChange={(e) => setSimInput(e.target.value)}
                placeholder="اختبر الرد التجريبي هنا..."
                className="flex-1 bg-navy-950 border border-navy-700 rounded-xl px-3 py-2 text-xs text-white placeholder:text-navy-500 text-right font-arabic"
                dir="rtl"
              />
              <button type="submit" disabled={!simInput.trim()} className="p-2.5 rounded-xl bg-terracotta-500 text-white disabled:opacity-40">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
