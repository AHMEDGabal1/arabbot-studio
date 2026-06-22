import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Plus, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react';
import { activateBot, deactivateBot, deleteBot, listBots } from '../lib/api';
import type { Bot as BotType } from '../types';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-ash-300 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-fade-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-semibold text-navy-900">Bots</h1>
          <p className="font-body text-sm text-ash-500 mt-1">Manage your WhatsApp bots</p>
        </div>
        <Link
          to="/bots/new"
          className="group relative inline-flex items-center gap-2 px-5 py-2.5 font-display text-sm font-medium tracking-wide text-white bg-navy-700 rounded-lg overflow-hidden transition-all duration-200 hover:bg-navy-600"
        >
          <span className="relative z-10 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Bot
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-terracotta-500 to-terracotta-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
      </div>

      {bots.length === 0 ? (
        <div className="relative bg-bg-card rounded-lg border border-sand-200 p-12 text-center overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-terracotta-500/5 rounded-full" />
          <Bot className="w-12 h-12 text-ash-200 mx-auto mb-4" />
          <h2 className="font-display text-lg font-semibold text-navy-900 mb-2">No bots yet</h2>
          <p className="font-body text-sm text-ash-400 mb-6">Create your first WhatsApp bot</p>
          <Link
            to="/bots/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-700 text-white font-display text-sm font-medium rounded-lg hover:bg-navy-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create Bot
          </Link>
        </div>
      ) : (
        <div className="relative bg-bg-card rounded-lg border border-sand-200 overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-terracotta-500/5 rounded-bl-full" />
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
                <tr key={bot.id} className="border-b border-sand-100 hover:bg-sand-50 transition-colors animate-fade-up" style={{ animationDelay: `${i * 0.04}s` }}>
                  <td className="px-5 py-4">
                    <Link to={`/bots/${bot.id}`} className="font-body text-sm font-medium text-navy-900 hover:text-terracotta-500 transition-colors">
                      {bot.name}
                    </Link>
                  </td>
                  <td className="px-5 py-4 font-body text-sm text-ash-500 uppercase">{bot.channel}</td>
                  <td className="px-5 py-4 font-body text-sm text-ash-500">{bot.language}</td>
                  <td className="px-5 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${
                      bot.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-ash-100 text-ash-500'
                    }`}>
                      {bot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => toggle(bot)} className="p-1.5 text-ash-400 hover:text-terracotta-500 transition-colors" title={bot.is_active ? 'Deactivate' : 'Activate'}>
                      {bot.is_active ? <ToggleRight className="w-4.5 h-4.5" /> : <ToggleLeft className="w-4.5 h-4.5" />}
                    </button>
                    <button onClick={() => remove(bot.id)} className="p-1.5 text-ash-400 hover:text-red-500 transition-colors ml-1" title="Delete">
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
