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
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Bots</h1>
        <Link
          to="/bots/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Bot
        </Link>
      </div>

      {bots.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Bot className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No bots yet</h2>
          <p className="text-gray-500 mb-6">Create your first WhatsApp bot</p>
          <Link
            to="/bots/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" /> Create Bot
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Channel</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Language</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bots.map((bot) => (
                <tr key={bot.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/bots/${bot.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                      {bot.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 uppercase">{bot.channel}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{bot.language}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      bot.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {bot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => toggle(bot)} className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors" title={bot.is_active ? 'Deactivate' : 'Activate'}>
                      {bot.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => remove(bot.id)} className="p-1.5 text-gray-400 hover:text-red-600 transition-colors" title="Delete">
                      <Trash2 className="w-5 h-5" />
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
