import { Bot, ChartBar, MessageCircle, Settings as SettingsIcon, Handshake, LogOut, LayoutDashboard, Users } from 'lucide-react';
import { NavLink, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';
import Logo from './Logo';

const links = [
  { to: '/dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/bots', label: 'Bots Studio', labelAr: 'إدارة البوتات', icon: Bot },
  { to: '/conversations', label: 'Conversations', labelAr: 'المحادثات الحية', icon: MessageCircle },
  { to: '/customers', label: 'Customers CDP', labelAr: 'سجل العملاء', icon: Users },
  { to: '/handoffs', label: 'Handoffs Queue', labelAr: 'التحويل للبشر', icon: Handshake },
  { to: '/analytics', label: 'Analytics', labelAr: 'التحليلات والأداء', icon: ChartBar },
  { to: '/settings', label: 'Settings', labelAr: 'الإعدادات والربط', icon: SettingsIcon },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-[--sidebar-width] card-glass flex flex-col bg-[#070a12] border-r border-slate-800/80">
      {/* Brand Header */}
      <div className="relative px-5 h-20 flex items-center justify-between border-b border-slate-800/60">
        <Link to="/" className="hover:opacity-90 transition-opacity">
          <Logo size="sm" />
        </Link>
      </div>

      {/* System Status Pill */}
      <div className="px-5 py-3 border-b border-slate-800/40">
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px]">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Operational</span>
          </div>
          <span className="font-mono text-slate-400 text-[10px]">240ms</span>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3.5 py-4 space-y-1.5 overflow-y-auto" aria-label="Main navigation">
        {links.map(({ to, label, labelAr, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => cn(
              "group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm transition-all duration-200",
              isActive ? "text-white font-semibold" : "text-slate-400 hover:text-sand-100 hover:bg-slate-900/60"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-item"
                    className="absolute inset-0 bg-terracotta-500/15 rounded-xl border border-terracotta-500/30 shadow-[0_0_15px_rgba(217,107,39,0.15)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    <motion.div
                      layoutId="active-sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 bg-terracotta-500 rounded-r-full shadow-[0_0_8px_rgba(217,107,39,0.6)]"
                    />
                  </motion.div>
                )}
                <Icon className={cn(
                  "relative z-10 w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110",
                  isActive ? 'text-terracotta-400' : 'text-slate-400'
                )} />
                <div className="relative z-10 flex-1 flex items-center justify-between">
                  <span className="block font-medium tracking-wide text-xs">{label}</span>
                  <span className="block font-arabic text-[10px] text-slate-500 tracking-wide group-hover:text-slate-400 transition-colors" dir="rtl">{labelAr}</span>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Footer */}
      <div className="p-3.5 border-t border-slate-800/80 bg-[#060810]">
        <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-900/80 mb-2 border border-slate-800">
          <div className="w-7 h-7 rounded-lg bg-terracotta-500/20 flex items-center justify-center border border-terracotta-500/30 shrink-0" aria-hidden="true">
            <span className="text-xs font-display font-bold text-terracotta-400">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sand-100 truncate">{user?.email}</p>
            <p className="text-[10px] text-terracotta-400 font-mono">Workspace Admin</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center justify-between w-full px-3.5 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 group"
          aria-label="Log out"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Logout</span>
          </div>
          <span className="font-arabic text-[10px] text-slate-500 group-hover:text-red-400/80">خروج</span>
        </button>
      </div>
    </aside>
  );
}
