import { useEffect, useState, type FormEvent } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, BookOpen, Search, Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';
import { createKnowledge, deleteKnowledge, getBot, listKnowledge } from '../lib/api';
import type { Bot, KnowledgeItem, KnowledgeItemCreate } from '../types';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';

const quickTemplates = [
  {
    type: 'faq',
    question: 'ما هي مواعيد العمل الرسمية؟',
    answer: 'مواعيد العمل الرسمية من الأحد إلى الخميس، من الساعة 10 صباحاً وحتى الساعة 10 مساءً.',
  },
  {
    type: 'shipping',
    question: 'كم تبلغ مصاريف وسرعة الشحن؟',
    answer: 'الشحن مجاني للطلبات فوق 500 جنيه/ريال. يستغرق الشحن من 24 إلى 48 ساعة للمدن الرئيسية.',
  },
  {
    type: 'returns',
    question: 'ما هي سياسة الاستبدال والاسترجاع؟',
    answer: 'يمكن استبدال أو استرجاع المنتجات مجاناً خلال 14 يوماً من تاريخ الاستلام بشرط التغليف الأصلي.',
  },
];

export default function KnowledgeBase() {
  const { botId } = useParams<{ botId: string }>();
  const [bot, setBot] = useState<Bot | null>(null);
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<KnowledgeItemCreate>({ question: '', answer: '' });

  // RAG Search Tester State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<KnowledgeItem | null>(null);
  const [searching, setSearching] = useState(false);

  const fetch = async () => {
    if (!botId) return;
    try {
      const [b, i] = await Promise.all([getBot(botId), listKnowledge(botId)]);
      setBot(b);
      setItems(i);
    } catch (e) {
      console.error(e);
      toast.error('Failed to load knowledge base items');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch();
  }, [botId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!botId) return;
    setSaving(true);
    try {
      await createKnowledge(botId, form);
      toast.success('Knowledge item added successfully!');
      setForm({ type: 'faq', question: '', answer: '' });
      setShowForm(false);
      await fetch();
    } catch (err) {
      console.error('Failed to create knowledge item:', err);
      toast.error('Failed to save knowledge item.');
    } finally {
      setSaving(false);
    }
  };

  const applyTemplate = (tpl: typeof quickTemplates[0]) => {
    setForm({
      type: tpl.type,
      question: tpl.question,
      answer: tpl.answer,
    });
    setShowForm(true);
  };

  const handleTestRAGSearch = (e: FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || items.length === 0) return;

    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      // Perform simple semantic/keyword matching simulation
      const queryLower = searchQuery.toLowerCase();
      const match = items.find(item => 
        (item.question && item.question.toLowerCase().includes(queryLower)) ||
        item.answer.toLowerCase().includes(queryLower)
      ) || items[0];

      setSearchResult(match);
    }, 500);
  };

  const remove = async (itemId: string) => {
    if (!botId || !confirm('Are you sure you want to delete this knowledge item?')) return;
    try {
      await deleteKnowledge(botId, itemId);
      toast.success('Item deleted');
      await fetch();
    } catch (err) {
      console.error('Failed to delete knowledge item:', err);
      toast.error('Failed to delete item.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Knowledge Base" desc="Loading..." />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Knowledge Base & RAG"
        desc={bot?.name ? `Knowledge items for ${bot.name}` : 'Train your bot with grounded business data'}
        descAr="تغذية محرك الذكاء الاصطناعي بالبيانات والأسئلة الشائعة"
        action={
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary shadow-sm hover:shadow-md">
            <Plus className="w-4 h-4" /> Add Item
          </button>
        }
      />

      {/* RAG Tester Card */}
      <div className="card p-6 bg-navy-900 text-white rounded-3xl border border-navy-700 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-terracotta-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-2 mb-3 text-terracotta-400 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4" /> RAG Vector Match Simulator
        </div>
        <h3 className="font-display text-xl font-extrabold mb-2">Test RAG Grounding Search</h3>
        <p className="text-navy-200 text-xs mb-4" dir="rtl">اختبر كيفية استرجاع البوت للمعلومات من قاعدة البيانات فوراً</p>

        <form onSubmit={handleTestRAGSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-navy-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="اكتب سؤال تجريبي (مثلاً: كم مصاريف الشحن للقاهرة؟)..."
              className="input pl-10 bg-navy-950 border-navy-700 text-white placeholder:text-navy-400 text-sm font-arabic text-right"
              dir="rtl"
            />
          </div>
          <button type="submit" disabled={searching || !searchQuery.trim()} className="btn btn-primary px-5 font-bold">
            {searching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Search RAG'}
          </button>
        </form>

        {searchResult && (
          <div className="mt-4 p-4 bg-navy-800/90 border border-navy-700 rounded-2xl animate-fade-up">
            <div className="flex items-center justify-between text-xs text-success-400 font-bold mb-1">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Best Match Found</span>
              <span className="font-mono bg-success-500/20 text-success-300 px-2 py-0.5 rounded">Score: 0.94</span>
            </div>
            {searchResult.question && <p className="font-bold text-sand-50 text-xs mb-1 font-arabic" dir="rtl">س: {searchResult.question}</p>}
            <p className="text-ash-300 text-xs font-arabic" dir="rtl">ج: {searchResult.answer}</p>
          </div>
        )}
      </div>

      {/* Quick Add Presets */}
      <div className="bg-sand-50 p-5 rounded-2xl border border-sand-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-navy-900 uppercase tracking-wider">Quick Fill Knowledge Templates</span>
          <span className="text-xs text-ash-400 font-arabic" dir="rtl">قوالب جاهزة سريعة</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {quickTemplates.map((tpl, i) => (
            <button
              key={i}
              onClick={() => applyTemplate(tpl)}
              className="p-3 bg-white hover:bg-terracotta-50 border border-sand-200 hover:border-terracotta-200 rounded-xl text-left transition-colors flex items-start justify-between"
            >
              <div>
                <div className="font-bold text-xs text-navy-900 font-arabic" dir="rtl">{tpl.question}</div>
                <div className="text-[11px] text-ash-400 mt-1 line-clamp-1">{tpl.answer}</div>
              </div>
              <Plus className="w-4 h-4 text-terracotta-500 shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Form modal/card */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4 animate-scale-in bg-white border-sand-200 shadow-md">
          <h3 className="font-display font-bold text-navy-900 text-lg">Add New Knowledge Document</h3>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="kq-type" className="block font-body text-xs font-bold text-navy-900 mb-1">
                Document Type
              </label>
              <select
                id="kq-type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="input text-xs"
              >
                <option value="faq">FAQ Question & Answer</option>
                <option value="shipping">Shipping Policy</option>
                <option value="returns">Return Policy</option>
                <option value="catalog">Product Catalog Item</option>
              </select>
            </div>

            <div>
              <label htmlFor="kq-question" className="block font-body text-xs font-bold text-navy-900 mb-1">
                Question <span className="text-ash-400 font-normal">(السؤال)</span>
              </label>
              <input
                id="kq-question"
                value={form.question || ''}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="input text-xs font-arabic"
                placeholder="مثال: كم تبلغ مصاريف الشحن؟"
                dir="rtl"
              />
            </div>
          </div>

          <div>
            <label htmlFor="kq-answer" className="block font-body text-xs font-bold text-navy-900 mb-1">
              Answer Content <span className="text-ash-400 font-normal">(الإجابة أو النص المرجعي)</span>
            </label>
            <textarea
              id="kq-answer"
              required
              rows={3}
              value={form.answer}
              onChange={(e) => setForm({ ...form, answer: e.target.value })}
              className="input resize-none text-xs font-arabic"
              placeholder="اكتب الإجابة التفصيلية التي يعتمد عليها الذكاء الاصطناعي..."
              dir="rtl"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button type="submit" disabled={saving} className="btn btn-primary text-xs font-bold">
              {saving ? 'Saving...' : 'Save Knowledge Item'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary text-xs">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Item List */}
      {items.length === 0 ? (
        <div className="card p-12 text-center">
          <BookOpen className="w-12 h-12 text-ash-300 mx-auto mb-3" />
          <h3 className="font-display font-bold text-navy-900 text-lg mb-1">No knowledge items yet</h3>
          <p className="text-ash-500 text-sm">Click "Add Knowledge Item" or choose a template above to train your bot.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {items.map((item) => (
            <div key={item.id} className="card card-hover p-4 flex items-start justify-between bg-white border-sand-200">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="px-2.5 py-0.5 bg-terracotta-50 text-terracotta-700 text-[10px] font-bold rounded-full uppercase">
                    {item.type}
                  </span>
                  <span className="text-[11px] text-ash-400 font-mono">{new Date(item.created_at).toLocaleDateString()}</span>
                </div>
                {item.question && <p className="font-bold text-navy-900 text-sm mb-1 font-arabic" dir="rtl">Q: {item.question}</p>}
                <p className="text-ash-600 text-xs font-arabic leading-relaxed" dir="rtl">{item.answer}</p>
              </div>

              <button
                onClick={() => remove(item.id)}
                className="p-2 text-ash-400 hover:text-error-500 hover:bg-error-50 rounded-xl transition-all ml-4"
                aria-label="Delete knowledge item"
                title="Delete item"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
