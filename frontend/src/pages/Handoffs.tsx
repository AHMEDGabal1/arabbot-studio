import { useEffect, useState } from 'react';
import { CheckCircle, Handshake } from 'lucide-react';
import { listHandoffs, resolveHandoff } from '../lib/api';
import type { Handoff } from '../types';

export default function Handoffs() {
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    try { setHandoffs(await listHandoffs()); } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetch(); }, []);

  const resolve = async (id: string) => {
    await resolveHandoff(id);
    await fetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-ash-300 border-t-terracotta-500 rounded-full animate-spin" />
      </div>
    );
  }

  const pending = handoffs.filter((h) => !h.resolved_at);
  const resolved = handoffs.filter((h) => h.resolved_at);

  return (
    <div className="animate-fade-up">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-semibold text-navy-900">Handoffs</h1>
        <p className="font-body text-sm text-ash-500 mt-1">Manage human handoff requests</p>
      </div>

      {handoffs.length === 0 ? (
        <div className="relative bg-bg-card rounded-lg border border-sand-200 p-12 text-center overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-terracotta-500/5 rounded-full" />
          <Handshake className="w-12 h-12 text-ash-200 mx-auto mb-4" />
          <h2 className="font-display text-lg font-semibold text-navy-900 mb-2">No handoffs</h2>
          <p className="font-body text-sm text-ash-400">All conversations are handled by the bot</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="font-body text-xs font-medium text-ash-400 tracking-wider uppercase mb-3">Pending ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map((h) => (
                  <div key={h.id} className="bg-bg-card rounded-lg border border-sand-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-body text-sm font-medium text-navy-900">Conversation {h.conversation_id.slice(0, 8)}...</p>
                      <p className="font-body text-sm text-ash-500 mt-0.5">{h.reason || 'No reason'}</p>
                      <p className="font-body text-xs text-ash-400 mt-1">{new Date(h.created_at).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => resolve(h.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-body text-sm font-medium rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" /> Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <h2 className="font-body text-xs font-medium text-ash-400 tracking-wider uppercase mb-3">Resolved ({resolved.length})</h2>
              <div className="space-y-2">
                {resolved.map((h) => (
                  <div key={h.id} className="bg-bg-card rounded-lg border border-sand-200 p-4 flex items-center justify-between opacity-60">
                    <div>
                      <p className="font-body text-sm font-medium text-navy-900">Conversation {h.conversation_id.slice(0, 8)}...</p>
                      <p className="font-body text-sm text-ash-500 mt-0.5">{h.reason || 'No reason'}</p>
                      <p className="font-body text-xs text-ash-400 mt-1">Resolved {h.resolved_at ? new Date(h.resolved_at).toLocaleString() : ''}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
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
