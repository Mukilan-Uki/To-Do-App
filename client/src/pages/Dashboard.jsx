import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { CheckSquare, Clock, Users, Activity } from "lucide-react";
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
  
  // Collect all collaborators across tasks to get unique count
  const allCollaborators = tasks.reduce((acc, task) => {
    if (task.collaborators) {
      task.collaborators.forEach(c => {
        if (!acc.includes(c._id || c)) acc.push(c._id || c);
      });
    }
    return acc;
  }, []);

  // Get recent activity (5 most recently created/updated tasks based on createdAt or updatedAt)
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Hello, {user?.name} 👋</h1>
          <p className="text-muted-foreground mt-1">Here is your daily task overview.</p>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-muted-foreground mt-20">Loading dashboard...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-muted-foreground">Total Tasks</h3>
                <p className="text-4xl font-bold mt-2">{tasks.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <CheckSquare size={24} />
              </div>
            </motion.div>
            
            <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-muted-foreground">Completed</h3>
                <p className="text-4xl font-bold mt-2 text-emerald-500">{completedCount}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckSquare size={24} />
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-muted-foreground">Active Projects</h3>
                <p className="text-4xl font-bold mt-2 text-indigo-500">{projectTasks.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <Activity size={24} />
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-card border border-border shadow-sm flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-muted-foreground">Collaborators</h3>
                <p className="text-4xl font-bold mt-2 text-amber-500">{allCollaborators.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Users size={24} />
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Clock size={20} className="text-primary" /> Recent Activity
                </h2>
                <button onClick={() => navigate('/tasks')} className="text-sm text-primary hover:underline">
                  View All
                </button>
              </div>
              <div className="space-y-4">
                {recentTasks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No recent activity.</p>
                ) : (
                  recentTasks.map(task => (
                    <div 
                      key={task._id} 
                      onClick={() => navigate(task.type === 'project' ? `/project/${task._id}` : `/task/${task._id}`)}
                      className="p-4 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className={`font-medium ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>{task.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {task.type === 'project' ? 'Project' : 'Task'} • {task.priority} Priority
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Quick Navigation</h2>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => navigate('/tasks')} 
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/50 transition-colors"
                >
                  <CheckSquare size={32} className="text-primary" />
                  <span className="font-medium">My Tasks</span>
                </button>
                <button 
                  onClick={() => navigate('/calendar')} 
                  className="flex flex-col items-center justify-center gap-3 p-6 rounded-xl border border-border hover:bg-primary/5 hover:border-primary/50 transition-colors"
                >
                  <Activity size={32} className="text-primary" />
                  <span className="font-medium">Calendar</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
