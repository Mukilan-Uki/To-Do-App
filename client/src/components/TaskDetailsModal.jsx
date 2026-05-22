import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Users,
  CheckCircle,
  Circle,
  Trash2,
  Pencil,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

const TaskDetailsModal = ({ isOpen, onClose, task, onTaskUpdated }) => {
  const { user } = useAuth();
  const [localTask, setLocalTask] = useState(task);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [inviteTarget, setInviteTarget] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLocalTask(task);
    setSubtaskTitle("");
    setInviteTarget("");
    setEditingSubtaskId(null);
    setEditingSubtaskTitle("");
  }, [task, isOpen]);

  const refreshTask = async () => {
    if (!task?._id) return;
    try {
      const { data } = await api.get(`/tasks/${task._id}`);
      setLocalTask(data);
      if (onTaskUpdated) onTaskUpdated();
    } catch (error) {
      toast.error("Unable to refresh task details");
    }
  };

  const canManageCollaborators =
    localTask?.owner?._id?.toString() === user?._id?.toString();
  const isCollaborator = localTask?.collaborators?.some(
    (collaborator) => collaborator._id?.toString() === user?._id?.toString(),
  );

  const handleAddSubtask = async () => {
    if (!subtaskTitle.trim()) return;
    setLoading(true);
    try {
      await api.post(`/tasks/${task._id}/subtasks`, {
        title: subtaskTitle.trim(),
      });
      setSubtaskTitle("");
      await refreshTask();
      toast.success("Subtask added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add subtask");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSubtask = async (subtask) => {
    try {
      await api.put(`/tasks/${task._id}/subtasks/${subtask._id}`, {
        completed: !subtask.completed,
      });
      await refreshTask();
    } catch (error) {
      toast.error("Could not update subtask");
    }
  };

  const handleEditSubtask = async (subtaskId) => {
    if (!editingSubtaskTitle.trim()) return;
    setLoading(true);
    try {
      await api.put(`/tasks/${task._id}/subtasks/${subtaskId}`, {
        title: editingSubtaskTitle.trim(),
      });
      setEditingSubtaskId(null);
      setEditingSubtaskTitle("");
      await refreshTask();
      toast.success("Subtask updated");
    } catch (error) {
      toast.error("Could not update subtask");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm("Remove this subtask?")) return;
    setLoading(true);
    try {
      await api.delete(`/tasks/${task._id}/subtasks/${subtaskId}`);
      await refreshTask();
      toast.success("Subtask deleted");
    } catch (error) {
      toast.error("Could not delete subtask");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    if (!inviteTarget.trim()) return;
    setLoading(true);
    try {
      await api.post(`/tasks/${task._id}/collaborators`, {
        invite: inviteTarget.trim(),
      });
      setInviteTarget("");
      await refreshTask();
      toast.success("Collaborator invited");
    } catch (error) {
      toast.error(error.response?.data?.message || "Invite failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCollaborator = async (collaboratorId) => {
    if (!window.confirm("Remove this collaborator?")) return;
    setLoading(true);
    try {
      await api.delete(`/tasks/${task._id}/collaborators/${collaboratorId}`);
      await refreshTask();
      toast.success("Collaborator removed");
    } catch (error) {
      toast.error("Could not remove collaborator");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !localTask) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/90 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-3xl overflow-hidden rounded-3xl bg-card border border-border shadow-2xl"
        >
          <div className="flex items-center justify-between gap-4 border-b border-border p-5">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-[0.3em]">
                Task details
              </p>
              <h2 className="text-2xl font-semibold">{localTask.title}</h2>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground hover:bg-muted/50 transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] p-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
            <div className="space-y-6">
              <section className="rounded-3xl border border-border bg-background/80 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Task type</p>
                    <p className="text-lg font-semibold capitalize">
                      {localTask.type}
                    </p>
                  </div>
                  {localTask.type === "project" && (
                    <div className="text-right">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        Progress
                      </p>
                      <p className="text-xl font-semibold">
                        {localTask.progress ?? 0}%
                      </p>
                    </div>
                  )}
                </div>

                {localTask.type === "project" && (
                  <div className="mt-4">
                    <div className="h-3 overflow-hidden rounded-full bg-muted/50">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${localTask.progress ?? 0}%` }}
                      />
                    </div>
                  </div>
                )}
              </section>

              <section className="rounded-3xl border border-border bg-background/80 p-5">
                <div className="flex items-center justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Subtasks</p>
                    <h3 className="text-lg font-semibold">Manage progress</h3>
                  </div>
                  {localTask.type === "simple" && (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
                      Simple tasks do not use subtasks
                    </span>
                  )}
                </div>

                {localTask.type === "project" ? (
                  <div className="space-y-4">
                    {localTask.subtasks?.length > 0 ? (
                      localTask.subtasks.map((subtask) => (
                        <div
                          key={subtask._id}
                          className="flex items-center gap-3 rounded-3xl border border-border bg-card p-3"
                        >
                          <button
                            onClick={() => handleToggleSubtask(subtask)}
                            className="rounded-full p-2 text-primary bg-primary/10"
                          >
                            {subtask.completed ? (
                              <CheckCircle size={18} />
                            ) : (
                              <Circle size={18} />
                            )}
                          </button>
                          <div className="flex-1 min-w-0">
                            {editingSubtaskId === subtask._id ? (
                              <input
                                value={editingSubtaskTitle}
                                onChange={(e) =>
                                  setEditingSubtaskTitle(e.target.value)
                                }
                                className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none"
                              />
                            ) : (
                              <p
                                className={
                                  subtask.completed
                                    ? "text-muted-foreground line-through"
                                    : "text-sm"
                                }
                              >
                                {subtask.title}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {editingSubtaskId === subtask._id ? (
                              <button
                                onClick={() => handleEditSubtask(subtask._id)}
                                className="rounded-full bg-primary/10 p-2 text-primary"
                                title="Save"
                              >
                                <CheckCircle size={16} />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingSubtaskId(subtask._id);
                                  setEditingSubtaskTitle(subtask.title);
                                }}
                                className="rounded-full bg-muted/10 p-2 text-muted-foreground"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteSubtask(subtask._id)}
                              className="rounded-full bg-destructive/10 p-2 text-destructive"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No subtasks yet.
                      </p>
                    )}

                    <div className="flex gap-2">
                      <input
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-background px-3 py-2 outline-none"
                        placeholder="New subtask title"
                      />
                      <button
                        onClick={handleAddSubtask}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                      >
                        <Plus size={16} /> Add
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Convert the task to a project to use subtasks and progress
                    tracking.
                  </p>
                )}
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-3xl border border-border bg-background/80 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <Users size={20} className="text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Collaborators
                    </p>
                    <h3 className="text-lg font-semibold">Team access</h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="rounded-3xl border border-border bg-card p-3">
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium">
                      {localTask.owner?.name || localTask.owner?.email}
                    </p>
                  </div>

                  {localTask.collaborators?.length > 0 ? (
                    localTask.collaborators.map((collaborator) => (
                      <div
                        key={collaborator._id}
                        className="flex items-center justify-between rounded-3xl border border-border bg-card p-3"
                      >
                        <div>
                          <p className="font-medium">{collaborator.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {collaborator.email}
                          </p>
                        </div>
                        {canManageCollaborators && (
                          <button
                            onClick={() =>
                              handleRemoveCollaborator(collaborator._id)
                            }
                            className="rounded-full bg-destructive/10 p-2 text-destructive"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No collaborators yet.
                    </p>
                  )}
                </div>

                {canManageCollaborators && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Invite by email or username
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={inviteTarget}
                        onChange={(e) => setInviteTarget(e.target.value)}
                        className="w-full rounded-2xl border border-border bg-background px-3 py-2 outline-none"
                        placeholder="user@example.com or username"
                      />
                      <button
                        onClick={handleInvite}
                        disabled={loading}
                        className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                )}

                {(isCollaborator || canManageCollaborators) && (
                  <div className="rounded-3xl bg-muted/10 p-4 text-sm text-muted-foreground">
                    <p>
                      {canManageCollaborators
                        ? `You are the owner and can manage task collaborators.`
                        : `You and ${localTask.collaborators.length} collaborator${localTask.collaborators.length === 1 ? "" : "s"} are working on this.`}
                    </p>
                  </div>
                )}
              </section>
            </aside>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskDetailsModal;
