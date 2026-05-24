import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME } from '../config/constants';
import {
  LayoutDashboard, CheckSquare, Calendar, Settings, LogOut,
  Moon, Sun, Users, Activity, User
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const avatar = localStorage.getItem("userAvatar");

  const handleLogout = () => { logout(); navigate('/login'); };
  const isAdmin = user?.role === 'admin';

  const userLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'My Tasks', icon: CheckSquare, path: '/tasks' },
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
    <div className={`w-64 h-full border-r ${isAdmin ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-card border-border'} flex flex-col`}>
      <div className="p-6">
        <h1 className={`text-2xl font-bold tracking-tight ${isAdmin ? 'text-white' : 'bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent'}`}>
          {APP_NAME}
          {isAdmin && <span className="text-xs ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-normal">Admin</span>}
        </h1>
      </div>

      <div className="flex-1 px-3 py-2 space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm ${
                  isActive
                    ? (isAdmin ? 'bg-slate-800 text-white shadow-sm' : 'bg-primary/10 text-primary font-semibold')
                    : (isAdmin ? 'hover:bg-slate-900 hover:text-white text-slate-400' : 'hover:bg-muted text-muted-foreground hover:text-foreground')
                }`
              }
            >
              <Icon size={18} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className={`p-4 border-t ${isAdmin ? 'border-slate-800' : 'border-border'}`}>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-full overflow-hidden flex items-center justify-center font-bold text-sm flex-shrink-0 ${isAdmin ? 'bg-slate-800 text-white' : 'bg-primary/20 text-primary'}`}>
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" onError={() => localStorage.removeItem("userAvatar")} />
                : user?.name?.charAt(0).toUpperCase()
              }
            </div>
            <div className="text-sm min-w-0">
              <p className={`font-medium truncate ${isAdmin ? 'text-white' : 'text-foreground'}`}>{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          </div>
          {!isAdmin && (
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors flex-shrink-0">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          )}
        </div>
        <button
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl transition-all ${
            isAdmin ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'text-destructive hover:bg-destructive/10'
          }`}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
