import { useEffect, useState } from 'react';
import { Bot, MessageCircle, Handshake, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listBots, getAnalytics } from '../lib/api';
import type { Analytics, Bot as BotType } from '../types';

export default function Dashboard() {
  const [bots, setBots] = useState<BotType[]>([]);
  const [stats, setStats] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [b, a] = await Promise.all([listBots(), getAnalytics()]);
        setBots(b);
        setStats(a);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const activeBots = bots.filter((b) => b.is_active).length;
  const cards = [
    { label: 'Total Bots', value: bots.length, icon: Bot, color: 'bg-blue-500' },
    { label: 'Active Bots', value: activeBots, icon: MessageSquare, color: 'bg-green-500' },
    { label: 'Conversations', value: stats?.total_conversations ?? 0, icon: MessageCircle, color: 'bg-purple-500' },
    { label: 'Handoffs', value: stats?.intent_breakdown?.['HUMAN_REQUEST'] ?? 0, icon: Handshake, color: 'bg-orange-500' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          to="/bots/new"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Bot
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 ${color} rounded-lg flex items-center justify-center`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Bots</h2>
        {bots.length === 0 ? (
          <p className="text-gray-500 text-sm">No bots yet. <Link to="/bots/new" className="text-blue-600 hover:underline">Create your first bot.</Link></p>
        ) : (
          <div className="space-y-3">
            {bots.slice(0, 5).map((bot) => (
              <Link
                key={bot.id}
                to={`/bots/${bot.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${bot.is_active ? 'bg-green-500' : 'bg-gray-300'}`} />
                  <span className="font-medium text-gray-900">{bot.name}</span>
                  <span className="text-xs text-gray-400 uppercase">{bot.channel}</span>
                </div>
                <span className="text-sm text-gray-500">{bot.language}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
