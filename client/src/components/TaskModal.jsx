import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, CheckCircle, Circle, Trash2 } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const TaskModal = ({ isOpen, onClose, taskToEdit = null, onTaskSaved, existingTasks = [] }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [category, setCategory] = useState("General");
  const [dueDate, setDueDate] = useState("");
  const [type, setType] = useState("simple");
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setDescription(taskToEdit.description || "");
      setPriority(taskToEdit.priority);
      setCategory(taskToEdit.category);
      setType(taskToEdit.type || "simple");
      setSubtasks(taskToEdit.subtasks || []);
      setDueDate(taskToEdit.dueDate ? new Date(taskToEdit.dueDate).toISOString().split("T")[0] : "");
    } else {
      resetForm();
    }
  }, [taskToEdit, isOpen]);

  const resetForm = () => {
    setTitle(""); setDescription(""); setPriority("Medium");
    setCategory("General"); setType("simple"); setSubtasks([]);
    setSubtaskTitle(""); setDueDate("");
  };

  const handleAddSubtask = () => {
    if (!subtaskTitle.trim()) return;
    setSubtasks(prev => [...prev, { _id: `${Date.now()}`, title: subtaskTitle.trim(), completed: false, order: prev.length }]);
    setSubtaskTitle("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error("Title is required");

    // Duplicate check
    const trimmedTitle = title.trim().toLowerCase();
    const isDuplicate = existingTasks.some(t => {
      if (taskToEdit && t._id === taskToEdit._id) return false;
      return t.title.trim().toLowerCase() === trimmedTitle;
    });
    if (isDuplicate) {
      toast.error("Task with this name already exists.");
      return;
    }

    setLoading(true);
    try {
      const taskData = { title: title.trim(), description, priority, category, type };
      if (dueDate) taskData.dueDate = dueDate;
      if (type === "project") taskData.subtasks = subtasks.map(({ title, completed, order }) => ({ title, completed, order }));

      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit._id}`, taskData);
        toast.success("Task updated!");
      } else {
        await api.post("/tasks", taskData);
        toast.success("Task created!");
      }
      onTaskSaved(); onClose(); resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md bg-card rounded-2xl shadow-xl border border-border overflow-hidden max-h-[85dvh] flex flex-col"
        >
          <div className="flex justify-between items-center p-4 md:p-5 border-b border-border flex-shrink-0">
            <h2 className="text-lg font-semibold">{taskToEdit ? "Edit Task" : "Create New Task"}</h2>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-muted transition-colors"><X size={18} /></button>
          </div>

          <form onSubmit={handleSubmit} className="p-4 md:p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-sm font-medium mb-1.5">Title *</label>
              <input
                type="text" required
                className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none resize-none h-20 text-sm"
                value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Task Type</label>
              <div className="grid grid-cols-2 gap-2">
                {["simple", "project"].map(t => (
                  <button key={t} type="button" onClick={() => setType(t)}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-colors capitalize ${type === t ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-background border border-border text-muted-foreground hover:bg-muted'}`}>
                    {t === "simple" ? "Simple Task" : "Project"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Priority</label>
                <select
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                  value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Category</label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                  value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Work"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Due Date</label>
              <input
                type="date"
                className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
                value={dueDate} onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {type === "project" && (
              <div className="rounded-xl border border-border bg-background/80 p-3">
                <p className="text-sm font-medium mb-3">Subtasks</p>
                <div className="space-y-2 mb-3">
                  {subtasks.map((subtask) => (
                    <div key={subtask._id} className="flex items-center gap-2 rounded-xl border border-border bg-card p-2.5">
                      <button type="button" onClick={() => setSubtasks(prev => prev.map(s => s._id === subtask._id ? { ...s, completed: !s.completed } : s))}
                        className={subtask.completed ? "text-primary flex-shrink-0" : "text-muted-foreground flex-shrink-0"}>
                        {subtask.completed ? <CheckCircle size={16} /> : <Circle size={16} />}
                      </button>
                      <input type="text" value={subtask.title}
                        onChange={(e) => setSubtasks(prev => prev.map(s => s._id === subtask._id ? { ...s, title: e.target.value } : s))}
                        className="flex-1 bg-transparent outline-none text-sm" />
                      <button type="button" onClick={() => setSubtasks(prev => prev.filter(s => s._id !== subtask._id))} className="text-destructive flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={subtaskTitle} onChange={(e) => setSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtask())}
                    className="flex-1 rounded-xl border border-border bg-card px-3 py-2 outline-none text-sm" placeholder="Add a subtask" />
                  <button type="button" onClick={handleAddSubtask}
                    className="flex items-center gap-1 rounded-xl bg-primary px-3 py-2 text-primary-foreground text-sm hover:bg-primary/90">
                    <Plus size={14} /> Add
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-border hover:bg-muted transition-colors text-sm">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium">
                {loading ? "Saving..." : taskToEdit ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskModal;
