import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { CheckSquare, Clock, Users, Activity, ChevronRight } from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    fetchTasks();
  }, []);

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const projectTasks = tasks.filter((t) => t.type === "project");
  const allCollaborators = tasks.reduce((acc, task) => {
    if (task.collaborators) {
      task.collaborators.forEach(c => {
        if (!acc.includes(c._id || c)) acc.push(c._id || c);
      });
    }
    return acc;
  }, []);

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  const stats = [
    { label: "Total Tasks", value: tasks.length, color: "text-primary", bg: "bg-primary/10", icon: CheckSquare },
    { label: "Completed", value: completedCount, color: "text-emerald-500", bg: "bg-emerald-500/10", icon: CheckSquare },
    { label: "Projects", value: projectTasks.length, color: "text-indigo-500", bg: "bg-indigo-500/10", icon: Activity },
    { label: "Team", value: allCollaborators.length, color: "text-amber-500", bg: "bg-amber-500/10", icon: Users },
  ];

  return (
    <div className="space-y-5 pb-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Good day,</p>
          <h1 className="text-2xl md:text-3xl font-bold">{user?.name} 👋</h1>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </header>

      {loading ? (
        <div className="text-center text-muted-foreground mt-20">Loading...</div>
      ) : (
        <>
          {/* Stats grid - 2x2 on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -3 }}
                  className="p-4 md:p-6 rounded-2xl bg-card border border-border shadow-sm"
                >
                  <div className={`w-9 h-9 rounded-full ${stat.bg} flex items-center justify-center ${stat.color} mb-3`}>
                    <Icon size={18} />
                  </div>
                  <p className={`text-2xl md:text-4xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</p>
                </motion.div>
              );
            })}
          </div>

          {/* Progress bar */}
          {tasks.length > 0 && (
            <div className="bg-card rounded-2xl border border-border p-4 md:p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm md:text-base">Overall Progress</p>
                <p className="text-sm font-bold text-primary">
                  {Math.round((completedCount / tasks.length) * 100)}%
                </p>
              </div>
              <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(completedCount / tasks.length) * 100}%` }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="h-full rounded-full bg-primary"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{completedCount} of {tasks.length} tasks completed</p>
            </div>
          )}

          {/* Recent Activity */}
          <div className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2 text-base md:text-lg">
                <Clock size={18} className="text-primary" /> Recent Activity
              </h2>
              <button
                onClick={() => navigate('/tasks')}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
              >
                View All <ChevronRight size={14} />
              </button>
            </div>
            <div className="space-y-2">
              {recentTasks.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">No recent activity.</p>
              ) : (
                recentTasks.map(task => (
                  <div
                    key={task._id}
                    onClick={() => navigate(task.type === 'project' ? `/project/${task._id}` : `/task/${task._id}`)}
                    className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary/40 cursor-pointer transition-colors active:bg-muted"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                        {task.title}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {task.type === 'project' ? 'Project' : 'Task'} · {task.priority}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                        {task.status}
                      </span>
                      <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Nav */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/tasks')}
              className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-colors active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CheckSquare size={20} />
              </div>
              <span className="font-medium text-sm">My Tasks</span>
            </button>
            <button
              onClick={() => navigate('/calendar')}
              className="flex items-center gap-3 p-4 rounded-2xl border border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-colors active:scale-95"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Activity size={20} />
              </div>
              <span className="font-medium text-sm">Calendar</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
