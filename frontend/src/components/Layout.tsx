import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import LoadingSpinner from './LoadingSpinner';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="ml-[--sidebar-width] flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
