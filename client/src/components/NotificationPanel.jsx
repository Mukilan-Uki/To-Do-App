import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Bell, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNotifications } from '../context/NotificationContext';

const PANEL_WIDTH = 320;
const PANEL_MAX_HEIGHT = 420;
const GAP = 8;

function computePosition(anchorRect, panelHeight) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 12;
  const width = Math.min(PANEL_WIDTH, vw - pad * 2);
  const maxH = Math.min(PANEL_MAX_HEIGHT, vh - pad * 2);

  let placement = 'right';
  let top = anchorRect.top;
  let left = anchorRect.right + GAP;

  if (left + width > vw - pad) {
    placement = 'left';
    left = anchorRect.left - width - GAP;
  }
  if (left < pad) {
    placement = 'below';
    left = Math.max(pad, Math.min(anchorRect.left, vw - width - pad));
    top = anchorRect.bottom + GAP;
  }

  const height = Math.min(panelHeight || maxH, maxH);
  if (top + height > vh - pad) {
    top = Math.max(pad, vh - height - pad);
  }
  if (top < pad) top = pad;

  if (placement === 'below' && top + height > vh - pad) {
    top = Math.max(pad, anchorRect.top - height - GAP);
  }

  return { top, left, width, maxHeight: maxH, placement };
}

const NotificationPanel = ({ anchorRef, onClose, isMobile }) => {
  const { invitations, acceptInvitation, rejectInvitation, loading } = useNotifications();
  const panelRef = useRef(null);
  const [style, setStyle] = useState({});

  const handleAccept = async (id, taskTitle) => {
    try {
      await acceptInvitation(id);
      toast.success(`Joined "${taskTitle}"! Refresh to see it.`);
    } catch {
      toast.error('Failed to accept invitation');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectInvitation(id);
      toast.success('Invitation declined');
    } catch {
      toast.error('Failed to decline');
    }
  };

  useLayoutEffect(() => {
    const update = () => {
      if (isMobile) {
        setStyle({});
        return;
      }
      const anchor = anchorRef?.current;
      const panel = panelRef.current;
      if (!anchor) return;
      const rect = anchor.getBoundingClientRect();
      const panelH = panel?.offsetHeight || PANEL_MAX_HEIGHT;
      setStyle(computePosition(rect, panelH));
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [anchorRef, isMobile, invitations.length, loading]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    const onClick = (e) => {
      if (panelRef.current?.contains(e.target)) return;
      if (anchorRef?.current?.contains(e.target)) return;
      onClose();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [onClose, anchorRef]);

  const listContent = (
    <>
      <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bell size={16} className="text-primary" />
          </div>
          <h3 className="font-bold text-sm">Notifications</h3>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
          aria-label="Close notifications"
        >
          <X size={16} />
        </button>
      </div>
      <div
        className="overflow-y-auto overscroll-contain flex-1 min-h-0"
        style={{ maxHeight: isMobile ? '50vh' : style.maxHeight ? style.maxHeight - 56 : 360 }}
      >
        {loading ? (
          <div className="p-8 text-center text-muted-foreground text-sm animate-pulse">Loading...</div>
        ) : invitations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-10 text-center"
          >
            <div className="w-14 h-14 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bell size={22} className="text-muted-foreground" />
            </div>
            <p className="text-sm font-semibold text-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground mt-1">No pending invitations</p>
          </motion.div>
        ) : (
          invitations.map((inv, i) => (
            <motion.div
              key={inv._id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="p-4 border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold text-sm">
                  {inv.invitedBy?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-snug">
                    <span className="text-primary font-bold">{inv.invitedBy?.name}</span>
                    {' '}invited you to collaborate
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    Task: <span className="font-semibold text-foreground">{inv.task?.title || 'Unknown task'}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button
                      onClick={() => handleAccept(inv._id, inv.task?.title)}
                      className="flex items-center gap-1 px-3 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors shadow-sm"
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      onClick={() => handleReject(inv._id)}
                      className="flex items-center gap-1 px-3 py-2 bg-muted text-muted-foreground rounded-xl text-xs font-bold hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X size={12} /> Decline
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </>
  );

  if (isMobile) {
    return createPortal(
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="fixed left-3 right-3 bottom-3 z-[101] bg-card border border-border rounded-3xl shadow-2xl flex flex-col max-h-[min(70vh,520px)] safe-area-pb"
          role="dialog"
          aria-label="Notifications"
        >
          {listContent}
        </motion.div>
      </>,
      document.body
    );
  }

  return createPortal(
    <motion.div
      ref={panelRef}
      initial={{ opacity: 0, scale: 0.96, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -4 }}
      transition={{ type: 'spring', damping: 26, stiffness: 380 }}
      style={{
        position: 'fixed',
        top: style.top ?? 0,
        left: style.left ?? 0,
        width: style.width ?? PANEL_WIDTH,
        maxHeight: style.maxHeight ?? PANEL_MAX_HEIGHT,
        zIndex: 9999,
      }}
      className="bg-card border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      role="dialog"
      aria-label="Notifications"
    >
      {listContent}
    </motion.div>,
    document.body
  );
};

export default NotificationPanel;
