import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { createKnowledge, deleteKnowledge, getBot, listKnowledge } from '../lib/api';
import type { Bot, KnowledgeItem, KnowledgeItemCreate } from '../types';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';

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
    } catch {} finally { setLoading(false); }
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

  if (loading) return (
    <div className="space-y-8">
      <PageHeader title="Knowledge Base" desc="Loading..." />
      <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Knowledge Base"
        desc={bot?.name ? `Knowledge items for ${bot.name}` : undefined}
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary group relative overflow-hidden">
            <span className="relative z-10 flex items-center gap-2"><Plus className="w-4 h-4" /> Add Item</span>
            <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        }
      />

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-6 space-y-4 animate-scale-in">
          <div>
            <label htmlFor="kq-question" className="block font-body text-sm font-medium text-ash-600 mb-1.5">Question (optional)</label>
            <input id="kq-question" value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })} className="input" placeholder="What are your working hours?" />
          </div>
          <div>
            <label htmlFor="kq-answer" className="block font-body text-sm font-medium text-ash-600 mb-1.5">Answer</label>
            <textarea id="kq-answer" required rows={3} value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} className="input resize-none" placeholder="We are open daily from 10 AM to 11 PM..." />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="btn btn-primary">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="card p-12 text-center animate-scale-in">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-terracotta-500/5 rounded-full pointer-events-none" />
          <BookOpen className="w-12 h-12 text-ash-200 mx-auto mb-4" />
          <h2 className="font-display text-lg font-semibold text-navy-900 mb-2">No knowledge items yet</h2>
          <p className="font-body text-sm text-ash-400">Add FAQs so your bot can answer common questions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card card-hover p-4 animate-fade-up">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {item.question && <p className="font-body text-sm font-medium text-navy-900 mb-1">Q: {item.question}</p>}
                  <p className="font-body text-sm text-ash-500 leading-relaxed">{item.answer}</p>
                </div>
                <button onClick={() => remove(item.id)} className="p-1.5 text-ash-400 hover:text-red-500 ml-4 transition-all duration-150 rounded-lg hover:bg-red-50 active:scale-90" aria-label="Delete knowledge item">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <span className="px-2.5 py-0.5 bg-terracotta-50 text-terracotta-600 text-xs rounded font-medium capitalize">{item.type}</span>
                <span className="font-body text-xs text-ash-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
