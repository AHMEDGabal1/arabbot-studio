import { useEffect, useState } from 'react';
import { Bot, MessageCircle, Handshake, MessageSquare, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listBots, getAnalyticsOverview } from '../lib/api';
import type { Analytics, Bot as BotType } from '../types';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Skeleton from '../components/Skeleton';

export default function Dashboard() {
  const [bots, setBots] = useState<BotType[]>([]);
  const [stats, setStats] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [b, a] = await Promise.all([listBots(), getAnalyticsOverview()]);
        setBots(b);
        setStats(a);
      } catch (e) { console.error(e); } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <PageHeader title="Dashboard" desc="Loading your ecosystem..." />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const activeBots = bots.filter((b) => b.is_active).length;
  const statCards = [
    { label: 'Total Bots', value: bots.length, icon: Bot, accent: 'terracotta' as const },
    { label: 'Active Bots', value: activeBots, icon: MessageSquare, accent: 'gold' as const },
    { label: 'Conversations', value: stats?.total_conversations ?? 0, icon: MessageCircle, accent: 'navy' as const },
    { label: 'Handoffs', value: stats?.intent_breakdown?.['HUMAN_REQUEST'] ?? 0, icon: Handshake, accent: 'ash' as const },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        desc="Overview of your bot ecosystem"
        descAr="نظرة عامة على بوتاتك"
        action={
          <Link to="/bots/new" className="btn btn-primary">
            <Plus className="w-4 h-4" /> New Bot
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 perspective">
        {statCards.map((s, i) => (
          <div key={s.label} style={{ animationDelay: `${i * 0.08}s` }}>
            <StatCard {...s} />
          </div>
        ))}
      </div>

      <div className="card animate-scale-in">
        <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta-500/5 rounded-bl-full pointer-events-none" />
        <div className="relative px-6 py-5 border-b border-sand-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-navy-900">Recent Bots</h2>
              <p className="font-body text-xs text-ash-400 mt-0.5">Your most recently created bots</p>
            </div>
            {bots.length > 0 && (
              <Link to="/bots" className="font-body text-sm font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors">
                View all
              </Link>
            )}
          </div>
        </div>
        <div className="relative px-6 py-4">
          {bots.length === 0 ? (
            <div className="py-8 text-center">
              <Bot className="w-10 h-10 text-ash-200 mx-auto mb-3" />
              <p className="font-body text-sm text-ash-400">
                No bots yet.{' '}
                <Link to="/bots/new" className="text-terracotta-500 hover:text-terracotta-600 font-medium">
                  Create your first bot
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {bots.slice(0, 5).map((bot) => (
                <Link
                  key={bot.id}
                  to={`/bots/${bot.id}`}
                  className="group flex items-center justify-between px-3 py-3 rounded-lg hover:bg-sand-50 transition-all duration-150"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${bot.is_active ? 'bg-emerald-500 shadow-sm shadow-emerald-500/30' : 'bg-ash-300'}`} />
                    <div>
                      <span className="font-body text-sm font-medium text-navy-900 group-hover:text-terracotta-500 transition-colors">{bot.name}</span>
                      <span className="ml-2 font-body text-xs text-ash-400 uppercase">{bot.channel}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-body text-xs text-ash-400">{bot.language}</span>
                    <span className={`badge ${bot.is_active ? 'badge-active' : 'badge-inactive'}`}>
                      {bot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
