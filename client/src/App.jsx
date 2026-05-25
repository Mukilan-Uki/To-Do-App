import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import SplashGate from "./components/SplashGate";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import MyTasks from "./pages/MyTasks";
import ProjectDetail from "./pages/ProjectDetail";
import SimpleTaskDetail from "./pages/SimpleTaskDetail";
import AdminDashboard from "./pages/AdminDashboard";
import Calendar from "./pages/Calendar";
import AdminUsers from "./pages/AdminUsers";
import AdminSettings from "./pages/AdminSettings";
import NotFound from "./pages/NotFound";
import Profile from "./pages/Profile";
import DailyRoutine from "./pages/DailyRoutine";

// Layouts
import AppLayout from "./layouts/AppLayout";

const ProtectedRoute = ({ children, requireAdmin }) => {
  const { user, loading } = useAuth();

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );

  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to={user.role === "admin" ? "/admin" : "/"} replace /> : <Login />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/" replace /> : <Register />}
        />

        <Route element={<AppLayout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                {user?.role === "admin" ? <Navigate to="/admin" replace /> : <Dashboard />}
              </ProtectedRoute>
            }
          />
          <Route path="/tasks" element={<ProtectedRoute><MyTasks /></ProtectedRoute>} />
          <Route path="/project/:id" element={<ProtectedRoute><ProjectDetail /></ProtectedRoute>} />
          <Route path="/task/:id" element={<ProtectedRoute><SimpleTaskDetail /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
          <Route path="/routine" element={<ProtectedRoute><DailyRoutine /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute requireAdmin><AdminUsers /></ProtectedRoute>} />
          <Route path="/admin/settings" element={<ProtectedRoute requireAdmin><AdminSettings /></ProtectedRoute>} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <SplashGate>
        <AppRoutes />
      </SplashGate>
    </BrowserRouter>
  );
}

export default App;
