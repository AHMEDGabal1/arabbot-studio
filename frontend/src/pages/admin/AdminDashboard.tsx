import { useEffect, useState } from 'react';
import { Users, Grid, Bot, MessageCircle } from 'lucide-react';
import { getAdminAnalytics } from '../../lib/admin_api';
import PageHeader from '../../components/PageHeader';
import StatCard from '../../components/StatCard';
import LoadingSpinner from '../../components/LoadingSpinner';
import { extractErrorMessage } from '../../lib/utils';
import toast from 'react-hot-toast';

interface AdminStats {
  total_users: number;
  total_workspaces: number;
  active_bots: number;
  total_messages: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getAdminAnalytics();
        setStats(data);
      } catch (err) {
        toast.error(extractErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Platform Overview"
        desc="Global statistics across all tenants."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          label="Total Users"
          value={stats?.total_users || 0}
          icon={Users}
          accent="navy"
        />
        <StatCard
          label="Workspaces"
          value={stats?.total_workspaces || 0}
          icon={Grid}
          accent="gold"
        />
        <StatCard
          label="Active Bots"
          value={stats?.active_bots || 0}
          icon={Bot}
          accent="terracotta"
        />
        <StatCard
          label="Total Messages"
          value={stats?.total_messages || 0}
          icon={MessageCircle}
          accent="ash"
        />
      </div>
    </div>
  );
}
