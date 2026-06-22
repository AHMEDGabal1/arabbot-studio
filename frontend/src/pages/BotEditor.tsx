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
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => navigate('/bots')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to bots
      </button>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">{isNew ? 'Create Bot' : 'Edit Bot'}</h1>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bot Name</label>
          <input
            required value={form.name} onChange={(e) => set('name', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="My Restaurant Bot"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Channel</label>
          <select
            value={form.channel} onChange={(e) => set('channel', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
          >
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook Messenger</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Phone Number ID</label>
          <input
            value={form.wa_phone_number_id || ''} onChange={(e) => set('wa_phone_number_id', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="From Meta Business dashboard"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Access Token</label>
          <input
            value={form.wa_access_token || ''} onChange={(e) => set('wa_access_token', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="Permanent access token"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System Prompt</label>
          <textarea
            rows={4} value={form.system_prompt || ''} onChange={(e) => set('system_prompt', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="You are a helpful assistant for an Egyptian restaurant..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fallback Message</label>
          <input
            value={form.fallback_message || ''} onChange={(e) => set('fallback_message', e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox" id="handoff" checked={form.human_handoff_enabled}
            onChange={(e) => set('human_handoff_enabled', e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="handoff" className="text-sm font-medium text-gray-700">Enable human handoff</label>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit" disabled={saving}
            className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : isNew ? 'Create Bot' : 'Save Changes'}
          </button>
          <button
            type="button" onClick={() => navigate('/bots')}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
