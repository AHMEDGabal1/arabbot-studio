import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { listBots, listConversations, getConversationMessages } from '../lib/api';
import type { Bot, Conversation, Message } from '../types';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';

export default function Conversations() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setBots(await listBots()); } catch (e: unknown) { console.error(e); } finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedBot) { setConversations([]); return; }
    (async () => { try { setConversations(await listConversations(selectedBot)); } catch (e: unknown) { console.error(e); } })();
  }, [selectedBot]);

  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    (async () => { try { setMessages(await getConversationMessages(selectedConv)); } catch (e: unknown) { console.error(e); } })();
  }, [selectedConv]);

  if (loading) return (
    <div className="space-y-8">
      <PageHeader title="Conversations" desc="Loading..." />
      <Skeleton className="h-10 max-w-xs rounded-lg" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="animate-fade-up">
      <PageHeader title="Conversations" desc="Browse and review bot conversations" descAr="عرض المحادثات والردود" />

      <div className="mb-5">
        <select value={selectedBot} onChange={(e) => { setSelectedBot(e.target.value); setSelectedConv(null); }} className="input max-w-xs" aria-label="Select a bot">
          <option value="">Select a bot...</option>
          {bots.map((bot) => <option key={bot.id} value={bot.id}>{bot.name}</option>)}
        </select>
      </div>

      {!selectedBot && (
        <div className="card p-12 text-center animate-scale-in">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-terracotta-500/5 rounded-full pointer-events-none" />
          <MessageCircle className="w-12 h-12 text-ash-200 mx-auto mb-4" />
          <p className="font-body text-sm text-ash-400">Select a bot to view conversations</p>
        </div>
      )}

      {selectedBot && conversations.length === 0 && (
        <div className="card p-12 text-center animate-scale-in">
          <p className="font-body text-sm text-ash-400">No conversations yet</p>
        </div>
      )}

      {selectedBot && conversations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card overflow-hidden animate-scale-in">
            <div className="divide-y divide-sand-100">
              {conversations.map((conv) => (
                <button key={conv.id} onClick={() => setSelectedConv(conv.id)}
                  className={`w-full text-left p-4 transition-all duration-150 hover:bg-sand-50 ${
                    selectedConv === conv.id ? 'bg-terracotta-50 border-l-2 border-terracotta-400' : 'border-l-2 border-transparent hover:border-l-2 hover:border-sand-200'
                  }`}
                  aria-label={`Conversation with ${conv.user_display_name || conv.channel_user_id}`}>
                  <p className="font-body text-sm font-medium text-navy-900 truncate">{conv.channel_user_id}</p>
                  <p className="font-body text-xs text-ash-400 mt-0.5">{conv.user_display_name || 'Unknown'}</p>
                  <span className={`badge mt-1.5 ${conv.status === 'active' ? 'badge-active' : conv.status === 'handed_off' ? 'badge-handoff' : 'badge-inactive'}`}>{conv.status}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedConv && (
            <div className="card p-5 max-h-[600px] overflow-y-auto animate-scale-in">
              <h2 className="font-body text-xs font-medium text-ash-400 tracking-wider uppercase mb-4">Messages</h2>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-fade-up`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm leading-relaxed ${msg.role === 'user' ? 'bg-sand-100 text-navy-900' : 'bg-navy-700 text-sand-50'}`}>
                      <p className="font-body">{msg.content}</p>
                      <p className={`font-body text-xs mt-1.5 ${msg.role === 'user' ? 'text-ash-400' : 'text-ash-300'}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}{msg.intent_detected && ` · ${msg.intent_detected}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
