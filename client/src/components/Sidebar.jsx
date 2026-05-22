import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { APP_NAME } from '../config/constants';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  Settings, 
  LogOut, 
  Moon, 
  Sun,
  Users,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';

  const userLinks = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
    { name: 'My Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
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
        <h1 className={`text-2xl font-bold tracking-tight ${isAdmin ? 'text-white' : 'bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent'}`}>
          {APP_NAME} {isAdmin && <span className="text-xs ml-2 px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded-full">Admin</span>}
        </h1>
      </div>

      <div className="flex-1 px-4 py-2 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.name}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? (isAdmin ? 'bg-slate-800 text-white shadow-sm' : 'bg-primary/10 text-primary font-medium')
                    : (isAdmin ? 'hover:bg-slate-900 hover:text-white' : 'hover:bg-muted text-muted-foreground hover:text-foreground')
                }`
              }
            >
              <Icon size={20} />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${isAdmin ? 'bg-slate-800 text-white' : 'bg-primary/20 text-primary'}`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-sm">
              <p className={`font-medium ${isAdmin ? 'text-white' : 'text-foreground'}`}>{user?.name}</p>
            </div>
          </div>
          {!isAdmin && (
            <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          )}
        </div>
        <button 
          onClick={handleLogout}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 text-sm rounded-xl transition-all ${
            isAdmin 
              ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' 
              : 'text-destructive hover:bg-destructive/10'
          }`}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
