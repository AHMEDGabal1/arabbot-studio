import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { createKnowledge, deleteKnowledge, getBot, listKnowledge } from '../lib/api';
import type { Bot, KnowledgeItem, KnowledgeItemCreate } from '../types';

export default function KnowledgeBase() {
  const { botId } = useParams<{ botId: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<KnowledgeItemCreate>({ answer: '' });

  const fetch = async () => {
    if (!botId) return;
    try {
      const [b, i] = await Promise.all([getBot(botId), listKnowledge(botId)]);
      setBot(b);
      setItems(i);
    } catch {} finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [botId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!botId) return;
    await createKnowledge(botId, form);
    setForm({ answer: '' });
    setShowForm(false);
    await fetch();
  };

  const remove = async (itemId: string) => {
    if (!botId || !confirm('Delete this item?')) return;
    await deleteKnowledge(botId, itemId);
    await fetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-ash-300 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy-900">Knowledge Base</h1>
          {bot && <p className="font-body text-sm text-ash-500 mt-1">{bot.name}</p>}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="group relative inline-flex items-center gap-2 px-4 py-2.5 font-display text-sm font-medium tracking-wide text-white bg-navy-700 rounded-lg overflow-hidden transition-all duration-200 hover:bg-navy-600"
        >
          <span className="relative z-10 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</span>
          <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-bg-card rounded-lg border border-sand-200 p-5 mb-6 space-y-4">
          <div>
            <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">Question (optional)</label>
            <input
              value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none transition-all duration-200 font-body text-sm text-navy-900 placeholder:text-ash-300"
              placeholder="What are your working hours?"
            />
          </div>
          <div>
            <label className="block font-body text-sm font-medium text-ash-600 mb-1.5">Answer</label>
            <textarea
              required rows={3} value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              className="w-full px-4 py-3 bg-white border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none transition-all duration-200 font-body text-sm text-navy-900 placeholder:text-ash-300 resize-none"
              placeholder="We are open daily from 10 AM to 11 PM..."
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="px-4 py-2.5 font-display text-sm font-medium tracking-wide text-white bg-navy-700 rounded-lg hover:bg-navy-600 transition-colors">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 border border-sand-200 text-ash-600 font-body text-sm font-medium rounded-lg hover:bg-sand-50 transition-colors">Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="relative bg-bg-card rounded-lg border border-sand-200 p-12 text-center overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-terracotta-500/5 rounded-full" />
          <BookOpen className="w-12 h-12 text-ash-200 mx-auto mb-4" />
          <h2 className="font-display text-lg font-semibold text-navy-900 mb-2">No knowledge items yet</h2>
          <p className="font-body text-sm text-ash-400">Add FAQs so your bot can answer common questions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-bg-card rounded-lg border border-sand-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {item.question && <p className="font-body text-sm font-medium text-navy-900 mb-1">Q: {item.question}</p>}
                  <p className="font-body text-sm text-ash-500 leading-relaxed">{item.answer}</p>
                </div>
                <button onClick={() => remove(item.id)} className="p-1.5 text-ash-400 hover:text-red-500 ml-4 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2.5 py-0.5 bg-terracotta-50 text-terracotta-600 text-xs rounded font-medium">{item.type}</span>
                <span className="font-body text-xs text-ash-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
