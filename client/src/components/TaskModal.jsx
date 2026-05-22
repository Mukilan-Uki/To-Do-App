import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, CheckCircle, Circle, Trash2 } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const TaskModal = ({ isOpen, onClose, taskToEdit = null, onTaskSaved }) => {
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
      setDueDate(
        taskToEdit.dueDate
          ? new Date(taskToEdit.dueDate).toISOString().split("T")[0]
          : "",
      );
    } else {
      resetForm();
    }
  }, [taskToEdit, isOpen]);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setPriority("Medium");
    setCategory("General");
    setType("simple");
    setSubtasks([]);
    setSubtaskTitle("");
    setDueDate("");
  };

  const handleAddSubtask = () => {
    if (!subtaskTitle.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      {
        _id: `${Date.now()}`,
        title: subtaskTitle.trim(),
        completed: false,
        order: prev.length,
      },
    ]);
    setSubtaskTitle("");
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks((prev) => prev.filter((subtask) => subtask._id !== id));
  };

  const handleSubtaskChange = (id, value) => {
    setSubtasks((prev) =>
      prev.map((subtask) =>
        subtask._id === id ? { ...subtask, title: value } : subtask,
      ),
    );
  };

  const handleToggleSubtaskCompleted = (id) => {
    setSubtasks((prev) =>
      prev.map((subtask) =>
        subtask._id === id
          ? { ...subtask, completed: !subtask.completed }
          : subtask,
      ),
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const taskData = {
        title,
        description,
        priority,
        category,
        type,
      };
      if (dueDate) taskData.dueDate = dueDate;
      if (type === "project")
        taskData.subtasks = subtasks.map(
          ({ _id, title, completed, order }) => ({ title, completed, order }),
        );

      if (taskToEdit) {
        await api.put(`/tasks/${taskToEdit._id}`, taskData);
        toast.success("Task updated successfully");
      } else {
        await api.post("/tasks", taskData);
        toast.success("Task created successfully");
      }
      onTaskSaved();
      onClose();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-md max-h-[calc(100vh-4rem)] bg-card rounded-2xl shadow-xl border border-border overflow-hidden"
        >
          <div className="flex justify-between items-center p-6 border-b border-border">
            <h2 className="text-xl font-semibold">
              {taskToEdit ? "Edit Task" : "Create New Task"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-muted transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 space-y-4 overflow-y-auto max-h-[calc(100vh-12rem)]"
          >
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                required
                className="w-full p-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Description
              </label>
              <textarea
                className="w-full p-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none resize-none h-24"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Task Type
                </label>
                <select
                  className="w-full p-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                >
                  <option value="simple">Simple Task</option>
                  <option value="project">Project Task</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Priority
                </label>
                <select
                  className="w-full p-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Category
                </label>
                <input
                  type="text"
                  className="w-full p-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Work"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Due Date</label>
              <input
                type="date"
                className="w-full p-2.5 rounded-lg bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            {type === "project" && (
              <div className="rounded-3xl border border-border bg-background/80 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium">Subtasks</p>
                  <p className="text-xs text-muted-foreground">
                    Project progress updates automatically
                  </p>
                </div>
                <div className="space-y-3">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask._id}
                      className="flex items-center gap-2 rounded-2xl border border-border bg-card p-3"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleSubtaskCompleted(subtask._id)
                        }
                        className={
                          subtask.completed
                            ? "text-primary"
                            : "text-muted-foreground"
                        }
                      >
                        {subtask.completed ? (
                          <CheckCircle size={18} />
                        ) : (
                          <Circle size={18} />
                        )}
                      </button>
                      <input
                        type="text"
                        value={subtask.title}
                        onChange={(e) =>
                          handleSubtaskChange(subtask._id, e.target.value)
                        }
                        className="flex-1 rounded-2xl border border-border bg-background px-3 py-2 outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSubtask(subtask._id)}
                        className="rounded-full bg-destructive/10 p-2 text-destructive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={subtaskTitle}
                    onChange={(e) => setSubtaskTitle(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-background px-3 py-2 outline-none"
                    placeholder="Add a subtask"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtask}
                    className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-primary-foreground transition hover:bg-primary/90"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Task"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default TaskModal;
