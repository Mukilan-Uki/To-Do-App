import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { ArrowLeft, Trash2, Plus, CheckCircle, Circle, X, Edit2, UserPlus, Calendar, Flag, Tag } from "lucide-react";
import TaskModal from "../components/TaskModal";
import CollaboratorModal from "../components/CollaboratorModal";

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCollabModalOpen, setIsCollabModalOpen] = useState(false);

  const fetchTask = async () => {
    try {
      const { data } = await api.get(`/tasks/${id}`);
      setTask(data);
    } catch (error) {
      toast.error("Failed to load project");
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
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  const priorityColors = { High: "text-red-500 bg-red-500/10", Medium: "text-amber-500 bg-amber-500/10", Low: "text-emerald-500 bg-emerald-500/10" };

  const handleDelete = async () => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success("Project deleted");
      navigate("/tasks");
    } catch { toast.error("Failed to delete"); }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${task._id}/subtasks`, { title: newSubtaskTitle });
      setTask(data); setNewSubtaskTitle("");
      toast.success("Subtask added");
    } catch { toast.error("Failed to add subtask"); }
  };

  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    try {
      const { data } = await api.put(`/tasks/${task._id}/subtasks/${subtaskId}`, { completed: !currentStatus });
      setTask(data);
    } catch { toast.error("Failed to update subtask"); }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    try {
      const { data } = await api.delete(`/tasks/${task._id}/subtasks/${subtaskId}`);
      setTask(data);
    } catch { toast.error("Failed to delete subtask"); }
  };

  return (
    <div className="space-y-4 pb-4 max-w-3xl mx-auto">
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

      {/* Project header card */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[10px] px-2 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider font-semibold">Project</span>
          <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{task.status}</span>
          {task.priority && <span className={`text-[10px] px-2 py-1 rounded-full font-medium flex items-center gap-1 ${priorityColors[task.priority]}`}><Flag size={10} />{task.priority}</span>}
          {task.category && <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><Tag size={10} />{task.category}</span>}
          {task.dueDate && <span className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground flex items-center gap-1"><Calendar size={10} />{new Date(task.dueDate).toLocaleDateString()}</span>}
        </div>

        <h1 className="text-xl md:text-2xl font-bold">{task.title}</h1>
        {task.description && <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{task.description}</p>}

        {/* Team avatars */}
        {(task.collaborators?.length > 0 || task.owner) && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border-2 border-card" title={task.owner?.name}>
                {task.owner?.name?.charAt(0).toUpperCase()}
              </div>
              {task.collaborators?.slice(0, 3).map(c => (
                <div key={c._id} className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs border-2 border-card" title={c.name}>
                  {c.name?.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.collaborators?.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium border-2 border-card">+{task.collaborators.length - 3}</div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{1 + (task.collaborators?.length ?? 0)} members</span>
          </div>
        )}

        {/* Progress */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-sm font-medium">Progress</p>
            <p className="text-sm font-bold text-primary">{task.progress || 0}%</p>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${task.progress || 0}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1">{completedSubtasks} of {totalSubtasks} subtasks done</p>
        </div>
      </div>

      {/* Subtasks */}
      <div className="bg-card border border-border rounded-2xl p-4 md:p-6">
        <h3 className="font-semibold mb-4">Subtasks</h3>
        <form onSubmit={handleAddSubtask} className="flex gap-2 mb-4">
          <input
            type="text"
            placeholder="Add a subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            className="flex-1 p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
          />
          <button type="submit" className="flex items-center gap-1.5 px-3 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors text-sm">
            <Plus size={16} /> Add
          </button>
        </form>

        <div className="space-y-2">
          {totalSubtasks === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8 italic">No subtasks yet.</p>
          ) : (
            task.subtasks.map(subtask => (
              <div key={subtask._id} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${subtask.completed ? 'bg-muted/30 border-transparent' : 'bg-background border-border'}`}>
                <button onClick={() => handleToggleSubtask(subtask._id, subtask.completed)} className={subtask.completed ? "text-primary flex-shrink-0" : "text-muted-foreground hover:text-primary flex-shrink-0"}>
                  {subtask.completed ? <CheckCircle size={20} /> : <Circle size={20} />}
                </button>
                <span className={`flex-1 text-sm ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>{subtask.title}</span>
                <button onClick={() => handleDeleteSubtask(subtask._id)} className="text-muted-foreground hover:text-destructive p-1 flex-shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <TaskModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} taskToEdit={task} onTaskSaved={fetchTask} />
      <CollaboratorModal isOpen={isCollabModalOpen} onClose={() => setIsCollabModalOpen(false)} task={task} onTaskSaved={(updated) => setTask(updated)} />
    </div>
  );
};

export default ProjectDetail;
