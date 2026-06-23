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
        <div className="w-10 h-10 border-2 border-ash-200 border-t-terracotta-500 rounded-full animate-spin" />
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
        <div className="mb-6 p-3 bg-terracotta-50 border border-terracotta-300/30 rounded-lg" role="alert">
          <p className="font-body text-sm text-terracotta-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label htmlFor="bot-name" className="block font-body text-sm font-medium text-ash-600 mb-1.5">Bot Name</label>
          <input
            id="bot-name"
            required value={form.name} onChange={(e) => set('name', e.target.value)}
            className="input"
            placeholder="My Restaurant Bot"
          />
        </div>

        <div>
          <label htmlFor="bot-channel" className="block font-body text-sm font-medium text-ash-600 mb-1.5">Channel</label>
          <select
            id="bot-channel"
            value={form.channel} onChange={(e) => set('channel', e.target.value)}
            className="input"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook Messenger</option>
          </select>
        </div>

        <div>
          <label htmlFor="wa-phone" className="block font-body text-sm font-medium text-ash-600 mb-1.5">WhatsApp Phone Number ID</label>
          <input
            id="wa-phone"
            value={form.wa_phone_number_id || ''} onChange={(e) => set('wa_phone_number_id', e.target.value)}
            className="input"
            placeholder="From Meta Business dashboard"
          />
        </div>

        <div>
          <label htmlFor="wa-token" className="block font-body text-sm font-medium text-ash-600 mb-1.5">WhatsApp Access Token</label>
          <input
            id="wa-token"
            type="password"
            value={form.wa_access_token || ''} onChange={(e) => set('wa_access_token', e.target.value)}
            className="input"
            placeholder="Permanent access token"
          />
        </div>

        <div>
          <label htmlFor="system-prompt" className="block font-body text-sm font-medium text-ash-600 mb-1.5">System Prompt</label>
          <textarea
            id="system-prompt"
            rows={4} value={form.system_prompt || ''} onChange={(e) => set('system_prompt', e.target.value)}
            className="input resize-none"
            placeholder="You are a helpful assistant for an Egyptian restaurant..."
          />
        </div>

        <div>
          <label htmlFor="fallback" className="block font-body text-sm font-medium text-ash-600 mb-1.5">Fallback Message</label>
          <input
            id="fallback"
            value={form.fallback_message || ''} onChange={(e) => set('fallback_message', e.target.value)}
            className="input"
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
            className="btn btn-primary group relative overflow-hidden"
          >
            <span className="relative z-10">{saving ? 'Saving...' : isNew ? 'Create Bot' : 'Save Changes'}</span>
            <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
          <button
            type="button" onClick={() => navigate('/bots')}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
