import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Server,
  PlayCircle,
  Activity,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  Settings,
} from 'lucide-react';
import { useSidebar } from '../../contexts/useSidebar';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard', disabled: false },
  { path: '/environments', icon: Server, label: 'Environments', disabled: false },
  { path: '/eod', icon: PlayCircle, label: 'EOD Execution', disabled: true },
  { path: '/monitoring', icon: Activity, label: 'Services', disabled: true },
  { path: '/jobs', icon: ListChecks, label: 'Jobs', disabled: true },
];

export default function Sidebar() {
  const { collapsed, setCollapsed } = useSidebar();
  const location = useLocation();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="fixed left-0 top-0 bottom-0 z-30 bg-surface-900/80 backdrop-blur-xl border-r border-surface-700/50 flex flex-col"
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-surface-700/50">
        <motion.div
          className="flex items-center gap-3 overflow-hidden"
          animate={{ opacity: 1 }}
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">F</span>
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="font-semibold text-surface-100 whitespace-nowrap"
            >
              FinOps Portal
            </motion.span>
          )}
        </motion.div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path));

          return (
            <NavLink
              key={item.path}
              to={item.disabled ? '#' : item.path}
              onClick={(e) => item.disabled && e.preventDefault()}
              className={`
                nav-item relative group
                ${isActive ? 'nav-item-active' : ''}
                ${item.disabled ? 'opacity-40 cursor-not-allowed' : ''}
              `}
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <item.icon size={20} className="flex-shrink-0" />

              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap"
                >
                  {item.label}
                </motion.span>
              )}

              {/* Coming soon tooltip for disabled items */}
              {item.disabled && !collapsed && (
                <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-surface-700 text-surface-500">
                  Soon
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Settings Link */}
      <div className="px-2 pb-2 border-t border-surface-800 pt-2">
        <NavLink
          to="/settings"
          className={({ isActive }) => `
            nav-item relative group
            ${isActive ? 'nav-item-active' : ''}
          `}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-400 rounded-r-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
              <Settings size={20} className="flex-shrink-0" />
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="whitespace-nowrap"
                >
                  Settings
                </motion.span>
              )}
            </>
          )}
        </NavLink>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="m-2 p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.aside>
  );
}
