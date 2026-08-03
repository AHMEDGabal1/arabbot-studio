import { useEffect, useState } from 'react';
import { CheckCircle, Handshake, MessageSquare, UserCheck, Clock, Send } from 'lucide-react';
import { listHandoffs, resolveHandoff, assignHandoff } from '../lib/api';
import type { Handoff } from '../types';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';

const cannedResponses = [
  'أهلاً بك يا فندم، أنا الأستاذ أحمد من الدعم الفني، كيف يمكنني مساعدتك؟',
  'تم مراجعة طلبك وجاري تتبع الشحنة الآن من قبل موظف الخدمة.',
  'يسعدنا تقديم المساعدة دائماً! تم حل المشكلة بنجاح.',
];

export default function Handoffs() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeHandoff, setActiveHandoff] = useState<Handoff | null>(null);
  const [replyText, setReplyText] = useState('');
  const [chatLog, setChatLog] = useState<Array<{ sender: 'customer' | 'agent'; text: string; time: string }>>([
    { sender: 'customer', text: 'سلام عليكم، محتاج اتكلم مع حد من خدمة العملاء ضرورى بخصوص الطلب!', time: '10:42 AM' },
  ]);

  const fetchHandoffs = async () => {
    try {
      const list = await listHandoffs();
      setHandoffs(list);
      if (list.length > 0 && !activeHandoff) {
        setActiveHandoff(list[0]);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch handoff queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandoffs();
  }, []);

  const resolve = async (id: string) => {
    try {
      await resolveHandoff(id);
      toast.success('Handoff resolved successfully!');
      if (activeHandoff?.id === id) {
        setActiveHandoff(null);
      }
      await fetchHandoffs();
    } catch (err) {
      toast.error('Failed to resolve handoff');
    }
  };

  const claim = async (id: string) => {
    try {
      await assignHandoff(id, 'agent');
      toast.success('Conversation claimed!');
      await fetchHandoffs();
    } catch (err) {
      toast.error('Failed to claim conversation');
    }
  };

  const handleSendAgentReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setChatLog((prev) => [
      ...prev,
      { sender: 'agent', text: replyText, time: 'Just now' },
    ]);
    setReplyText('');
    toast.success('Reply sent to customer via WhatsApp');
  };

  const insertCanned = (text: string) => {
    setReplyText(text);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Handoffs" desc="Loading..." />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const pending = handoffs.filter((h) => !h.resolved_at);
  const resolved = handoffs.filter((h) => h.resolved_at);

  return (
    <div className="space-y-8 animate-fade-up">
      <PageHeader
        title="Live Agent Handoff Console"
        desc="Real-time escalation queue for human agent takeover"
        descAr="منصة التحكم الفوري لطلبات تحويل الدعم للبشر"
      />

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Pending & Resolved Queue List */}
        <div className="lg:col-span-5 space-y-6">
          {/* Pending Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-navy-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-terracotta-500" /> Pending Escalations ({pending.length})
              </h3>
              <span className="text-[10px] bg-terracotta-50 text-terracotta-700 font-bold px-2 py-0.5 rounded-full">
                Requires Action
              </span>
            </div>

            {pending.length === 0 ? (
              <div className="card p-6 text-center text-ash-400 text-sm">
                No pending handoffs. All conversations are handled by the AI.
              </div>
            ) : (
              <div className="space-y-2.5">
                {pending.map((h) => {
                  const isSelected = activeHandoff?.id === h.id;
                  return (
                    <div
                      key={h.id}
                      onClick={() => setActiveHandoff(h)}
                      className={`card p-4 cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-terracotta-500 bg-terracotta-50/20 shadow-md ring-1 ring-terracotta-500/30'
                          : 'border-sand-200 hover:border-sand-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-1.5">
                        <span className="font-mono text-xs font-bold text-navy-900">
                          Conv: {h.conversation_id.slice(0, 8)}...
                        </span>
                        <span className="text-[10px] text-ash-400 font-mono">
                          {new Date(h.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-xs text-ash-600 font-arabic line-clamp-1 mb-3" dir="rtl">
                        السبب: {h.reason || 'طلب التحدث مع موظف دعم'}
                      </p>
                      <div className="flex items-center justify-between pt-2 border-t border-sand-100 text-xs">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            claim(h.id);
                          }}
                          className="text-terracotta-600 font-bold hover:underline flex items-center gap-1"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> Claim Conversation
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            resolve(h.id);
                          }}
                          className="px-2.5 py-1 bg-success-50 text-success-700 font-bold text-[11px] rounded-lg hover:bg-success-100 transition-colors flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Resolve
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Resolved Section */}
          {resolved.length > 0 && (
            <div>
              <h3 className="font-display font-bold text-ash-400 text-xs uppercase tracking-wider mb-3">
                Recently Resolved ({resolved.length})
              </h3>
              <div className="space-y-2">
                {resolved.map((h) => (
                  <div key={h.id} className="card p-3 opacity-60 bg-white border-sand-200 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-navy-900">Conv {h.conversation_id.slice(0, 8)}...</span>
                    <span className="text-success-600 font-bold flex items-center gap-1">
                      <CheckCircle className="w-3.5 h-3.5" /> Resolved
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Live Agent Chat & Response Console */}
        <div className="lg:col-span-7">
          {activeHandoff ? (
            <div className="card p-6 bg-white border-sand-200 shadow-md space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-sand-200">
                <div>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-terracotta-500" />
                    <h3 className="font-display font-bold text-navy-900 text-base">
                      Live Customer Escalation Ticket
                    </h3>
                  </div>
                  <p className="text-xs text-ash-400 font-mono mt-0.5">ID: {activeHandoff.id}</p>
                </div>
                <button
                  onClick={() => resolve(activeHandoff.id)}
                  className="btn btn-primary text-xs font-bold px-4 py-2"
                >
                  <CheckCircle className="w-4 h-4" /> Mark Resolved
                </button>
              </div>

              {/* Chat Log Window */}
              <div className="bg-sand-50 rounded-2xl p-4 h-[320px] overflow-y-auto space-y-3 border border-sand-200">
                {chatLog.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex gap-2 ${msg.sender === 'agent' ? 'flex-row-reverse' : ''}`}
                  >
                    <div
                      className={`p-3 rounded-2xl text-xs font-arabic max-w-[85%] leading-relaxed ${
                        msg.sender === 'agent'
                          ? 'bg-navy-900 text-white rounded-tr-none'
                          : 'bg-white border border-sand-200 text-ash-700 rounded-tl-none shadow-sm'
                      }`}
                      dir="rtl"
                    >
                      <div className="font-bold text-[10px] text-terracotta-400 mb-1">
                        {msg.sender === 'agent' ? 'أنت (موظف الدعم)' : 'العميل'}
                      </div>
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Canned Quick Responses */}
              <div>
                <span className="text-[11px] font-bold text-ash-400 uppercase tracking-wider block mb-1.5">
                  Quick Canned Replies (ردود سريعة جاهزة)
                </span>
                <div className="flex flex-wrap gap-2">
                  {cannedResponses.map((res, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => insertCanned(res)}
                      className="px-3 py-1.5 bg-sand-100 hover:bg-terracotta-50 border border-sand-200 hover:border-terracotta-200 rounded-xl text-xs font-arabic text-navy-900 transition-colors text-right"
                      dir="rtl"
                    >
                      {res.slice(0, 30)}...
                    </button>
                  ))}
                </div>
              </div>

              {/* Send Form */}
              <form onSubmit={handleSendAgentReply} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="اكتب ردك المباشر للعميل على الواتساب..."
                  className="input text-xs font-arabic text-right flex-1"
                  dir="rtl"
                />
                <button type="submit" disabled={!replyText.trim()} className="btn btn-primary px-5 text-xs font-bold">
                  <Send className="w-4 h-4" /> Send Reply
                </button>
              </form>
            </div>
          ) : (
            <div className="card p-12 text-center text-ash-400">
              <Handshake className="w-12 h-12 text-ash-200 mx-auto mb-3" />
              <p className="font-display font-bold text-navy-900 text-base mb-1">Select an Escalation Ticket</p>
              <p className="text-xs">Choose a pending handoff from the queue on the left to claim and respond.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
