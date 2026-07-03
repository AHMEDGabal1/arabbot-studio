import { useEffect, useState } from 'react';
import { CheckCircle, Handshake } from 'lucide-react';
import { listHandoffs, resolveHandoff } from '../lib/api';
import type { Handoff } from '../types';
import PageHeader from '../components/PageHeader';
import Skeleton from '../components/Skeleton';

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

  if (loading) return (
    <div className="space-y-8">
      <PageHeader title="Handoffs" desc="Loading..." />
      <div className="space-y-2">{[1,2,3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
    </div>
  );

  const pending = handoffs.filter((h) => !h.resolved_at);
  const resolved = handoffs.filter((h) => h.resolved_at);

  if (handoffs.length === 0) return (
    <div>
      <PageHeader title="Handoffs" desc="Manage human handoff requests" />
      <div className="card p-12 text-center animate-scale-in">
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-terracotta-500/5 rounded-full pointer-events-none" />
        <Handshake className="w-12 h-12 text-ash-200 mx-auto mb-4" />
        <h2 className="font-display text-lg font-semibold text-navy-900 mb-2">No handoffs</h2>
        <p className="font-body text-sm text-ash-400">All conversations are handled by the bot</p>
      </div>
    </div>
  );

  return (
    <div className="animate-fade-up">
      <PageHeader title="Handoffs" desc="Manage human handoff requests" />

      <div className="space-y-6">
        {pending.length > 0 && (
          <div>
            <h2 className="font-body text-xs font-medium text-ash-400 tracking-wider uppercase mb-3">Pending ({pending.length})</h2>
            <div className="space-y-2">
              {pending.map((h) => (
                <div key={h.id} className="card card-hover p-4 flex items-center justify-between animate-fade-up">
                  <div>
                    <p className="font-body text-sm font-medium text-navy-900">Conversation {h.conversation_id.slice(0, 8)}...</p>
                    <p className="font-body text-sm text-ash-500 mt-0.5">{h.reason || 'No reason'}</p>
                    <p className="font-body text-xs text-ash-400 mt-1">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                  <button onClick={() => resolve(h.id)} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 font-body text-sm font-medium rounded-lg hover:bg-emerald-100 transition-all duration-150 active:scale-90" aria-label="Resolve handoff">
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
                <div key={h.id} className="card p-4 flex items-center justify-between opacity-60">
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
    </div>
  );
}
