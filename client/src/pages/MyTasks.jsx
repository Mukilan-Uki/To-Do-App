import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Plus, CheckSquare, Sparkles, Search, SlidersHorizontal, X } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import TaskItem from "../components/TaskItem";
import TaskModal from "../components/TaskModal";
import CollaboratorModal from "../components/CollaboratorModal";
import AIChatModal from "../components/AIChatModal";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy,
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
  const [showFilters, setShowFilters] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
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

  useEffect(() => { fetchTasks(); }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        setTaskToEdit(null);
        setIsModalOpen(true);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsAIChatOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(tasks.filter((t) => t._id !== id));
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleManage = (task) => {
    navigate(task.type === "project" ? `/project/${task._id}` : `/task/${task._id}`);
  };

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
      return (a.order ?? 0) - (b.order ?? 0);
    });

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const hasActiveFilters = selectedPriority !== "All" || selectedCategory !== "All" || searchTerm;

  return (
    <div className="space-y-4 pb-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">My Tasks</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
            {completedCount} of {tasks.length} completed
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAIChatOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl text-sm font-medium hover:opacity-90 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">AI Create</span>
          </button>
          <button
            onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-2 md:px-5 md:py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-all active:scale-95 shadow-lg shadow-primary/20"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </header>

      {/* Keyboard shortcuts hint */}
      <div className="hidden md:flex gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">⌘N</kbd> New task</span>
        <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">⌘K</kbd> AI create</span>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text" placeholder="Search tasks..."
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-sm font-medium transition-colors ${showFilters || hasActiveFilters ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-background border-border text-muted-foreground'}`}
        >
          <SlidersHorizontal size={15} />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          <select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm">
            <option value="All">All priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm">
            {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
          </select>
          <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}
            className="w-full p-2.5 rounded-xl bg-background border border-border focus:ring-2 focus:ring-primary outline-none text-sm col-span-2 md:col-span-1">
            <option value="order">Custom order</option>
            <option value="dueDate">Due date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      )}

      {/* Status pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { label: "pending", color: "bg-amber-500/10 text-amber-600" },
          { label: "in-progress", color: "bg-blue-500/10 text-blue-600" },
          { label: "completed", color: "bg-emerald-500/10 text-emerald-600" },
        ].map(({ label, color }) => (
          <span key={label} className={`text-xs px-3 py-1.5 rounded-full font-medium capitalize whitespace-nowrap flex-shrink-0 ${color}`}>
            {tasks.filter(t => t.status === label).length} {label}
          </span>
        ))}
      </div>

      {/* Task list */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-6 min-h-[300px]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Your Tasks</h2>
          <span className="text-xs text-muted-foreground">{filteredTasks.length} shown</span>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground">Loading tasks...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center text-muted-foreground py-16 flex flex-col items-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <CheckSquare size={28} />
            </div>
            <p className="font-medium">No tasks found</p>
            <p className="text-sm opacity-70 mt-1">Try adjusting filters or create a new task</p>
            <button
              onClick={() => { setTaskToEdit(null); setIsModalOpen(true); }}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium active:scale-95"
            >
              <Plus size={16} /> Create Task
            </button>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={filteredTasks.map((t) => t._id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-1">
                {filteredTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onEdit={(task) => { setTaskToEdit(task); setIsModalOpen(true); }}
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
        onClose={() => { setIsModalOpen(false); setTaskToEdit(null); }}
        taskToEdit={taskToEdit}
        onTaskSaved={fetchTasks}
        existingTasks={tasks}
      />
      <CollaboratorModal isOpen={!!collaboratorTask} onClose={() => setCollaboratorTask(null)} task={collaboratorTask} onTaskSaved={handleCollaboratorUpdate} />
      <AIChatModal isOpen={isAIChatOpen} onClose={() => setIsAIChatOpen(false)} onTaskCreated={fetchTasks} />
    </div>
  );
};

export default MyTasks;
