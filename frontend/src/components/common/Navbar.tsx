import { Search, Bell, LogOut, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useState } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  return (
    <header className="h-16 bg-surface-900/50 backdrop-blur-xl border-b border-surface-700/50 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left: Page context */}
      <div className="flex items-center gap-4">
        <h2 className="text-lg font-semibold text-surface-100">
          Finacle Core Applications and Environments
        </h2>
      </div>

      {/* Right: Search + Profile */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <motion.div
          className="relative"
          animate={{ width: showSearch ? 280 : 40 }}
          transition={{ duration: 0.2 }}
        >
          {showSearch ? (
            <motion.input
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              autoFocus
              type="text"
              placeholder="Search environments, servers..."
              className="input-field text-sm pr-8"
              onBlur={() => setShowSearch(false)}
              onKeyDown={(e) => e.key === 'Escape' && setShowSearch(false)}
            />
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
            >
              <Search size={18} />
            </button>
          )}
        </motion.div>

        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors relative">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full animate-pulse-subtle" />
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-lg hover:bg-surface-800 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <User size={14} className="text-white" />
            </div>
            <span className="text-sm font-medium text-surface-300">
              {user?.displayName || user?.username}
            </span>
          </button>

          {/* Dropdown */}
          {showProfile && (
            <motion.div
              initial={{ opacity: 0, y: -5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="absolute right-0 top-12 w-48 glass-card p-2 z-50"
            >
              <div className="px-3 py-2 border-b border-surface-700/50 mb-1">
                <p className="text-sm font-medium text-surface-200">{user?.displayName}</p>
                <p className="text-xs text-surface-500">{user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} />
                Logout
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </header>
  );
}
