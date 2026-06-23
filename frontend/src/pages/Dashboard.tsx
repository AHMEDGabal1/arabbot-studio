import { useEffect, useState } from 'react';
import { Bot, MessageCircle, Handshake, MessageSquare, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listBots, getAnalyticsOverview } from '../lib/api';
import type { Analytics, Bot as BotType } from '../types';

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
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-2 border-ash-200 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeBots = bots.filter((b) => b.is_active).length;
  const statCards = [
    { label: 'Total Bots', value: bots.length, icon: Bot, accent: 'terracotta' },
    { label: 'Active Bots', value: activeBots, icon: MessageSquare, accent: 'gold' },
    { label: 'Conversations', value: stats?.total_conversations ?? 0, icon: MessageCircle, accent: 'navy' },
    { label: 'Handoffs', value: stats?.intent_breakdown?.['HUMAN_REQUEST'] ?? 0, icon: Handshake, accent: 'ash' },
  ];

  const accentStyles: Record<string, { bg: string; iconBg: string; border: string }> = {
    terracotta: { bg: 'bg-terracotta-500/8', iconBg: 'bg-terracotta-500', border: 'border-terracotta-500/20' },
    gold: { bg: 'bg-gold-400/8', iconBg: 'bg-gold-500', border: 'border-gold-400/20' },
    navy: { bg: 'bg-navy-500/8', iconBg: 'bg-navy-500', border: 'border-navy-500/20' },
    ash: { bg: 'bg-ash-200/30', iconBg: 'bg-ash-400', border: 'border-ash-300/30' },
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8 animate-fade-up">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy-900">Dashboard</h1>
          <p className="font-body text-sm text-ash-500 mt-1">Overview of your bot ecosystem</p>
        </div>
        <Link
          to="/bots/new"
          className="btn btn-primary group relative overflow-hidden"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Bot
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, accent }, i) => {
          const styles = accentStyles[accent];
          return (
            <div
              key={label}
              className={`card card-hover p-5 animate-fade-up`}
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className={`absolute -top-6 -right-6 w-16 h-16 ${styles.bg} rounded-full`} />
              <div className="relative flex items-start justify-between">
                <div>
                  <p className="font-body text-xs font-medium text-ash-400 tracking-wider uppercase">{label}</p>
                  <p className="font-display text-3xl font-semibold text-navy-900 mt-1.5">{value}</p>
                </div>
                <div className={`w-10 h-10 ${styles.iconBg} rounded-lg flex items-center justify-center shadow-sm`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card animate-fade-up stagger-5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-terracotta-500/5 rounded-bl-full pointer-events-none" />
        <div className="relative px-6 py-5 border-b border-sand-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-navy-900">Recent Bots</h2>
              <p className="font-body text-xs text-ash-400 mt-0.5">Your most recently created bots</p>
            </div>
            <Link
              to="/bots"
              className="font-body text-sm font-medium text-terracotta-500 hover:text-terracotta-600 transition-colors"
            >
              View all
            </Link>
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
                      <span className="font-body text-sm font-medium text-navy-900 group-hover:text-terracotta-500 transition-colors">
                        {bot.name}
                      </span>
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
