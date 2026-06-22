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
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Knowledge Base</h1>
          {bot && <p className="text-sm text-gray-500 mt-1">{bot.name}</p>}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-4 mb-6 space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question (optional)</label>
            <input
              value={form.question || ''} onChange={(e) => setForm({ ...form, question: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="What are your working hours?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
            <textarea
              required rows={3} value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="We are open daily from 10 AM to 11 PM..."
            />
          </div>
          <div className="flex items-center gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              Save
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </form>
      )}

      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No knowledge items yet</h2>
          <p className="text-gray-500">Add FAQs so your bot can answer common questions</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {item.question && <p className="font-medium text-gray-900 mb-1">Q: {item.question}</p>}
                  <p className="text-sm text-gray-600">{item.answer}</p>
                </div>
                <button onClick={() => remove(item.id)} className="p-1.5 text-gray-400 hover:text-red-600 ml-4">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{item.type}</span>
                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
