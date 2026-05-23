import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Plus, CheckSquare, Sparkles } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import TaskItem from "../components/TaskItem";
import TaskModal from "../components/TaskModal";
import CollaboratorModal from "../components/CollaboratorModal";
import AIChatModal from "../components/AIChatModal";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

const MyTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("order");
  const [collaboratorTask, setCollaboratorTask] = useState(null);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const fetchTasks = async () => {
    try {
      const { data } = await api.get("/tasks");
      setTasks(data);
    } catch (error) {
      toast.error("Failed to load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTasks((items) => {
      const oldIndex = items.findIndex((t) => t._id === active.id);
      const newIndex = items.findIndex((t) => t._id === over.id);
      const newArray = arrayMove(items, oldIndex, newIndex);
      const payload = newArray.map((item, index) => ({ _id: item._id, order: index }));
      api.put("/tasks/reorder", { items: payload }).catch(() => toast.error("Failed to save order"));
      return newArray;
    });
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      setTasks(tasks.map((t) => t._id === task._id ? { ...t, status: newStatus } : t));
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter((t) => t._id !== id));
      toast.success("Task deleted");
    } catch (error) {
      toast.error("Failed to delete task");
    }
  };

  const openEditModal = (task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const handleManage = (task) => {
    if (task.type === "project") {
      navigate(`/project/${task._id}`);
    } else {
      navigate(`/task/${task._id}`);
    }
  };

  const openCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  // When collaborator modal updates task, patch it in list
  const handleCollaboratorUpdate = (updatedTask) => {
    setTasks(tasks.map((t) => t._id === updatedTask._id ? updatedTask : t));
    setCollaboratorTask(updatedTask);
  };

  const categories = ["All", ...new Set(tasks.map((t) => t.category).filter(Boolean))];
  const filteredTasks = tasks
    .filter((task) => task.title.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((task) => selectedPriority === "All" || task.priority === selectedPriority)
    .filter((task) => selectedCategory === "All" || task.category === selectedCategory)
    .sort((a, b) => {
      if (sortOption === "priority") {
        const order = { High: 0, Medium: 1, Low: 2 };
        return order[a.priority] - order[b.priority];
      }
      if (sortOption === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      return a.order - b.order;
    });

  const completedCount = tasks.filter((t) => t.status === "completed").length;

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">My Tasks</h1>
          <p className="text-muted-foreground mt-1">
            {completedCount} of {tasks.length} tasks completed
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAIChatOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl font-medium hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            <Sparkles size={18} />
            <span>AI Create</span>
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20"
          >
            <Plus size={20} />
            <span>New Task</span>
          </button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <input
          type="text"
          placeholder="Search tasks..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
        />
        <select
          value={selectedPriority}
          onChange={(e) => setSelectedPriority(e.target.value)}
          className="w-full p-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="All">All priorities</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full p-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
        >
          {categories.map((category) => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
        <select
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
          className="w-full p-3 rounded-2xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none"
        >
          <option value="order">Custom order</option>
          <option value="dueDate">Due date</option>
          <option value="priority">Priority</option>
        </select>
      </div>

      {/* Stats bar */}
      <div className="flex gap-2 flex-wrap">
        {["pending", "in-progress", "completed"].map(status => {
          const count = tasks.filter(t => t.status === status).length;
          const colors = {
            pending: "bg-amber-500/10 text-amber-600",
            "in-progress": "bg-blue-500/10 text-blue-600",
            completed: "bg-emerald-500/10 text-emerald-600",
          };
          return (
            <span key={status} className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize ${colors[status]}`}>
              {count} {status}
            </span>
          );
        })}
      </div>

      {/* Task List */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 min-h-[400px]">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Your Tasks</h2>
          <span className="text-sm text-muted-foreground">{filteredTasks.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center text-muted-foreground mt-20">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center text-muted-foreground mt-20 flex flex-col items-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <CheckSquare size={40} />
            </div>
            <p className="text-lg">No tasks match your current filters.</p>
            <p className="text-sm opacity-70">Try adjusting your search, or create a new task.</p>
            <button
              onClick={() => setIsAIChatOpen(true)}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl text-sm font-medium"
            >
              <Sparkles size={16} />
              Create with AI
            </button>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredTasks.map((t) => t._id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1">
                {filteredTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onEdit={openEditModal}
                    onManage={handleManage}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
                    onCollaborators={(task) => setCollaboratorTask(task)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      <TaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskToEdit={taskToEdit}
        onTaskSaved={fetchTasks}
      />

      <CollaboratorModal
        isOpen={!!collaboratorTask}
        onClose={() => setCollaboratorTask(null)}
        task={collaboratorTask}
        onTaskSaved={handleCollaboratorUpdate}
      />

      <AIChatModal
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
        onTaskCreated={fetchTasks}
      />
    </div>
  );
};

export default MyTasks;
