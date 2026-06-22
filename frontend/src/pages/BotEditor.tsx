import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
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
        } catch {} finally {
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
        <div className="w-8 h-8 border-2 border-ash-300 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto animate-fade-up">
      <button onClick={() => navigate('/bots')} className="group flex items-center gap-1.5 font-body text-sm text-ash-400 hover:text-terracotta-500 transition-colors mb-5">
        <ArrowLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" />
        Back to bots
      </button>

      <h1 className="font-display text-3xl font-semibold text-navy-900 mb-6">{isNew ? 'Create Bot' : 'Edit Bot'}</h1>

      {error && (
        <div className="mb-6 p-3 bg-terracotta-50 border border-terracotta-300/30 rounded-lg">
          <p className="font-body text-sm text-terracotta-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-bg-card rounded-lg border border-sand-200 p-6 space-y-5">
        <div>
          <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">Bot Name</label>
          <input
            required value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none transition-all duration-200 font-body text-sm text-navy-900 placeholder:text-ash-300"
            placeholder="My Restaurant Bot"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">Channel</label>
          <select
            value={form.channel} onChange={(e) => set('channel', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none font-body text-sm text-navy-900"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook Messenger</option>
          </select>
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">WhatsApp Phone Number ID</label>
          <input
            value={form.wa_phone_number_id || ''} onChange={(e) => set('wa_phone_number_id', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none transition-all duration-200 font-body text-sm text-navy-900 placeholder:text-ash-300"
            placeholder="From Meta Business dashboard"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">WhatsApp Access Token</label>
          <input
            value={form.wa_access_token || ''} onChange={(e) => set('wa_access_token', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none transition-all duration-200 font-body text-sm text-navy-900 placeholder:text-ash-300"
            placeholder="Permanent access token"
          />
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">System Prompt</label>
          <textarea
            rows={4} value={form.system_prompt || ''} onChange={(e) => set('system_prompt', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none transition-all duration-200 font-body text-sm text-navy-900 placeholder:text-ash-300 resize-none"
            placeholder="You are a helpful assistant for an Egyptian restaurant..."
          />
        </div>

        <div>
          <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">Fallback Message</label>
          <input
            value={form.fallback_message || ''} onChange={(e) => set('fallback_message', e.target.value)}
            className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none transition-all duration-200 font-body text-sm text-navy-900 placeholder:text-ash-300"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox" id="handoff" checked={form.human_handoff_enabled}
            onChange={(e) => set('human_handoff_enabled', e.target.checked)}
            className="w-4 h-4 text-terracotta-500 border-sand-200 rounded focus:ring-terracotta-400/30"
          />
          <label htmlFor="handoff" className="font-body text-sm font-medium text-ash-600">Enable human handoff</label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit" disabled={saving}
            className="relative px-6 py-2.5 font-display text-sm font-medium tracking-wide text-white bg-navy-700 rounded-lg overflow-hidden transition-all duration-200 hover:bg-navy-600 disabled:opacity-50 group"
          >
            <span className="relative z-10">{saving ? 'Saving...' : isNew ? 'Create Bot' : 'Save Changes'}</span>
            <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          <button
            type="button" onClick={() => navigate('/bots')}
            className="px-6 py-2.5 border border-sand-200 text-ash-600 font-body text-sm font-medium rounded-lg hover:bg-sand-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
