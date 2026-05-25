import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, UserPlus, Users, Crown, Check } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const CollaboratorModal = ({ isOpen, onClose, task, onTaskSaved }) => {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !task) return null;

  const isOwner = task.owner?._id === user._id || task.user?._id === user._id;

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post(`/tasks/${task._id}/collaborators`, { invite: inviteEmail });
      onTaskSaved(data);
      setInviteEmail('');
      toast.success(`Invitation sent to ${inviteEmail}!`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (collaboratorId) => {
    if (!window.confirm('Remove this collaborator?')) return;
    try {
      const { data } = await api.delete(`/tasks/${task._id}/collaborators/${collaboratorId}`);
      onTaskSaved(data);
      toast.success('Collaborator removed');
    } catch {
      toast.error('Failed to remove collaborator');
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-card rounded-3xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex justify-between items-center p-5 border-b border-border bg-gradient-to-r from-blue-500/10 to-violet-500/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <Users size={18} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-black">Team Members</h2>
                <p className="text-[11px] text-muted-foreground truncate max-w-[180px]">{task.title}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Invite form */}
            {isOwner && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Invite by email</p>
                <form onSubmit={handleInvite} className="flex gap-2">
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl bg-background border border-border text-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inviteEmail.trim()}
                    className="flex items-center gap-1.5 px-4 rounded-xl text-white text-sm font-bold disabled:opacity-50 transition-all"
                    style={{ background: 'linear-gradient(135deg, var(--donow-blue), #2563eb)' }}
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <UserPlus size={15} />
                    )}
                    Send
                  </button>
                </form>
                <p className="text-[11px] text-muted-foreground mt-1.5">
                  They'll receive a notification to accept or decline.
                </p>
              </div>
            )}

            {/* Members list */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Members</p>

              {/* Owner */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <div className="w-9 h-9 rounded-xl bg-[var(--donow-blue)] text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {task.owner?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{task.owner?.name}</p>
                  <p className="text-xs text-muted-foreground">{task.owner?.email}</p>
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">
                  <Crown size={11} />
                  <span className="text-[10px] font-bold">Owner</span>
                </div>
              </div>

              {/* Collaborators */}
              {task.collaborators?.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <UserPlus size={24} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No collaborators yet</p>
                </div>
              )}

              {task.collaborators?.map(collab => (
                <div key={collab._id} className="flex items-center gap-3 p-3 rounded-2xl bg-background border border-border hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-violet-500/20 text-violet-600 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {collab.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold">{collab.name}</p>
                    <p className="text-xs text-muted-foreground">{collab.email}</p>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-600 mr-1">
                    <Check size={11} />
                    <span className="text-[10px] font-bold">Active</span>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRemove(collab._id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CollaboratorModal;
