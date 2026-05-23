import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { CalendarDays, Clock4, ChevronRight } from "lucide-react";

const Calendar = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get("/tasks");
        setTasks(data);
      } catch (error) {
        toast.error("Unable to load calendar tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const tasksByDate = tasks
    .filter((task) => task.dueDate)
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
    .reduce((acc, task) => {
      const dateKey = new Date(task.dueDate).toLocaleDateString();
      acc[dateKey] = acc[dateKey] || [];
      acc[dateKey].push(task);
      return acc;
    }, {});

  const priorityColors = {
    High: "bg-red-500/10 text-red-500",
    Medium: "bg-amber-500/10 text-amber-500",
    Low: "bg-emerald-500/10 text-emerald-500",
  };

  const today = new Date().toLocaleDateString();
  const tomorrow = new Date(Date.now() + 86400000).toLocaleDateString();

  const formatDateLabel = (dateStr) => {
    if (dateStr === today) return "Today";
    if (dateStr === tomorrow) return "Tomorrow";
    return dateStr;
  };

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Calendar</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Track your deadlines</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
          <CalendarDays size={18} />
          <span className="hidden sm:inline">{user?.name}</span>
        </div>
      </header>

      {/* Quick stats - horizontal scroll on mobile */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-2xl border border-border p-3 md:p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold">{tasks.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Total tasks</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-3 md:p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-primary">{Object.keys(tasksByDate).length}</p>
          <p className="text-xs text-muted-foreground mt-1">Deadlines</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-3 md:p-4 text-center">
          <p className="text-2xl md:text-3xl font-bold text-emerald-500">
            {tasks.filter(t => t.status === "completed").length}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Done</p>
        </div>
      </div>

      {/* Upcoming deadlines */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2">
          <Clock4 size={18} className="text-primary" /> Upcoming Deadlines
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : Object.keys(tasksByDate).length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <Clock4 size={36} className="mx-auto mb-3 text-primary opacity-50" />
            <p className="font-medium">No deadlines yet</p>
            <p className="text-sm mt-1 opacity-70">Create a task with a due date to see it here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(tasksByDate).map(([date, tasksForDate]) => (
              <div key={date}>
                {/* Date header */}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`flex items-center gap-2 text-sm font-semibold ${date === today ? 'text-primary' : date === tomorrow ? 'text-amber-500' : 'text-foreground'}`}>
                    <span>{formatDateLabel(date)}</span>
                    {date === today && <span className="text-[10px] px-2 py-0.5 bg-primary/10 text-primary rounded-full">Today</span>}
                  </div>
                  <div className="flex-1 h-px bg-border" />
                  <span className="text-xs text-muted-foreground">{tasksForDate.length} task{tasksForDate.length > 1 ? 's' : ''}</span>
                </div>

                {/* Tasks for this date */}
                <div className="space-y-2">
                  {tasksForDate.map((task) => (
                    <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium text-sm truncate ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'}`}>
                          {task.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Calendar;
