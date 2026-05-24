import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { LayoutDashboard, CheckSquare, Calendar, User, Sun, Moon } from 'lucide-react';

const BottomNav = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'admin';

  const userLinks = [
    { name: 'Home', icon: LayoutDashboard, path: '/' },
    { name: 'Tasks', icon: CheckSquare, path: '/tasks' },
    { name: 'Calendar', icon: Calendar, path: '/calendar' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  const links = isAdmin ? [] : userLinks;

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 border-t ${isAdmin ? 'bg-slate-950 border-slate-800' : 'bg-card/95 border-border backdrop-blur-md'} flex items-center justify-around px-2 py-1.5 safe-area-pb`}>
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.name}
            to={link.path}
            end={link.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all min-w-0 ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-xl transition-all ${isActive ? 'bg-primary/10' : ''}`}>
                  <Icon size={20} />
                </div>
                <span className="text-[9px] font-medium">{link.name}</span>
              </>
            )}
          </NavLink>
        );
      })}

      {!isAdmin && (
        <button
          onClick={toggleTheme}
          className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-muted-foreground hover:text-foreground transition-all"
        >
          <div className="p-1.5 rounded-xl">
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </div>
          <span className="text-[9px] font-medium">Theme</span>
        </button>
      )}
    </div>
  );
};

export default BottomNav;
