import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Plus, CheckSquare } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import TaskItem from "../components/TaskItem";
import TaskModal from "../components/TaskModal";
import TaskDetailsModal from "../components/TaskDetailsModal";

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

const Dashboard = ({ showStats = true }) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [taskDetailsOpen, setTaskDetailsOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortOption, setSortOption] = useState("order");

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

      // Prepare reorder payload
      const payload = newArray.map((item, index) => ({
        _id: item._id,
        order: index,
      }));
      api
        .put("/tasks/reorder", { items: payload })
        .catch(() => toast.error("Failed to save order"));

      return newArray;
    });
  };

  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "completed" ? "pending" : "completed";
    try {
      await api.put(`/tasks/${task._id}`, { status: newStatus });
      setTasks(
        tasks.map((t) =>
          t._id === task._id ? { ...t, status: newStatus } : t,
        ),
      );
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

  const openTaskDetails = (task) => {
    setSelectedTask(task);
    setTaskDetailsOpen(true);
  };

  const openCreateModal = () => {
    setTaskToEdit(null);
    setIsModalOpen(true);
  };

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;

  const categories = [
    "All",
    ...new Set(tasks.map((t) => t.category).filter(Boolean)),
  ];
  const filteredTasks = tasks
    .filter((task) =>
      task.title.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .filter(
      (task) =>
        selectedPriority === "All" || task.priority === selectedPriority,
    )
    .filter(
      (task) =>
        selectedCategory === "All" || task.category === selectedCategory,
    )
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

  const pageTitle = showStats ? `Hello, ${user?.name} 👋` : "My Tasks";
  const pageSubtitle = showStats
    ? "Here is your daily task overview."
    : "Manage your tasks, projects and collaborators.";

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{pageTitle}</h1>
          <p className="text-muted-foreground mt-1">{pageSubtitle}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-transform active:scale-95 shadow-lg shadow-primary/20"
        >
          <Plus size={20} />
          <span>New Task</span>
        </button>
      </header>

      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-card border border-border shadow-sm"
          >
            <h3 className="text-lg font-medium text-muted-foreground">
              Total Tasks
            </h3>
            <p className="text-4xl font-bold mt-2">{tasks.length}</p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-card border border-border shadow-sm"
          >
            <h3 className="text-lg font-medium text-muted-foreground">
              Completed
            </h3>
            <p className="text-4xl font-bold mt-2 text-primary">
              {completedCount}
            </p>
          </motion.div>
          <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-card border border-border shadow-sm"
          >
            <h3 className="text-lg font-medium text-muted-foreground">
              Pending
            </h3>
            <p className="text-4xl font-bold mt-2 text-accent">
              {pendingCount}
            </p>
          </motion.div>
        </div>
      )}

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
            <option key={category} value={category}>
              {category}
            </option>
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl bg-card border border-border shadow-sm"
        >
          <h3 className="text-lg font-medium text-muted-foreground">
            Total Tasks
          </h3>
          <p className="text-4xl font-bold mt-2">{tasks.length}</p>
        </motion.div>
        <motion.div
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl bg-card border border-border shadow-sm"
        >
          <h3 className="text-lg font-medium text-muted-foreground">
            Completed
          </h3>
          <p className="text-4xl font-bold mt-2 text-primary">
            {completedCount}
          </p>
        </motion.div>
        <motion.div
          whileHover={{ y: -5 }}
          className="p-6 rounded-2xl bg-card border border-border shadow-sm"
        >
          <h3 className="text-lg font-medium text-muted-foreground">Pending</h3>
          <p className="text-4xl font-bold mt-2 text-accent">{pendingCount}</p>
        </motion.div>
      </div>

      {/* Task List */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-6 min-h-[400px]">
        <h2 className="text-xl font-semibold mb-6">Your Tasks</h2>

        {loading ? (
          <div className="text-center text-muted-foreground mt-20">
            Loading tasks...
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center text-muted-foreground mt-20 flex flex-col items-center">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-4">
              <CheckSquare size={40} />
            </div>
            <p className="text-lg">No tasks match your current filters.</p>
            <p className="text-sm opacity-70">
              Try adjusting your search, filters, or create a new task.
            </p>
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
                    onManage={openTaskDetails}
                    onDelete={handleDelete}
                    onToggleStatus={handleToggleStatus}
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
      <TaskDetailsModal
        isOpen={taskDetailsOpen}
        onClose={() => setTaskDetailsOpen(false)}
        task={selectedTask}
        onTaskUpdated={fetchTasks}
      />
    </div>
  );
};

export default Dashboard;
