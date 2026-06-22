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
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Conversations</h1>

      <div className="mb-4">
        <select
          value={selectedBot} onChange={(e) => { setSelectedBot(e.target.value); setSelectedConv(null); }}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white"
        >
          <option value="">Select a bot...</option>
          {bots.map((bot) => (
            <option key={bot.id} value={bot.id}>{bot.name}</option>
          ))}
        </select>
      </div>

      {!selectedBot && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a bot to view conversations</p>
        </div>
      )}

      {selectedBot && conversations.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500">No conversations yet</p>
        </div>
      )}

      {selectedBot && conversations.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConv(conv.id)}
                  className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${selectedConv === conv.id ? 'bg-blue-50' : ''}`}
                >
                  <p className="font-medium text-gray-900 truncate">{conv.channel_user_id}</p>
                  <p className="text-sm text-gray-500">{conv.user_display_name || 'Unknown'}</p>
                  <span className={`inline-flex items-center px-2 py-0.5 mt-1 text-xs rounded-full ${
                    conv.status === 'active' ? 'bg-green-100 text-green-700' :
                    conv.status === 'handed_off' ? 'bg-orange-100 text-orange-700' :
                    'bg-gray-100 text-gray-500'
                  }`}>{conv.status}</span>
                </button>
              ))}
            </div>
          </div>

          {selectedConv && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 max-h-[600px] overflow-y-auto">
              <h2 className="text-sm font-medium text-gray-500 mb-4">Messages</h2>
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      msg.role === 'user'
                        ? 'bg-gray-100 text-gray-900'
                        : 'bg-blue-600 text-white'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-gray-400' : 'text-blue-200'}`}>
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
