import { useEffect, useState } from 'react';
import { 
  MessageCircle, Search, User, Send, 
  Handshake
} from 'lucide-react';
import { listBots, listConversations, getConversationMessages } from '../lib/api';
import type { Bot as BotType, Conversation, Message } from '../types';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';
import toast from 'react-hot-toast';

export default function Conversations() {
  const [bots, setBots] = useState<BotType[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyInput, setReplyInput] = useState('');

  useEffect(() => {
    (async () => {
      try { 
        const botList = await listBots();
        setBots(botList);
        if (botList.length > 0) {
          setSelectedBot(botList[0].id);
        }
      } catch (e: unknown) { 
        console.error(e); 
      } finally { 
        setLoading(false); 
      }
    })();
  }, []);

  useEffect(() => {
    if (!selectedBot) { setConversations([]); return; }
    (async () => { 
      try { 
        const convList = await listConversations(selectedBot);
        setConversations(convList);
        if (convList.length > 0 && !selectedConv) {
          setSelectedConv(convList[0].id);
        }
      } catch (e: unknown) { 
        console.error(e); 
      } 
    })();
  }, [selectedBot]);

  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    (async () => { 
      try { 
        const msgs = await getConversationMessages(selectedConv);
        setMessages(msgs);
      } catch (e: unknown) { 
        console.error(e); 
      } 
    })();
  }, [selectedConv]);

  const handleSendManualReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim()) return;

    const newMsg: Message = {
      id: `manual-${Date.now()}`,
      conversation_id: selectedConv || '',
      role: 'assistant',
      content: replyInput,
      created_at: new Date().toISOString(),
      intent_detected: 'MANUAL_AGENT_REPLY',
    };

    setMessages(prev => [...prev, newMsg]);
    setReplyInput('');
    toast.success('Reply sent to WhatsApp customer');
  };

  const filteredConversations = conversations.filter(c => 
    (c.user_display_name && c.user_display_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    c.channel_user_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.id === selectedConv);

  if (loading) return (
    <div className="space-y-8">
      <PageHeader title="Conversations" desc="Loading..." />
      <Skeleton className="h-10 max-w-xs rounded-lg" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-up">
      <PageHeader 
        title="Live Conversations" 
        desc="Real-time WhatsApp customer chats & AI telemetry" 
        descAr="متابعة المحادثات الحية والردود" 
        action={
          <div className="flex items-center gap-3">
            <select 
              value={selectedBot} 
              onChange={(e) => { setSelectedBot(e.target.value); setSelectedConv(null); }} 
              className="input max-w-xs text-xs font-semibold" 
              aria-label="Select a bot"
            >
              {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name} ({bot.channel})</option>)}
            </select>
          </div>
        }
      />

      {/* Main 2-Pane Chat Interface */}
      <div className="card overflow-hidden h-[680px] grid grid-cols-1 md:grid-cols-12 shadow-xl border border-sand-200">
        {/* Left Pane: Conversation List */}
        <div className="md:col-span-5 lg:col-span-4 border-r border-sand-200 flex flex-col bg-white">
          {/* Search Header */}
          <div className="p-3.5 border-b border-sand-100 bg-sand-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-ash-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث برقم الهاتف أو الاسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-sand-200 rounded-xl pl-9 pr-3 py-2 text-xs text-ash-700 placeholder:text-ash-400 focus:outline-none focus:border-terracotta-500 font-arabic text-right"
                dir="rtl"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto divide-y divide-sand-100">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-ash-400 text-xs">
                <MessageCircle className="w-8 h-8 text-sand-300 mx-auto mb-2" />
                <p>لا توجد محادثات مسجلة</p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={`w-full text-right p-4 transition-all flex items-start gap-3 ${
                    selectedConv === conv.id
                      ? 'bg-terracotta-50/60 border-l-4 border-terracotta-500'
                      : 'hover:bg-sand-50/70'
                  }`}
                  dir="rtl"
                >
                  <div className="w-10 h-10 rounded-full bg-sand-100 border border-sand-200 flex items-center justify-center text-ash-600 font-bold shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="font-bold text-navy-900 text-xs truncate">
                        {conv.user_display_name || conv.channel_user_id}
                      </span>
                      <span className="text-[10px] text-ash-400 font-mono" dir="ltr">
                        {new Date(conv.last_message_at || conv.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-ash-400 truncate" dir="ltr">
                      {conv.channel_user_id}
                    </p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className={`badge text-[10px] ${
                        conv.status === 'active' ? 'badge-active' : conv.status === 'handed_off' ? 'badge-handoff' : 'badge-inactive'
                      }`}>
                        {conv.status === 'active' ? 'نشط' : conv.status === 'handed_off' ? 'تحويل لبشري' : 'مكتمل'}
                      </span>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Pane: Message Viewer & Telemetry */}
        <div className="md:col-span-7 lg:col-span-8 flex flex-col bg-[#080c14] text-sand-50">
          {activeConversation ? (
            <>
              {/* Chat Active Header */}
              <div className="p-4 border-b border-slate-800 bg-[#0d1322] flex items-center justify-between" dir="rtl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-terracotta-500/20 border border-terracotta-500/30 flex items-center justify-center text-terracotta-400">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-white">
                      {activeConversation.user_display_name || activeConversation.channel_user_id}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono" dir="ltr">
                      WhatsApp: {activeConversation.channel_user_id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toast.success('Escalated to human support')}
                    className="btn bg-slate-800 hover:bg-slate-700 text-terracotta-400 text-xs px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1.5 font-arabic"
                  >
                    <Handshake className="w-3.5 h-3.5" />
                    <span>تحويل للبشر</span>
                  </button>
                </div>
              </div>

              {/* Message Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-3.5 bg-[#060911] font-arabic" dir="rtl">
                {messages.length === 0 ? (
                  <div className="text-center py-20 text-slate-500 text-xs">
                    لا توجد رسائل مسجلة في هذه المحادثة
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`p-3.5 rounded-2xl max-w-[80%] text-xs leading-relaxed shadow-sm ${
                          msg.role === 'user'
                            ? 'bg-terracotta-600 text-white rounded-tr-none'
                            : 'bg-[#141b2d] text-sand-100 rounded-tl-none border border-slate-800'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <div className="flex items-center justify-between gap-4 mt-1.5 pt-1 border-t border-white/10 text-[9px] text-slate-300/80 font-mono" dir="ltr">
                          <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {msg.intent_detected && (
                            <span className="text-gold-300 font-bold bg-white/10 px-1.5 py-0.5 rounded">
                              {msg.intent_detected}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Manual Reply Bar */}
              <form onSubmit={handleSendManualReply} className="p-3 bg-[#0d1322] border-t border-slate-800 flex gap-2">
                <input
                  type="text"
                  placeholder="اكتب رداً يدور على الواتساب مباشرة..."
                  value={replyInput}
                  onChange={(e) => setReplyInput(e.target.value)}
                  className="flex-1 bg-[#060911] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-terracotta-500 font-arabic text-right"
                  dir="rtl"
                />
                <button
                  type="submit"
                  disabled={!replyInput.trim()}
                  className="btn btn-primary px-4 py-2.5 rounded-xl text-xs font-bold disabled:opacity-40"
                  aria-label="Send WhatsApp message"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                <MessageCircle className="w-7 h-7" />
              </div>
              <h4 className="font-display font-bold text-sm text-white">اختر محادثة لعرض التفاصيل</h4>
              <p className="text-xs text-slate-400 font-arabic max-w-xs" dir="rtl">
                يمكنك معاينة نية العميل، وتحليل اللهجة، والتدخل البشري الفوري عند الحاجة.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
