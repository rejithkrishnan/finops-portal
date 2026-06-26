import { Search, Bell, LogOut, User, Sun, Moon, CalendarClock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import * as calendarService from '../../services/calendarService';
import type { Activity } from '../../types/calendar';

function parseNavDate(iso: string): Date {
  const [y, m, d] = iso.split('T')[0].split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showSearch,       setShowSearch]       = useState(false);
  const [showProfile,      setShowProfile]      = useState(false);
  const [showNotifications,setShowNotifications]= useState(false);
  const [notifications,    setNotifications]    = useState<Activity[]>([]);

  // Fetch today's + tomorrow's activities once on mount
  useEffect(() => {
    if (!isAuthenticated) return;
    const today    = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(23, 59, 59, 999);

    calendarService
      .getActivities(today.getMonth() + 1, today.getFullYear())
      .then(acts => {
        const relevant = acts.filter(a => {
          const start = parseNavDate(a.startDate);
          const end   = parseNavDate(a.endDate);
          return start <= tomorrow && end >= today;
        });
        setNotifications(relevant);
      })
      .catch(() => {/* silent — calendar may not be seeded yet */});
  }, [isAuthenticated]);

  const todayStr     = new Date().toDateString();
  const tomorrowStr  = new Date(Date.now() + 86400000).toDateString();

  const getBadge = (a: Activity) => {
    const start = parseNavDate(a.startDate);
    const end   = parseNavDate(a.endDate);
    const now   = new Date();
    now.setHours(0, 0, 0, 0);
    if (start <= now && end >= now) return { label: 'Today',    cls: 'text-emerald-400' };
    if (start.toDateString() === tomorrowStr) return { label: 'Tomorrow', cls: 'text-amber-400' };
    return { label: '', cls: '' };
  };

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

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(v => !v); setShowProfile(false); }}
            className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors relative"
          >
            <Bell size={18} />
            {notifications.length > 0 ? (
              <span className="absolute top-1 right-1 min-w-[15px] h-3.5 bg-brand-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            ) : (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-surface-700 rounded-full" />
            )}
          </button>

          <AnimatePresence>
            {showNotifications && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 w-80 glass-card p-3 z-50 shadow-xl"
                >
                  <div className="flex items-center gap-2 px-1 mb-2">
                    <CalendarClock size={14} className="text-brand-400" />
                    <p className="text-sm font-semibold text-surface-200">Today &amp; Tomorrow</p>
                  </div>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-surface-500 py-3 text-center">No upcoming activities</p>
                  ) : (
                    <div className="space-y-1 max-h-72 overflow-y-auto">
                      {notifications.map(a => {
                        const b = getBadge(a);
                        return (
                          <div
                            key={a.id}
                            className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-surface-800/40 transition-colors"
                          >
                            <div
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: a.category.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-surface-200 font-medium truncate">{a.title}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-surface-500">
                                  {parseNavDate(a.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                </p>
                                {b.label && (
                                  <span className={`text-[10px] font-semibold ${b.cls}`}>{b.label}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-surface-800 text-surface-400 hover:text-surface-200 transition-colors"
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>

        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotifications(false); }}
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
