import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { activateBot, deactivateBot, deleteBot, listBots } from '../lib/api';
import type { Bot as BotType } from '../types';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';

export default function BotsList() {
  const [bots, setBots] = useState<BotType[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try { setBots(await listBots()); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const toggle = async (bot: BotType) => {
    if (bot.is_active) await deactivateBot(bot.id);
    else await activateBot(bot.id);
    await fetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this bot?')) return;
    await deleteBot(id);
    await fetch();
  };

  if (loading) return (
    <div className="space-y-8">
      <PageHeader title="Bots" desc="Loading..." />
      <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
    </div>
  );

  return (
    <div className="animate-fade-up">
      <PageHeader
        title="Bots"
        desc="Manage your WhatsApp bots"
        action={
          <Link to="/bots/new" className="btn btn-primary group relative overflow-hidden">
            <span className="relative z-10 flex items-center gap-2"><Plus className="w-4 h-4" /> New Bot</span>
            <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </Link>
        }
      />

      {bots.length === 0 ? (
        <div className="card p-12 text-center animate-scale-in">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-terracotta-500/5 rounded-full pointer-events-none" />
          <Bot className="w-12 h-12 text-ash-200 mx-auto mb-4" />
          <h2 className="font-display text-lg font-semibold text-navy-900 mb-2">No bots yet</h2>
          <p className="font-body text-sm text-ash-400 mb-6">Create your first WhatsApp bot</p>
          <Link to="/bots/new" className="btn btn-primary"><Plus className="w-4 h-4" /> Create Bot</Link>
        </div>
      ) : (
        <div className="card overflow-hidden animate-scale-in">
          <div className="absolute top-0 right-0 w-24 h-24 bg-terracotta-500/5 rounded-bl-full pointer-events-none" />
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand-100 bg-sand-50">
                <th className="text-left px-5 py-3.5 font-body text-xs font-medium text-ash-400 tracking-wider uppercase">Name</th>
                <th className="text-left px-5 py-3.5 font-body text-xs font-medium text-ash-400 tracking-wider uppercase">Channel</th>
                <th className="text-left px-5 py-3.5 font-body text-xs font-medium text-ash-400 tracking-wider uppercase">Language</th>
                <th className="text-left px-5 py-3.5 font-body text-xs font-medium text-ash-400 tracking-wider uppercase">Status</th>
                <th className="text-right px-5 py-3.5 font-body text-xs font-medium text-ash-400 tracking-wider uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bots.map((bot, i) => (
                <tr key={bot.id} className="group border-b border-sand-100 hover:bg-sand-50 transition-all duration-150 animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td className="px-5 py-4">
                    <Link to={`/bots/${bot.id}`} className="font-body text-sm font-medium text-navy-900 group-hover:text-terracotta-500 transition-colors">{bot.name}</Link>
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-ash-500 uppercase">{bot.channel}</td>
                  <td className="px-5 py-4 font-body text-sm text-ash-500">{bot.language}</td>
                  <td className="px-5 py-4">
                    <span className={`badge ${bot.is_active ? 'badge-active' : 'badge-inactive'}`}>{bot.is_active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => toggle(bot)} className="p-1.5 text-ash-400 hover:text-terracotta-500 transition-all duration-150 rounded-lg hover:bg-terracotta-50 active:scale-90" title={bot.is_active ? 'Deactivate' : 'Activate'} aria-label={bot.is_active ? 'Deactivate bot' : 'Activate bot'}>
                      {bot.is_active ? <ToggleRight className="w-4.5 h-4.5" /> : <ToggleLeft className="w-4.5 h-4.5" />}
                    </button>
                    <button onClick={() => remove(bot.id)} className="p-1.5 text-ash-400 hover:text-red-500 transition-all duration-150 rounded-lg hover:bg-red-50 ml-1 active:scale-90" title="Delete" aria-label="Delete bot">
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
