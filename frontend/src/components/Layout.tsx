import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import LoadingSpinner from './LoadingSpinner';
import Sidebar from './Sidebar';

export default function Layout() {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen noise-overlay">
      <Sidebar />
      <main className="ml-[280px] p-6 lg:p-8 min-h-screen min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
