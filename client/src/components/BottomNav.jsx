import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, CheckSquare, Calendar, Sun, Moon, LogOut } from 'lucide-react';

const BottomNav = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const userLinks = [
    { name: 'Home', icon: LayoutDashboard, path: '/' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
  ];

  const links = isAdmin ? [] : userLinks;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 border-t ${isAdmin ? 'bg-slate-950 border-slate-800' : 'bg-card border-border'} flex items-center justify-around px-2 py-2 safe-area-pb`}>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                isActive
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[10px] font-medium">{link.name}</span>
          </NavLink>
        );
      })}

      {/* Theme toggle */}
      {!isAdmin && (
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl text-muted-foreground hover:text-foreground transition-all"
        >
          {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
          <span className="text-[10px] font-medium">Theme</span>
        </button>
      )}

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="flex flex-col items-center gap-1 px-4 py-2 rounded-2xl text-destructive/80 hover:text-destructive transition-all"
      >
        <LogOut size={22} />
        <span className="text-[10px] font-medium">Logout</span>
      </button>
    </div>
  );
};

export default BottomNav;
