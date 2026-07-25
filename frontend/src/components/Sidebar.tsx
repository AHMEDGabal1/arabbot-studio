import { Bot, ChartBar, MessageCircle, Settings as SettingsIcon, Handshake, LogOut, LayoutDashboard, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../lib/auth';
import { cn } from '../lib/utils';

const links = [
  { to: '/dashboard', label: 'Dashboard', labelAr: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/bots', label: 'Bots', labelAr: 'البوتات', icon: Bot },
  { to: '/conversations', label: 'Conversations', labelAr: 'المحادثات', icon: MessageCircle },
  { to: '/customers', label: 'Customers CDP', labelAr: 'سجل العملاء', icon: Users },
  { to: '/handoffs', label: 'Handoffs', labelAr: 'التحويل للبشر', icon: Handshake },
  { to: '/analytics', label: 'Analytics', labelAr: 'التحليلات', icon: ChartBar },
  { to: '/settings', label: 'Settings', labelAr: 'الإعدادات', icon: SettingsIcon },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-[--sidebar-width] card-glass flex flex-col bg-navy-900/95 backdrop-blur-md">
      <div className="relative px-5 h-20 flex items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shadow-sm shadow-terracotta-500/20">
            <img src="/logo.jpg" alt="ArabBot" className="w-full h-full object-cover" />
          </div>
          <div>
            <span className="font-display text-lg font-bold tracking-tight text-sand-50">ArabBot</span>
            <span className="block font-arabic text-[10px] text-terracotta-400 tracking-wide" dir="rtl">منصة البوتات الذكية</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-navy-700/50 mx-5" />

      <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto" aria-label="Main navigation">
        {links.map(({ to, label, labelAr, icon: Icon }) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            className={({ isActive }) => cn(
              "group relative flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-200",
              isActive ? "text-terracotta-300" : "text-ash-400 hover:text-sand-100"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="active-sidebar-item"
                    className="absolute inset-0 bg-terracotta-500/10 rounded-lg border border-terracotta-500/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    <motion.div
                      layoutId="active-sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-terracotta-400 rounded-r-full"
                    />
                  </motion.div>
                )}
                <Icon className={cn(
                  "relative z-10 w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110",
                  isActive ? 'text-terracotta-400' : ''
                )} />
                <div className="relative z-10">
                  <span className="block font-medium tracking-wide">{label}</span>
                  <span className="block font-arabic text-[10px] text-ash-500 tracking-wide leading-tight group-hover:text-ash-400 transition-colors" dir="rtl">{labelAr}</span>
                </div>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="h-px bg-navy-700/50 mx-5" />

      <div className="p-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-navy-800 mb-3 border border-navy-700/50 shadow-inner">
          <div className="w-8 h-8 rounded-full bg-terracotta-500/20 flex items-center justify-center border border-terracotta-500/30" aria-hidden="true">
            <span className="text-xs font-display font-semibold text-terracotta-400">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sand-100 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-ash-400 hover:text-error-400 hover:bg-error-500/10 transition-all duration-200 group border border-transparent hover:border-error-500/20" aria-label="Log out">
          <LogOut className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-1" />
          <div className="flex items-center gap-2 tracking-wide">
            <span>Logout</span>
            <span className="font-arabic text-ash-500 text-xs group-hover:text-error-400/70 transition-colors">تسجيل خروج</span>
          </div>
        </button>
      </div>
    </aside>
  );
}
