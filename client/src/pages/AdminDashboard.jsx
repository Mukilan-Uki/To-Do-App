import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Trash2 } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    usersGrowth: []
  });
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/users')
      ]);
      setStats(statsRes.data);
      setUsersList(usersRes.data);
    } catch (error) {
      toast.error('Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user? This will delete all their tasks as well.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsersList(usersList.filter(u => u._id !== id));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  if (loading) return <div className="text-white text-center mt-20">Loading...</div>;

  return (
    <div className="space-y-6 pb-20 bg-slate-950 min-h-screen text-slate-300 p-4 rounded-3xl">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
            Admin Portal
          </h1>
          <p className="text-slate-400 mt-1">Platform overview and user management.</p>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Users</h3>
          <p className="text-4xl font-bold mt-2 text-white">{stats.totalUsers}</p>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Total Tasks</h3>
          <p className="text-4xl font-bold mt-2 text-white">{stats.totalTasks}</p>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Completed Tasks</h3>
          <p className="text-4xl font-bold mt-2 text-emerald-400">{stats.completedTasks}</p>
        </motion.div>
        <motion.div whileHover={{ y: -5 }} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Pending Tasks</h3>
          <p className="text-4xl font-bold mt-2 text-amber-400">{stats.pendingTasks}</p>
        </motion.div>
      </div>

      {/* Charts & Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-6 h-[400px] flex flex-col">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">User Registrations</h2>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.usersGrowth.length > 0 ? stats.usersGrowth : [{ _id: 'No Data', count: 0 }]}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="_id" stroke="#64748b" tick={{fill: '#64748b'}} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b'}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-lg p-6 h-[400px] flex flex-col">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">User Management</h2>
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
            {usersList.length === 0 ? (
              <p className="text-slate-500 text-center mt-10">No users found.</p>
            ) : (
              usersList.map((u) => (
                <div key={u._id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-800 hover:border-slate-700 transition-colors">
                  <div>
                    <p className="font-medium text-slate-200">{u.name}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                    <p className="text-xs text-blue-400 mt-1">{u.taskCount} tasks</p>
                  </div>
                  {u._id !== user._id && (
                    <button 
                      onClick={() => handleDeleteUser(u._id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                      title="Delete user"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                  {u._id === user._id && (
                    <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-md">You</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
