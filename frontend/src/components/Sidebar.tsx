import {
  Bot, ChartBar, MessageCircle, Settings as SettingsIcon, Handshake, LogOut, LayoutDashboard, Wallet,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/bots', label: 'Bots', icon: Bot },
  { to: '/conversations', label: 'Conversations', icon: MessageCircle },
  { to: '/handoffs', label: 'Handoffs', icon: Handshake },
  { to: '/analytics', label: 'Analytics', icon: ChartBar },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside className="fixed top-0 left-0 z-40 h-screen w-[--sidebar-width] bg-white border-r border-gray-200 flex flex-col">
      <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-200">
        <Wallet className="w-7 h-7 text-blue-600" />
        <span className="text-lg font-bold text-gray-900">ArabBot</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
