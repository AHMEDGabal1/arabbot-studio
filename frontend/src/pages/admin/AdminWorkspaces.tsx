import { useEffect, useState } from 'react';
import { listAllWorkspaces, updateWorkspacePlan } from '../../lib/admin_api';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { extractErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  plan: string;
  messages_used_this_month: number;
  monthly_message_limit: number;
}

export default function AdminWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [editPlan, setEditPlan] = useState<string>('pro');
  const [editLimit, setEditLimit] = useState<number>(1000);
  const [saving, setSaving] = useState(false);

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

  const handleOpenEditModal = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setEditPlan(workspace.plan || 'pro');
    setEditLimit(workspace.monthly_message_limit || 0);
  };

  const handleCloseModal = () => {
    setSelectedWorkspace(null);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace) return;

    if (isNaN(editLimit) || editLimit < 0) {
      toast.error('Please enter a valid monthly message limit');
      return;
    }

    setSaving(true);
    try {
      await updateWorkspacePlan(selectedWorkspace.id, editPlan, editLimit);
      toast.success('Workspace updated successfully');
      handleCloseModal();
      await loadWorkspaces();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setSaving(false);
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
                    onClick={() => handleOpenEditModal(w)}
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

      {/* Edit Workspace Plan & Limit Modal */}
      {selectedWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm">
          <div className="bg-navy-800 border border-navy-700 rounded-xl shadow-2xl w-full max-w-md p-6 space-y-6 animate-scale-in">
            <div className="flex items-center justify-between border-b border-navy-700/60 pb-4">
              <h3 className="font-display text-lg font-bold text-sand-50">
                Edit Workspace Plan & Limit
              </h3>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-ash-400 hover:text-sand-100 p-1 rounded-lg hover:bg-navy-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-ash-400 mb-1.5">
                  Workspace Name
                </label>
                <input
                  type="text"
                  value={selectedWorkspace.name}
                  disabled
                  className="w-full px-3 py-2 bg-navy-900/60 border border-navy-700 rounded-lg text-sm text-ash-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-ash-400 mb-1.5">
                  Plan
                </label>
                <select
                  value={editPlan}
                  onChange={(e) => setEditPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-sm text-sand-100 focus:outline-none focus:border-terracotta-400"
                >
                  <option value="free">Free</option>
                  <option value="starter">Starter</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-ash-400 mb-1.5">
                  Monthly Message Limit
                </label>
                <input
                  type="number"
                  min="0"
                  value={editLimit}
                  onChange={(e) => setEditLimit(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-sm text-sand-100 focus:outline-none focus:border-terracotta-400"
                  placeholder="e.g. 1000"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-navy-700/60">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary text-xs py-2 px-4"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary text-xs py-2 px-4"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
