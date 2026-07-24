import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { createBot, getBot, updateBot } from '../lib/api';
import type { BotCreate } from '../types';

export default function BotEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = !id || id === 'new';
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<BotCreate>({
    name: '',
    channel: 'whatsapp',
    wa_phone_number_id: '',
    wa_access_token: '',
    system_prompt: '',
    fallback_message: 'هورينك لحد من فريقنا دلوقتي',
    human_handoff_enabled: true,
  });

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
        } catch (e) { console.error(e); toast.error('Failed to load bot'); } finally {
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
      } else {
        await updateBot(id!, form);
      }
      navigate('/bots');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to save bot');
    } finally {
      setSaving(false);
    }
  };

  const set = (key: keyof BotCreate, value: any) => setForm((f) => ({ ...f, [key]: value }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-sand-200 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto"
    >
      <button onClick={() => navigate('/bots')} className="group flex items-center gap-1.5 font-body text-sm text-ash-400 hover:text-terracotta-500 transition-colors mb-5">
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-1" />
        Back to bots
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-terracotta-500/10 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-terracotta-500" />
        </div>
        <h1 className="font-display text-3xl font-semibold text-navy-900">{isNew ? 'Create Bot' : 'Edit Bot'}</h1>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-terracotta-50/80 border border-terracotta-300/30 rounded-xl flex items-start gap-3" role="alert">
          <p className="font-body text-sm text-terracotta-700 font-medium">{error}</p>
        </motion.div>
      )}

      <motion.form 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={handleSubmit} 
        className="card p-8 space-y-6 bg-white/60 backdrop-blur-md shadow-sm border-white/50 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-terracotta-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        
        <div className="relative z-10 space-y-5">
          <div>
            <label htmlFor="bot-name" className="block font-body text-sm font-medium text-navy-900 mb-1.5">Bot Name</label>
            <input
              id="bot-name" autoComplete="off"
              required value={form.name} onChange={(e) => set('name', e.target.value)}
              className="input bg-white/70 focus:bg-white"
              placeholder="e.g. Support Bot, Sales Assistant"
            />
          </div>

          <div>
            <label htmlFor="bot-channel" className="block font-body text-sm font-medium text-navy-900 mb-1.5">Channel</label>
            <select
              id="bot-channel"
              value={form.channel} onChange={(e) => set('channel', e.target.value)}
              className="input bg-white/70 focus:bg-white"
            >
              <option value="whatsapp">WhatsApp</option>
              <option value="facebook">Facebook Messenger</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label htmlFor="wa-phone" className="block font-body text-sm font-medium text-navy-900 mb-1.5">WhatsApp Phone ID</label>
              <input
                id="wa-phone"
                value={form.wa_phone_number_id || ''} onChange={(e) => set('wa_phone_number_id', e.target.value)}
                className="input bg-white/70 focus:bg-white font-mono text-sm"
                placeholder="102345678901234"
              />
            </div>

            <div>
              <label htmlFor="wa-token" className="block font-body text-sm font-medium text-navy-900 mb-1.5">WhatsApp Access Token</label>
              <input
                id="wa-token"
                type="password"
                value={form.wa_access_token || ''} onChange={(e) => set('wa_access_token', e.target.value)}
                className="input bg-white/70 focus:bg-white font-mono text-sm tracking-widest"
                placeholder="EAA..."
              />
            </div>
          </div>

          <div>
            <label htmlFor="system-prompt" className="block font-body text-sm font-medium text-navy-900 mb-1.5">System Prompt</label>
            <p className="font-body text-xs text-ash-400 mb-2">Instructions that define the bot's behavior and personality.</p>
            <textarea
              id="system-prompt"
              rows={4} value={form.system_prompt || ''} onChange={(e) => set('system_prompt', e.target.value)}
              className="input bg-white/70 focus:bg-white resize-none"
              placeholder="You are a helpful assistant for an Egyptian restaurant..."
            />
          </div>

          <div>
            <label htmlFor="fallback" className="block font-body text-sm font-medium text-navy-900 mb-1.5">Fallback Message (Arabic)</label>
            <p className="font-body text-xs text-ash-400 mb-2">Sent when the bot cannot understand the user or needs to handoff.</p>
            <input
              id="fallback"
              value={form.fallback_message || ''} onChange={(e) => set('fallback_message', e.target.value)}
              className="input bg-white/70 focus:bg-white font-arabic"
              dir="auto"
            />
          </div>

          <div className="flex items-center gap-3 py-2">
            <input
              type="checkbox" id="handoff" checked={form.human_handoff_enabled}
              onChange={(e) => set('human_handoff_enabled', e.target.checked)}
              className="w-4 h-4 text-terracotta-500 border-sand-300 rounded focus:ring-terracotta-400/30 transition-colors"
            />
            <label htmlFor="handoff" className="font-body text-sm font-medium text-navy-900 cursor-pointer select-none">Enable human handoff</label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-sand-200/60">
            <button
              type="submit" disabled={saving}
              className="btn btn-primary min-w-[140px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4 transition-transform group-hover:scale-110" />
                  {isNew ? 'Create Bot' : 'Save Changes'}
                </>
              )}
            </button>
            <button
              type="button" onClick={() => navigate('/bots')}
              className="btn btn-secondary bg-white shadow-sm"
              disabled={saving}
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  );
}
