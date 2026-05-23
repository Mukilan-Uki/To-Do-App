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
      toast.error("Failed to load project details");
      navigate("/tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTask(); }, [id]);

  if (loading) return <div className="text-center mt-20 text-muted-foreground">Loading project...</div>;
  if (!task) return null;

  const isOwner = task.owner?._id === user._id || task.user?._id === user._id;
  const completedSubtasks = task.subtasks?.filter(s => s.completed).length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  const priorityColors = {
    High: "text-red-500 bg-red-500/10",
    Medium: "text-amber-500 bg-amber-500/10",
    Low: "text-emerald-500 bg-emerald-500/10",
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this project?")) return;
    try {
      await api.delete(`/tasks/${task._id}`);
      toast.success("Project deleted");
      navigate("/tasks");
    } catch (error) {
      toast.error("Failed to delete project");
    }
  };

  const handleAddSubtask = async (e) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;
    try {
      const { data } = await api.post(`/tasks/${task._id}/subtasks`, { title: newSubtaskTitle });
      setTask(data);
      setNewSubtaskTitle("");
      toast.success("Subtask added");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add subtask");
    }
  };

  const handleToggleSubtask = async (subtaskId, currentStatus) => {
    try {
      const { data } = await api.put(`/tasks/${task._id}/subtasks/${subtaskId}`, { completed: !currentStatus });
      setTask(data);
    } catch (error) {
      toast.error("Failed to update subtask");
    }
  };

  const handleDeleteSubtask = async (subtaskId) => {
    if (!window.confirm("Delete this subtask?")) return;
    try {
      const { data } = await api.delete(`/tasks/${task._id}/subtasks/${subtaskId}`);
      setTask(data);
    } catch (error) {
      toast.error("Failed to delete subtask");
    }
  };

  return (
    <div className="space-y-6 pb-20 max-w-4xl mx-auto">
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

      {/* Project Header */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-6 md:p-8">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full uppercase tracking-wider font-semibold">Project</span>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
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

        <h1 className="text-3xl font-bold">{task.title}</h1>
        {task.description && <p className="text-muted-foreground mt-3 leading-relaxed">{task.description}</p>}

        {/* Collaborators avatars */}
        {(task.collaborators?.length > 0 || task.owner) && (
          <div className="flex items-center gap-2 mt-4">
            <div className="flex -space-x-2">
              <div
                className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-xs border-2 border-card"
                title={`${task.owner?.name} (Owner)`}
              >
                {task.owner?.name?.charAt(0).toUpperCase()}
              </div>
              {task.collaborators?.slice(0, 4).map(c => (
                <div
                  key={c._id}
                  className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold text-xs border-2 border-card"
                  title={c.name}
                >
                  {c.name?.charAt(0).toUpperCase()}
                </div>
              ))}
              {task.collaborators?.length > 4 && (
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-card">
                  +{task.collaborators.length - 4}
                </div>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{1 + (task.collaborators?.length ?? 0)} member{(1 + (task.collaborators?.length ?? 0)) !== 1 ? "s" : ""}</span>
          </div>
        )}

        {/* Progress */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold">Progress</h3>
            <span className="font-bold text-primary text-lg">{task.progress || 0}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${task.progress || 0}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{completedSubtasks} of {totalSubtasks} subtasks completed</p>
        </div>
      </div>

      {/* Subtasks */}
      <div className="bg-card border border-border shadow-sm rounded-2xl p-6">
        <h3 className="font-semibold text-lg mb-4">Subtasks</h3>

        <form onSubmit={handleAddSubtask} className="flex gap-2 mb-6">
          <input
            type="text"
            placeholder="Add a new subtask..."
            value={newSubtaskTitle}
            onChange={(e) => setNewSubtaskTitle(e.target.value)}
            className="flex-1 p-3 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
          />
          <button type="submit" className="flex items-center gap-2 px-4 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors">
            <Plus size={18} /> Add
          </button>
        </form>

        <div className="space-y-2">
          {task.subtasks?.length === 0 ? (
            <p className="text-muted-foreground text-sm italic text-center py-8">No subtasks yet. Add one above to get started!</p>
          ) : (
            task.subtasks.map(subtask => (
              <div
                key={subtask._id}
                className={`flex items-center gap-3 p-3.5 rounded-xl border transition-colors ${subtask.completed ? 'bg-muted/30 border-transparent' : 'bg-background border-border hover:border-primary/30'}`}
              >
                <button
                  onClick={() => handleToggleSubtask(subtask._id, subtask.completed)}
                  className={subtask.completed ? "text-primary" : "text-muted-foreground hover:text-primary"}
                >
                  {subtask.completed ? <CheckCircle size={22} /> : <Circle size={22} />}
                </button>
                <span className={`flex-1 ${subtask.completed ? "line-through text-muted-foreground" : ""}`}>{subtask.title}</span>
                <button
                  onClick={() => handleDeleteSubtask(subtask._id)}
                  className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                >
                  <X size={18} />
                </button>
              </div>
            ))
          )}
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

export default ProjectDetail;
