import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckSquare, Clock, Users, Activity, ChevronRight, TrendingUp, Folder, Zap } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import TaskProgressIndicator, { getTaskProgress } from '../components/TaskProgressIndicator';

// The big progress card matching the reference image's navy blue card
const ProgressCard = ({ completedCount, total }) => {
  const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="card-primary rounded-3xl p-6 md:p-8 shadow-xl shadow-blue-900/20 col-span-1 row-span-1 relative overflow-hidden cursor-pointer"
      style={{ minHeight: 200 }}
    >
      {/* Decorative corner circles */}
      <div className="absolute top-3 right-3 flex gap-1.5">
        <div className="w-3 h-3 rounded-full bg-emerald-400" />
        <div className="w-3 h-3 rounded-full bg-red-400" />
        <div className="w-3 h-3 rounded-full bg-amber-400" />
      </div>

      {/* Vertical progress bar */}
      <div className="flex items-end gap-6 h-full">
        <div className="relative h-28 w-4 bg-white/20 rounded-full overflow-hidden flex-shrink-0">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="absolute bottom-0 left-0 right-0 bg-white rounded-full"
          />
        </div>
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-6xl md:text-7xl font-black text-white leading-none"
          >
            {pct}%
          </motion.p>
          <p className="text-white/90 font-bold text-lg mt-1">All tasks</p>
          <p className="text-white/60 text-sm mt-0.5">{total} items</p>
        </div>
      </div>
    </motion.div>
  );
};

// A task group card like "Personal", "My work", "Project X"
const GroupCard = ({ label, count, color, navigate, path, avatarInitials, delay = 0 }) => {
  const colorMap = {
    amber:  { dot: 'bg-amber-400',  bg: 'bg-amber-500/10', text: 'text-amber-600' },
    purple: { dot: 'bg-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-600' },
    pink:   { dot: 'bg-pink-500',   bg: 'bg-pink-500/10',   text: 'text-pink-600' },
    blue:   { dot: 'bg-blue-500',   bg: 'bg-blue-500/10',   text: 'text-blue-600' },
    green:  { dot: 'bg-emerald-500',bg: 'bg-emerald-500/10',text: 'text-emerald-600' },
  };
  const c = colorMap[color] || colorMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      whileHover={{ y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.10)' }}
      onClick={() => navigate(path)}
      className="bg-card rounded-3xl p-5 border border-border shadow-sm cursor-pointer transition-all relative overflow-hidden"
    >
      <div className={`absolute top-4 right-4 w-3 h-3 rounded-full ${c.dot}`} />
      <div className="flex items-center gap-2 mb-3 mt-1">
        {avatarInitials?.map((init, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold"
            style={{ marginLeft: i > 0 ? -10 : 0, zIndex: avatarInitials.length - i }}
          >
            {init}
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground mb-1 font-semibold">{label}</p>
      <p className="text-xl font-black text-foreground">{label}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{count} items</p>
    </motion.div>
  );
};

const StatMini = ({ icon: Icon, label, value, color, bg }) => (
  <motion.div
    whileHover={{ y: -3 }}
    className="bg-card rounded-2xl border border-border p-4 shadow-sm"
  >
    <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center ${color} mb-3`}>
      <Icon size={18} />
    </div>
    <p className={`text-3xl font-black ${color}`}>{value}</p>
    <p className="text-xs text-muted-foreground mt-0.5 font-semibold">{label}</p>
  </motion.div>
);

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const avatar = localStorage.getItem('userAvatar');

  useEffect(() => {
    api.get('/tasks')
      .then(({ data }) => setTasks(data))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  const completedCount = tasks.filter(t => t.status === 'completed').length;
  const pendingCount   = tasks.filter(t => t.status === 'pending').length;
  const projectTasks   = tasks.filter(t => t.type === 'project');
  const allCollabs = [...new Set(
    tasks.flatMap(t => (t.collaborators || []).map(c => c._id || c))
  )];

  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  const groupedByCategory = tasks.reduce((acc, t) => {
    const cat = t.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(t);
    return acc;
  }, {});

  const categoryColors = ['amber', 'purple', 'pink', 'blue', 'green'];
  const categoryEntries = Object.entries(groupedByCategory).slice(0, 4);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground font-semibold">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 pb-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-semibold">{greeting},</p>
          <h1 className="text-3xl md:text-4xl font-black">{user?.name} 👋</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right">
            <p className="text-xs text-muted-foreground font-semibold">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <p className="text-sm font-bold">{completedCount}/{tasks.length} completed</p>
          </div>
          <div className="w-12 h-12 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-lg flex-shrink-0 bg-[var(--donow-blue)] text-white shadow-lg">
            {avatar
              ? <img src={avatar} alt="" className="w-full h-full object-cover" onError={() => localStorage.removeItem('userAvatar')} />
              : user?.name?.charAt(0).toUpperCase()
            }
          </div>
        </div>
      </header>

      {/* Main cards grid — mimics the reference layout */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {/* Progress card — spans 1 col on mobile, 1 on desktop */}
        <div className="col-span-2 md:col-span-1">
          <ProgressCard completedCount={completedCount} total={tasks.length} />
        </div>

        {/* Category cards */}
        {categoryEntries.map(([cat, catTasks], i) => (
          <GroupCard
            key={cat}
            label={cat}
            count={catTasks.length}
            color={categoryColors[i % categoryColors.length]}
            navigate={navigate}
            path="/tasks"
            avatarInitials={
              [...new Set(catTasks.flatMap(t => (t.collaborators || []).map(c => c.name?.charAt(0) || '?')))]
                .slice(0, 2)
            }
            delay={0.1 * (i + 1)}
          />
        ))}

        {/* If few categories, fill with stat mini-cards */}
        {categoryEntries.length < 3 && (
          <>
            <StatMini icon={CheckSquare} label="Completed" value={completedCount} color="text-emerald-600" bg="bg-emerald-500/10" />
            <StatMini icon={Clock} label="Pending" value={pendingCount} color="text-amber-600" bg="bg-amber-500/10" />
          </>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatMini icon={CheckSquare} label="Total Tasks"  value={tasks.length}          color="text-blue-600"    bg="bg-blue-500/10" />
        <StatMini icon={TrendingUp}  label="Completed"    value={completedCount}         color="text-emerald-600" bg="bg-emerald-500/10" />
        <StatMini icon={Folder}      label="Projects"     value={projectTasks.length}    color="text-violet-600"  bg="bg-violet-500/10" />
        <StatMini icon={Users}       label="Collaborators" value={allCollabs.length}     color="text-amber-600"   bg="bg-amber-500/10" />
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-3xl border border-border shadow-sm p-5 md:p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-lg flex items-center gap-2">
            <Zap size={20} className="text-amber-500" /> Recent Activity
          </h2>
          <button
            onClick={() => navigate('/tasks')}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 hover:underline"
          >
            View All <ChevronRight size={14} />
          </button>
        </div>

        {recentTasks.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <CheckSquare size={24} className="text-blue-600" />
            </div>
            <p className="font-bold text-muted-foreground">No tasks yet</p>
            <button
              onClick={() => navigate('/tasks')}
              className="mt-4 px-5 py-2.5 rounded-2xl text-sm font-bold text-white shadow-lg"
              style={{ background: 'linear-gradient(135deg, var(--donow-blue) 0%, #2563eb 100%)' }}
            >
              Create your first task
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task, i) => (
              <motion.div
                key={task._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                onClick={() => navigate(task.type === 'project' ? `/project/${task._id}` : `/task/${task._id}`)}
                className="flex items-center gap-3 p-3.5 rounded-2xl border border-border hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-all"
              >
                <TaskProgressIndicator task={task} size="sm" />
                <div className="flex-1 min-w-0">
                  <h4 className={`font-bold text-sm truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                    {task.title}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {task.type === 'project' ? 'Project' : 'Task'} · {task.category} · {task.priority}
                  </p>
                </div>
                <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold flex-shrink-0 ${
                  getTaskProgress(task) >= 100 ? 'bg-emerald-500/10 text-emerald-600' :
                  getTaskProgress(task) >= 40 ? 'bg-amber-500/10 text-amber-600' :
                  'bg-red-500/10 text-red-600'
                }`}>
                  {getTaskProgress(task)}%
                </span>
                <ChevronRight size={14} className="text-muted-foreground flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Nav */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: 'My Tasks', icon: CheckSquare, path: '/tasks', color: 'from-blue-500 to-blue-700' },
          { label: 'Calendar', icon: Activity, path: '/calendar', color: 'from-violet-500 to-violet-700' },
          { label: 'Profile', icon: Users, path: '/profile', color: 'from-amber-500 to-amber-700' },
        ].map(({ label, icon: Icon, path, color }) => (
          <motion.button
            key={label}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(path)}
            className={`flex items-center gap-3 p-5 rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg font-bold`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

export default Dashboard;
