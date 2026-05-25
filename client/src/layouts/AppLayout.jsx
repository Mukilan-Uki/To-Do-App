import React, { useState, useRef } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar, { MobileSidebar } from '../components/Sidebar';
import NotificationPanel from '../components/NotificationPanel';
import { Menu, Bell } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const AppLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const notifBtnRef = useRef(null);
  const { user } = useAuth();
  const { pendingCount } = useNotifications();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-screen bg-background overflow-hidden bg-shapes">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0 relative z-10">
        <Sidebar />
      </div>

      {/* Mobile Sidebar Drawer */}
      <MobileSidebar isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main area */}
      <div className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-card/80 backdrop-blur-md border-b border-border flex-shrink-0">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-xl hover:bg-muted text-foreground relative"
          >
            <Menu size={22} />
            {pendingCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-black text-[var(--donow-blue)] dark:text-blue-400">Do</span>
            <span className="text-lg font-black text-blue-500 dark:text-blue-300">Now!</span>
          </div>
          <div className="flex items-center gap-2">
            {!isAdmin && (
              <button
                ref={notifBtnRef}
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 rounded-xl hover:bg-muted text-foreground"
                aria-label="Notifications"
              >
                <Bell size={20} />
                {pendingCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </button>
            )}
            <div className="w-9 h-9 rounded-xl bg-[var(--donow-blue)] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          </div>
          <AnimatePresence>
            {showNotifs && !isAdmin && (
              <NotificationPanel
                anchorRef={notifBtnRef}
                onClose={() => setShowNotifs(false)}
                isMobile
              />
            )}
          </AnimatePresence>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
