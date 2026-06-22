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
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const pending = handoffs.filter((h) => !h.resolved_at);
  const resolved = handoffs.filter((h) => h.resolved_at);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Handoffs</h1>

      {handoffs.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Handshake className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900 mb-2">No handoffs</h2>
          <p className="text-gray-500">All conversations are handled by the bot</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Pending ({pending.length})</h2>
              <div className="space-y-2">
                {pending.map((h) => (
                  <div key={h.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">Conversation {h.conversation_id.slice(0, 8)}...</p>
                      <p className="text-sm text-gray-500">{h.reason || 'No reason'}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(h.created_at).toLocaleString()}</p>
                    </div>
                    <button
                      onClick={() => resolve(h.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100"
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
              <h2 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Resolved ({resolved.length})</h2>
              <div className="space-y-2">
                {resolved.map((h) => (
                  <div key={h.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between opacity-60">
                    <div>
                      <p className="font-medium text-gray-900">Conversation {h.conversation_id.slice(0, 8)}...</p>
                      <p className="text-sm text-gray-500">{h.reason || 'No reason'}</p>
                      <p className="text-xs text-gray-400 mt-1">Resolved {h.resolved_at ? new Date(h.resolved_at).toLocaleString() : ''}</p>
                    </div>
                    <CheckCircle className="w-5 h-5 text-green-500" />
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
