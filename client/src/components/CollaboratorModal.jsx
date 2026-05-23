import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, UserPlus, Users } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const CollaboratorModal = ({ isOpen, onClose, task, onTaskSaved }) => {
  const { user } = useAuth();
  const [inviteEmail, setInviteEmail] = useState("");
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
      setInviteEmail("");
      toast.success("Collaborator added!");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to invite collaborator");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (collaboratorId) => {
    if (!window.confirm("Remove this collaborator?")) return;
    try {
      const { data } = await api.delete(`/tasks/${task._id}/collaborators/${collaboratorId}`);
      onTaskSaved(data);
      toast.success("Collaborator removed");
    } catch (error) {
      toast.error("Failed to remove collaborator");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-sm bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
        >
          <div className="flex justify-between items-center p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Users size={20} className="text-primary" />
              <h2 className="text-lg font-semibold">Collaborators</h2>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{task.title}</span>
            </p>

            {/* Invite form */}
            {isOwner && (
              <form onSubmit={handleInvite} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Email or username..."
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 p-2.5 rounded-lg bg-background border border-border text-sm focus:ring-2 focus:ring-primary outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1 px-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 text-sm disabled:opacity-50"
                >
                  <UserPlus size={16} />
                  Add
                </button>
              </form>
            )}

            {/* Owner */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Members</p>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                  {task.owner?.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{task.owner?.name}</p>
                  <p className="text-xs text-muted-foreground">Owner</p>
                </div>
              </div>

              {task.collaborators?.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3 italic">No collaborators yet.</p>
              )}

              {task.collaborators?.map(collab => (
                <div key={collab._id} className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border">
                  <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-sm">
                    {collab.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{collab.name}</p>
                    <p className="text-xs text-muted-foreground">Collaborator</p>
                  </div>
                  {isOwner && (
                    <button
                      onClick={() => handleRemove(collab._id)}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-lg transition-colors"
                    >
                      <X size={16} />
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
