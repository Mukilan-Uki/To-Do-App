import React, { useState, useEffect } from "react";
import api from "../services/api";
import toast from "react-hot-toast";
import { Users, Trash2 } from "lucide-react";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get("/admin/users");
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user and all their tasks?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers(users.filter((user) => user._id !== id));
      toast.success("User removed");
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to delete user");
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Review accounts and manage users safely.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-4 py-3 font-medium">
          <Users size={18} /> Dashboard tools
        </div>
      </header>

      <div className="bg-card rounded-3xl border border-border shadow-sm p-6">
        {loading ? (
          <p className="text-muted-foreground">Loading users...</p>
        ) : users.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-lg font-medium">No users found.</p>
            <p className="mt-2">New signups will appear here automatically.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user._id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-3xl bg-background border border-border"
              >
                <div>
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Tasks: {user.taskCount}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(user._id)}
                  className="inline-flex items-center gap-2 rounded-2xl bg-destructive/10 text-destructive px-4 py-2 hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsers;
