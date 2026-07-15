import { Navigate, useLocation, useOutlet, NavLink } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldAlert, Users, Grid, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import LoadingSpinner from '../LoadingSpinner';
import { PageTransition } from '../PageTransition';
import { cn } from '../../lib/utils';

const links = [
  { to: '/admin', label: 'Platform Stats', icon: LayoutDashboard },
  { to: '/admin/workspaces', label: 'Workspaces', icon: Grid },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const element = useOutlet();

  if (loading) return <LoadingSpinner fullScreen />;
  if (!user) return <Navigate to="/login" replace />;
  if (!user.is_superadmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen noise-overlay">
      <aside className="fixed top-0 left-0 z-40 h-screen w-[--sidebar-width] flex flex-col bg-navy-950/95 backdrop-blur-md border-r border-gold-500/20">
        <div className="relative px-5 h-20 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden bg-gold-500/20 text-gold-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <span className="font-display text-lg font-bold tracking-tight text-gold-500">ArabBot Admin</span>
              <span className="block font-arabic text-[10px] text-gold-400/70 tracking-wide" dir="rtl">لوحة تحكم النظام</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-gold-500/10 mx-5" />

        <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto" aria-label="Admin navigation">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to} to={to} end={to === '/admin'}
              className={({ isActive }) => cn(
                "group relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200",
                isActive ? "text-gold-400" : "text-ash-400 hover:text-sand-100"
              )}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="active-admin-item"
                      className="absolute inset-0 bg-gold-500/10 rounded-lg border border-gold-500/20"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    >
                      <motion.div
                        layoutId="active-admin-indicator"
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gold-400 rounded-r-full"
                      />
                    </motion.div>
                  )}
                  <Icon className={cn(
                    "relative z-10 w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110",
                    isActive ? 'text-gold-400' : ''
                  )} />
                  <span className="relative z-10 font-medium tracking-wide">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="h-px bg-gold-500/10 mx-5" />

        <div className="p-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-navy-900 mb-3 border border-gold-500/20 shadow-inner">
            <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center border border-gold-500/30">
              <span className="text-xs font-display font-semibold text-gold-400">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sand-100 truncate">{user.email}</p>
            </div>
          </div>
          <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-ash-400 hover:text-error-400 hover:bg-error-500/10 transition-all duration-200 group border border-transparent hover:border-error-500/20">
            <LogOut className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-1" />
            <span>Exit Admin</span>
          </button>
        </div>
      </aside>

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
