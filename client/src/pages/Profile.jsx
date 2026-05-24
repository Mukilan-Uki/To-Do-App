import React, { useState, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { Camera, User, Mail, Calendar, CheckSquare, Clock, TrendingUp, Edit2, X, Link, Upload } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const Profile = () => {
  const { user, login } = useAuth();
  const fileInputRef = useRef(null);

  const [avatar, setAvatar] = useState(() => localStorage.getItem("userAvatar") || "");
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.name || "");
  const [tasks, setTasks] = useState([]);
  const [loadedStats, setLoadedStats] = useState(false);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get("/tasks");
        setTasks(data);
        setLoadedStats(true);
      } catch {}
    };
    fetchStats();
  }, []);

  const completed = tasks.filter(t => t.status === "completed").length;
  const pending = tasks.filter(t => t.status !== "completed").length;
  const productivity = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0;

  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "Recently joined";

  const handleUrlSubmit = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setAvatar(urlInput.trim());
    localStorage.setItem("userAvatar", urlInput.trim());
    setShowUrlInput(false);
    setUrlInput("");
    toast.success("Profile picture updated!");
  };

  const handleDeviceUpload = () => {
    toast("This feature will be available soon.", {
      icon: "🔒",
      duration: 3000,
    });
  };

  const handleRemoveAvatar = () => {
    setAvatar("");
    localStorage.removeItem("userAvatar");
    toast.success("Avatar removed");
  };

  const stats = [
    { label: "Total Tasks", value: tasks.length, icon: CheckSquare, color: "text-primary", bg: "bg-primary/10" },
    { label: "Completed", value: completed, icon: CheckSquare, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Pending", value: pending, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Productivity", value: `${productivity}%`, icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="space-y-6 pb-8 max-w-2xl mx-auto">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold">Profile</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage your account and preferences</p>
      </header>

      {/* Avatar + Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-sm p-6"
      >
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 shadow-lg">
              {avatar ? (
                <img src={avatar} alt="avatar" className="w-full h-full object-cover" onError={() => { setAvatar(""); localStorage.removeItem("userAvatar"); }} />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/60 to-indigo-500/60 flex items-center justify-center text-white text-4xl font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <button
              onClick={() => setShowUrlInput(!showUrlInput)}
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
            >
              <Camera size={14} />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center sm:text-left">
            {editingName ? (
              <div className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="text-xl font-bold bg-background border border-border rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <button onClick={() => setEditingName(true)} className="text-muted-foreground hover:text-primary transition-colors"><Edit2 size={14} /></button>
              </div>
            )}
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-muted-foreground text-sm mb-1">
              <Mail size={14} />
              <span>{user?.email}</span>
            </div>
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-muted-foreground text-sm">
              <Calendar size={14} />
              <span>Joined {joinedDate}</span>
            </div>
            {user?.role === "admin" && (
              <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full font-medium">Admin</span>
            )}
          </div>
        </div>

        {/* Avatar options */}
        {showUrlInput && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-4 pt-4 border-t border-border">
            <p className="text-sm font-medium mb-3">Update Profile Picture</p>
            <form onSubmit={handleUrlSubmit} className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  placeholder="Paste image URL..."
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-xl border border-border bg-background outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">Apply</button>
            </form>
            <div className="flex gap-2">
              <button
                onClick={handleDeviceUpload}
                className="flex items-center gap-1.5 px-4 py-2 text-sm border border-border rounded-xl hover:bg-muted transition-colors"
              >
                <Upload size={14} /> Upload from Device
              </button>
              {avatar && (
                <button onClick={handleRemoveAvatar} className="px-4 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition-colors">Remove</button>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              className="bg-card rounded-2xl border border-border p-4"
            >
              <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                <Icon size={18} />
              </div>
              <p className={`text-2xl font-bold ${stat.color}`}>{loadedStats ? stat.value : "—"}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Productivity bar */}
      {loadedStats && tasks.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-card rounded-2xl border border-border p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">Overall Productivity</p>
              <p className="text-xs text-muted-foreground">Based on your task completion rate</p>
            </div>
            <span className="text-2xl font-bold text-primary">{productivity}%</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${productivity}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-primary to-indigo-500"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">{completed} of {tasks.length} tasks completed</p>
        </motion.div>
      )}
    </div>
  );
};

export default Profile;
