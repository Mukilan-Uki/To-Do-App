import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { CalendarDays, CheckCircle2, Clock4 } from "lucide-react";

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

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">
            Track your deadlines and upcoming tasks.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-primary/10 text-primary px-4 py-3 font-medium">
          <CalendarDays size={20} />
          {user?.name}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="bg-card rounded-3xl border border-border shadow-sm p-6 min-h-[380px]">
          <h2 className="text-xl font-semibold mb-4">Upcoming Deadlines</h2>

          {loading ? (
            <p className="text-muted-foreground">Loading calendar events...</p>
          ) : Object.keys(tasksByDate).length === 0 ? (
            <div className="text-center text-muted-foreground py-20">
              <Clock4 size={42} className="mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium">No deadlines scheduled yet.</p>
              <p className="mt-2">
                Create a task with a due date to see it here.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(tasksByDate).map(([date, tasksForDate]) => (
                <div
                  key={date}
                  className="rounded-3xl border border-border p-4 bg-background/80"
                >
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold">{date}</p>
                    <span className="text-xs bg-primary/10 text-primary px-3 py-1 rounded-full">
                      {tasksForDate.length} task
                      {tasksForDate.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {tasksForDate.map((task) => (
                      <div
                        key={task._id}
                        className="p-4 rounded-3xl bg-card border border-border"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <p className="font-medium">{task.title}</p>
                          <span className="text-xs uppercase tracking-[0.15em] text-muted-foreground">
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {task.description || "No description"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <aside className="bg-card rounded-3xl border border-border shadow-sm p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
          <div className="space-y-4">
            <div className="rounded-3xl bg-background/70 p-4 border border-border">
              <p className="text-sm text-muted-foreground">Total tasks</p>
              <p className="text-3xl font-bold mt-2">{tasks.length}</p>
            </div>
            <div className="rounded-3xl bg-background/70 p-4 border border-border">
              <p className="text-sm text-muted-foreground">Deadlines set</p>
              <p className="text-3xl font-bold mt-2">
                {Object.keys(tasksByDate).length}
              </p>
            </div>
            <div className="rounded-3xl bg-background/70 p-4 border border-border">
              <p className="text-sm text-muted-foreground">Next deadline</p>
              <p className="text-3xl font-bold mt-2">
                {Object.keys(tasksByDate)[0] || "None"}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Calendar;
