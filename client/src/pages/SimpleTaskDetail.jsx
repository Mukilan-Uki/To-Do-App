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
      toast.error("Failed to load task details");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  if (loading) return <div className="text-center mt-20 text-muted-foreground">Loading task...</div>;
  if (!task) return null;

  const isOwner = task.owner?._id === user._id || task.user?._id === user._id;

  const priorityColors = {
    High: "text-red-500 bg-red-500/10",
    Medium: "text-amber-500 bg-amber-500/10",
    Low: "text-emerald-500 bg-emerald-500/10",
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success("Task deleted");
      navigate("/tasks");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      const { data } = await api.put(`/tasks/${task._id}`, { status: newStatus });
      setTask(data);
      toast.success(newStatus === "completed" ? "Task completed! 🎉" : "Task reopened");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate("/tasks")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} /> Back to Tasks
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollabModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border hover:bg-muted transition-colors text-sm"
          >
            <UserPlus size={16} />
            <span>Collaborators {task.collaborators?.length > 0 ? `(${task.collaborators.length})` : ""}</span>
          </button>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-xl hover:bg-muted/80 transition-colors text-sm"
          >
            <Edit2 size={16} /> Edit
          </button>
          {isOwner && (
            <button onClick={handleDelete} className="p-2 text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-xl transition-colors">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-8">
        {/* Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs px-2.5 py-1 bg-slate-500/10 text-slate-500 rounded-full uppercase tracking-wider font-semibold">Task</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${task.status === "completed" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
            {task.status}
          </span>
          {task.priority && (
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1 ${priorityColors[task.priority]}`}>
              <Flag size={11} /> {task.priority}
            </span>
          )}
          {task.category && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
              <Tag size={11} /> {task.category}
            </span>
          )}
          {task.dueDate && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1">
              <Calendar size={11} /> {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* Title with toggle */}
        <div className="flex items-start gap-4">
          <button
            onClick={handleToggleStatus}
            className={`mt-1.5 flex-shrink-0 transition-colors ${task.status === "completed" ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
          >
            {task.status === "completed" ? <CheckCircle size={28} /> : <Circle size={28} />}
          </button>
          <div className="flex-1">
            <h1 className={`text-3xl font-bold transition-all ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
              {task.title}
            </h1>
            {task.description && (
              <p className="text-muted-foreground mt-3 leading-relaxed">{task.description}</p>
            )}
          </div>
        </div>

        {/* Collaborators */}
        {(task.collaborators?.length > 0 || task.owner) && (
          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-sm font-medium text-muted-foreground mb-3">Team members</p>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                <div
                  className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm border-2 border-card"
                  title={`${task.owner?.name} (Owner)`}
                >
                  {task.owner?.name?.charAt(0).toUpperCase()}
                </div>
                {task.collaborators?.map(c => (
                  <div
                    key={c._id}
                    className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-sm border-2 border-card"
                    title={c.name}
                  >
                    {c.name?.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setIsCollabModalOpen(true)}
                className="text-xs text-primary hover:underline"
              >
                Manage
              </button>
            </div>
          </div>
        )}

        {/* Created info */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Created {new Date(task.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            {task.updatedAt && task.updatedAt !== task.createdAt && ` · Updated ${new Date(task.updatedAt).toLocaleDateString()}`}
          </p>
        </div>
      </div>

      <TaskModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        taskToEdit={task}
        onTaskSaved={fetchTask}
      />

      <CollaboratorModal
        isOpen={isCollabModalOpen}
        onClose={() => setIsCollabModalOpen(false)}
        task={task}
        onTaskSaved={(updatedTask) => setTask(updatedTask)}
      />
    </div>
  );
};

export default SimpleTaskDetail;
