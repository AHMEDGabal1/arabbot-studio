import { useEffect, useState } from 'react';
import { listAllWorkspaces, updateWorkspacePlan } from '../../lib/admin_api';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { extractErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';

export default function AdminWorkspaces() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    try {
      const data = await listAllWorkspaces();
      setWorkspaces(data);
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateLimit = async (id: string, currentLimit: number) => {
    const limit = prompt('Enter new monthly message limit:', currentLimit.toString());
    if (!limit) return;
    try {
      await updateWorkspacePlan(id, 'pro', parseInt(limit, 10));
      toast.success('Workspace updated successfully');
      loadWorkspaces();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Workspaces"
        desc="Manage platform tenants and their limits."
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy-900/50 border-b border-navy-700/50">
              <th className="px-6 py-4 text-sm font-semibold text-sand-100">Name</th>
              <th className="px-6 py-4 text-sm font-semibold text-sand-100">Plan</th>
              <th className="px-6 py-4 text-sm font-semibold text-sand-100">Usage</th>
              <th className="px-6 py-4 text-sm font-semibold text-sand-100 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700/50">
            {workspaces.map((w) => (
              <tr key={w.id} className="hover:bg-navy-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-sand-50 font-medium">{w.name}</td>
                <td className="px-6 py-4 text-sm text-ash-400">
                  <span className="badge badge-active">{w.plan}</span>
                </td>
                <td className="px-6 py-4 text-sm text-ash-400">
                  {w.messages_used_this_month} / {w.monthly_message_limit}
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleUpdateLimit(w.id, w.monthly_message_limit)}
                    className="btn btn-secondary py-1.5 px-3 text-xs"
                  >
                    Edit Limits
                  </button>
                </td>
              </tr>
            ))}
            {workspaces.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-ash-500">
                  No workspaces found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
