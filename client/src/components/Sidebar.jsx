import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { APP_NAME } from '../config/constants';
import {
  LayoutDashboard, CheckSquare, Calendar, Settings, LogOut,
  Moon, Sun, Users, Activity, User, Bell, X, Inbox, Repeat
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import NotificationPanel from './NotificationPanel';

const SidebarContent = ({ onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { pendingCount } = useNotifications();
  const navigate = useNavigate();
  const avatar = localStorage.getItem('userAvatar');
  const [showNotifs, setShowNotifs] = useState(false);
  const notifBtnRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const handleLogout = () => { logout(); navigate('/login'); onClose?.(); };
  const isAdmin = user?.role === 'admin';

  const userLinks = [
    { name: 'Inbox', icon: Inbox, path: '/' },
    { name: 'My Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'Daily Routine', icon: Repeat, path: '/routine' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];
  const adminLinks = [
    { name: 'Overview', icon: Activity, path: '/admin' },
    { name: 'Users', icon: Users, path: '/admin/users' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];
  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div className={`w-64 h-full flex flex-col relative ${isAdmin ? 'bg-slate-950 text-slate-300' : 'bg-card'}`}>
      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[var(--donow-blue)] flex items-center justify-center">
            <span className="text-white font-black text-sm">D</span>
          </div>
          <div className="flex items-baseline gap-0.5">
            <span className={`text-2xl font-black tracking-tight ${isAdmin ? 'text-white' : 'text-[var(--donow-blue)] dark:text-blue-400'}`}>
              Do
            </span>
            <motion.span
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className={`text-2xl font-black tracking-tight ${isAdmin ? 'text-emerald-400' : 'text-blue-500 dark:text-blue-300'}`}
            >
              Now!
            </motion.span>
          </div>
          {isAdmin && (
            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full">Admin</span>
          )}
        </div>
      </div>

      {/* Profile section */}
      <div className={`mx-3 mb-4 p-3 rounded-2xl ${isAdmin ? 'bg-slate-900' : 'bg-muted/60'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0 ${isAdmin ? 'bg-slate-800 text-white' : 'bg-[var(--donow-blue)] text-white'}`}>
            {avatar
              ? <img src={avatar} alt="" className="w-full h-full object-cover" onError={() => localStorage.removeItem('userAvatar')} />
              : user?.name?.charAt(0).toUpperCase()
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className={`font-bold text-sm truncate ${isAdmin ? 'text-white' : 'text-foreground'}`}>{user?.name}</p>
            <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
          </div>
          {!isAdmin && (
            <button onClick={toggleTheme} className="p-1.5 rounded-lg hover:bg-background/80 text-muted-foreground transition-colors flex-shrink-0" aria-label="Toggle theme">
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          )}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-semibold ${
                  isActive
                    ? isAdmin
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'bg-[var(--donow-blue)] text-white shadow-md shadow-blue-900/20'
                    : isAdmin
                      ? 'hover:bg-slate-900 hover:text-white text-slate-400'
                      : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Icon size={18} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className={`p-4 border-t ${isAdmin ? 'border-slate-800' : 'border-border'} space-y-2`}>
        {!isAdmin && (
          <div className="relative">
            <button
              ref={notifBtnRef}
              onClick={() => setShowNotifs(!showNotifs)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-muted text-muted-foreground hover:text-foreground transition-all text-sm font-semibold"
              aria-expanded={showNotifs}
              aria-haspopup="dialog"
            >
              <div className="relative">
                <Bell size={18} />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </div>
              <span>Notifications</span>
              {pendingCount > 0 && (
                <span className="ml-auto text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full font-bold">
                  {pendingCount} new
                </span>
              )}
            </button>
            <AnimatePresence>
              {showNotifs && (
                <NotificationPanel
                  anchorRef={notifBtnRef}
                  onClose={() => setShowNotifs(false)}
                  isMobile={isMobile}
                />
              )}
            </AnimatePresence>
          </div>
        )}

        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${
            isAdmin
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
              : 'text-destructive hover:bg-destructive/10'
          }`}
        >
          <LogOut size={18} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export const MobileSidebar = ({ isOpen, onClose }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="mobile-drawer-overlay"
          onClick={onClose}
        />
        <motion.div
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          className="mobile-drawer"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl hover:bg-muted text-muted-foreground z-10"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
          <SidebarContent onClose={onClose} />
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

const Sidebar = () => <SidebarContent />;
export default Sidebar;
