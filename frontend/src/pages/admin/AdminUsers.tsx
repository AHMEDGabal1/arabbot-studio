import { useEffect, useState } from 'react';
import { listAllUsers } from '../../lib/admin_api';
import PageHeader from '../../components/PageHeader';
import LoadingSpinner from '../../components/LoadingSpinner';
import { extractErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  phone?: string;
  is_superadmin: boolean;
  created_at: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await listAllUsers();
        setUsers(data);
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Users"
        desc="Manage all users on the platform."
      />

      <div className="card p-0 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy-900/50 border-b border-navy-700/50">
              <th className="px-6 py-4 text-sm font-semibold text-sand-100">Email</th>
              <th className="px-6 py-4 text-sm font-semibold text-sand-100">Phone</th>
              <th className="px-6 py-4 text-sm font-semibold text-sand-100">Role</th>
              <th className="px-6 py-4 text-sm font-semibold text-sand-100">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700/50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-navy-800/30 transition-colors">
                <td className="px-6 py-4 text-sm text-sand-50 font-medium">{u.email}</td>
                <td className="px-6 py-4 text-sm text-ash-400">{u.phone || 'N/A'}</td>
                <td className="px-6 py-4 text-sm">
                  {u.is_superadmin ? (
                    <span className="badge bg-gold-500/20 text-gold-400 border border-gold-500/30">Superadmin</span>
                  ) : (
                    <span className="badge badge-inactive">User</span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-ash-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-ash-500">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
