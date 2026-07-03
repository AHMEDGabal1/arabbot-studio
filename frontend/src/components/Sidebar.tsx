import { Bot, ChartBar, MessageCircle, Settings as SettingsIcon, Handshake, LogOut, LayoutDashboard } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bots', label: 'Bots', icon: Bot },
  { to: '/conversations', label: 'Conversations', icon: MessageCircle },
  { to: '/handoffs', label: 'Handoffs', icon: Handshake },
  { to: '/analytics', label: 'Analytics', icon: ChartBar },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-[--sidebar-width] card-glass flex flex-col">
      <div className="relative px-6 h-20 flex items-center overflow-hidden">
        <div className="absolute -top-6 -right-6 w-24 h-24 border-2 border-terracotta-500/20 rotate-12" />
        <div className="absolute -bottom-4 -left-4 w-16 h-16 border border-gold-400/10 rotate-45" />
        <div className="flex items-center gap-3 relative">
          <div className="w-10 h-10 rounded-lg bg-navy-900/50 flex items-center justify-center overflow-hidden">
            <img src="/logo.svg" alt="ArabBot" className="w-7 h-7 object-contain" />
          </div>
          <div>
            <span className="font-display text-xl font-semibold tracking-tight text-sand-50">ArabBot</span>
            <span className="block font-body text-xs text-ash-400 tracking-widest uppercase mt-0.5">Studio</span>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-navy-500/50 to-transparent mx-4" />

      <nav className="flex-1 px-4 py-5 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }, i) => (
          <NavLink
            key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `group relative flex items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 ${isActive ? 'text-terracotta-300' : 'text-ash-400 hover:text-sand-100'}`
            }
            style={{ animationDelay: `${i * 0.06}s` }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-terracotta-400 rounded-full" />
                    <span className="absolute inset-0 bg-terracotta-500/10 rounded-lg border border-terracotta-500/20" />
                  </>
                )}
                <Icon className={`relative w-4.5 h-4.5 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5 ${isActive ? 'text-terracotta-400' : ''}`} />
                <span className="relative font-medium tracking-wide">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="h-px bg-gradient-to-r from-transparent via-navy-500/50 to-transparent mx-4" />

      <div className="p-4">
        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-navy-900/50 mb-3">
          <div className="w-8 h-8 rounded-full bg-terracotta-500/20 flex items-center justify-center" aria-hidden="true">
            <span className="text-xs font-display font-semibold text-terracotta-400">{user?.email?.charAt(0).toUpperCase() || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sand-100 truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-sm font-medium text-ash-400 hover:text-sand-100 hover:bg-navy-700/50 transition-all duration-200 group" aria-label="Log out">
          <LogOut className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110 group-hover:-translate-x-0.5" />
          <span className="tracking-wide">Logout</span>
        </button>
      </div>
    </aside>
  );
}
