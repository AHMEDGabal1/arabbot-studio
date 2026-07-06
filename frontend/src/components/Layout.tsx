import { Navigate, useLocation, useOutlet } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../lib/auth';
import LoadingSpinner from './LoadingSpinner';
import Sidebar from './Sidebar';
import { PageTransition } from './PageTransition';

export default function Layout() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const element = useOutlet();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="min-h-screen noise-overlay">
      <Sidebar />
      <main className="ml-[280px] p-6 lg:p-8 min-h-screen min-w-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <PageTransition key={location.pathname}>
              {element}
            </PageTransition>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
