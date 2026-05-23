import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Trash2, CheckCircle, Circle, UserPlus, Edit2, Calendar, Flag, Tag } from "lucide-react";
import TaskModal from "../components/TaskModal";
import CollaboratorModal from "../components/CollaboratorModal";

const SimpleTaskDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

  const fetchTask = async () => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTask(data);
    } catch (error) {
      toast.error("Failed to load task");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!task) return null;

  const isOwner = task.owner?._id === user._id || task.user?._id === user._id;
  const priorityColors = { High: "text-red-500 bg-red-500/10", Medium: "text-amber-500 bg-amber-500/10", Low: "text-emerald-500 bg-emerald-500/10" };

  const handleDelete = async () => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success("Task deleted");
      navigate("/tasks");
    } catch { toast.error("Failed to delete"); }
  };

  const handleToggleStatus = async () => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      const { data } = await api.put(`/tasks/${task._id}`, { status: newStatus });
      setTask(data);
      toast.success(newStatus === "completed" ? "Task completed! 🎉" : "Task reopened");
    } catch { toast.error("Failed to update"); }
  };

  return (
    <div className="space-y-4 pb-4 max-w-2xl mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/tasks")} className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground text-sm transition-colors">
          <ArrowLeft size={18} /> Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setIsCollabModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-muted transition-colors text-xs md:text-sm">
            <UserPlus size={15} />
            <span className="hidden sm:inline">Team</span>
            {task.collaborators?.length > 0 && <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{task.collaborators.length}</span>}
          </button>
          <button onClick={() => setIsEditModalOpen(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors text-xs md:text-sm">
            <Edit2 size={15} /> Edit
          </button>
          {isOwner && (
            <button onClick={handleDelete} className="p-1.5 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl transition-colors">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Task card */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] px-2 py-1 bg-slate-500/10 text-slate-500 rounded-full uppercase tracking-wider font-semibold">Task</span>
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${task.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>{task.status}</span>
          {task.priority && <span className={`text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1 ${priorityColors[task.priority]}`}><Flag size={10} />{task.priority}</span>}
          {task.category && <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><Tag size={10} />{task.category}</span>}
          {task.dueDate && <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><Calendar size={10} />{new Date(task.dueDate).toLocaleDateString()}</span>}
        </div>

        {/* Title with toggle */}
        <div className="flex items-start gap-3">
          <button onClick={handleToggleStatus} className={`mt-0.5 flex-shrink-0 transition-colors ${task.status === "completed" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
            {task.status === "completed" ? <CheckCircle size={26} /> : <Circle size={26} />}
          </button>
          <div className="flex-1 min-w-0">
            <h1 className={`text-xl md:text-2xl font-bold transition-all ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>{task.title}</h1>
            {task.description && <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{task.description}</p>}
          </div>
        </div>

        {/* Mark complete button - big tap target on mobile */}
        <button
          onClick={handleToggleStatus}
          className={`mt-4 w-full py-3 rounded-xl text-sm font-medium transition-colors ${
            task.status === "completed"
              ? "bg-muted text-muted-foreground hover:bg-muted/80"
              : "bg-primary/10 text-primary hover:bg-primary/20"
          }`}
        >
          {task.status === "completed" ? "Mark as Pending" : "✓ Mark as Complete"}
        </button>

        {/* Team */}
        {(task.collaborators?.length > 0 || task.owner) && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-muted-foreground">Team members</p>
              <button onClick={() => setIsCollabModalOpen(true)} className="text-xs text-primary hover:underline">Manage</button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border-2 border-card" title={task.owner?.name}>
                  {task.owner?.name?.charAt(0).toUpperCase()}
                </div>
                {task.collaborators?.map(c => (
                  <div key={c._id} className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-sm border-2 border-card" title={c.name}>
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Created {new Date(task.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      <TaskModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} taskToEdit={task} onTaskSaved={fetchTask} />
      <CollaboratorModal isOpen={isCollabModalOpen} onClose={() => setIsCollabModalOpen(false)} task={task} onTaskSaved={(updated) => setTask(updated)} />
    </div>
  );
};

export default SimpleTaskDetail;
