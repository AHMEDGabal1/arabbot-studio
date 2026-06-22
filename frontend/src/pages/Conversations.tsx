import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { listBots, listConversations, getConversationMessages } from '../lib/api';
import type { Bot, Conversation, Message } from '../types';

export default function Conversations() {
  const [bots, setBots] = useState<Bot[]>([]);
  const [selectedBot, setSelectedBot] = useState<string>('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try { setBots(await listBots()); } catch {} finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (!selectedBot) { setConversations([]); return; }
    (async () => {
      try { setConversations(await listConversations(selectedBot)); } catch {}
    })();
  }, [selectedBot]);

  useEffect(() => {
    if (!selectedConv) { setMessages([]); return; }
    (async () => {
      try { setMessages(await getConversationMessages(selectedConv)); } catch {}
    })();
  }, [selectedConv]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-ash-300 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-navy-900">Conversations</h1>
        <p className="font-body text-sm text-ash-500 mt-1">Browse and review bot conversations</p>
      </div>

      <div className="mb-5">
        <select
          value={selectedBot} onChange={(e) => { setSelectedBot(e.target.value); setSelectedConv(null); }}
          className="px-4 py-2.5 bg-bg-card border border-sand-200 rounded-lg focus:border-terracotta-400 focus:ring-1 focus:ring-terracotta-400/30 outline-none font-body text-sm text-navy-900"
        >
          <option value="">Select a bot...</option>
          {bots.map((bot) => (
            <option key={bot.id} value={bot.id}>{bot.name}</option>
          ))}
        </select>
      </div>

      {!selectedBot && (
        <div className="relative bg-bg-card rounded-lg border border-sand-200 p-12 text-center overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-terracotta-500/5 rounded-full" />
          <MessageCircle className="w-12 h-12 text-ash-200 mx-auto mb-4" />
          <p className="font-body text-sm text-ash-400">Select a bot to view conversations</p>
        </div>
      )}

      {selectedBot && conversations.length === 0 && (
        <div className="relative bg-bg-card rounded-lg border border-sand-200 p-12 text-center">
          <p className="font-body text-sm text-ash-400">No conversations yet</p>
        </div>
      )}

      {selectedBot && conversations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-bg-card rounded-lg border border-sand-200 overflow-hidden">
            <div className="divide-y divide-sand-100">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={`w-full text-left p-4 hover:bg-sand-50 transition-colors ${
                    selectedConv === conv.id ? 'bg-terracotta-50 border-l-2 border-terracotta-400' : 'border-l-2 border-transparent'
                  }`}
                >
                  <p className="font-body text-sm font-medium text-navy-900 truncate">{conv.channel_user_id}</p>
                  <p className="font-body text-xs text-ash-400 mt-0.5">{conv.user_display_name || 'Unknown'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 mt-1.5 text-xs rounded ${
                    conv.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                    conv.status === 'handed_off' ? 'bg-gold-400/10 text-gold-600' :
                    'bg-ash-100 text-ash-500'
                  }`}>{conv.status}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedConv && (
            <div className="bg-bg-card rounded-lg border border-sand-200 p-5 max-h-[600px] overflow-y-auto">
              <h2 className="font-body text-xs font-medium text-ash-400 tracking-wider uppercase mb-4">Messages</h2>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'} animate-fade-up`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-sand-100 text-navy-900'
                        : 'bg-navy-700 text-sand-50'
                    }`}>
                      <p className="font-body leading-relaxed">{msg.content}</p>
                      <p className={`font-body text-xs mt-1.5 ${msg.role === 'user' ? 'text-ash-400' : 'text-ash-300'}`}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                        {msg.intent_detected && ` · ${msg.intent_detected}`}
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
