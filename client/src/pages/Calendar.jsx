import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import api from "../services/api";
import toast from "react-hot-toast";
import { ChevronLeft, ChevronRight, CalendarDays, X, CheckCircle, Clock } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const priorityDotColors = {
  High: "bg-red-500",
  Medium: "bg-amber-400",
  Low: "bg-emerald-500",
};
const priorityBadgeColors = {
  High: "bg-red-500/10 text-red-500",
  Medium: "bg-amber-500/10 text-amber-500",
  Low: "bg-emerald-500/10 text-emerald-500",
};

const Calendar = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await api.get("/tasks");
        setTasks(data);
      } catch {
        toast.error("Unable to load calendar tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Map tasks to date keys (YYYY-MM-DD)
  const tasksByDate = tasks.reduce((acc, task) => {
    if (!task.dueDate) return acc;
    const d = new Date(task.dueDate);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    acc[key] = acc[key] || [];
    acc[key].push(task);
    return acc;
  }, {});

  const getTasksForDay = (day) => {
    const key = `${year}-${month}-${day}`;
    return tasksByDate[key] || [];
  };

  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const isPast = (day) => new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const selectedTasks = selectedDay ? getTasksForDay(selectedDay) : [];

  const completedCount = tasks.filter(t => t.status === "completed").length;
  const withDueDate = tasks.filter(t => t.dueDate).length;

  // grid cells: blanks + days
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-5 pb-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Calendar</h1>
          <p className="text-xs md:text-sm text-muted-foreground mt-0.5">Track your deadlines visually</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium">
          <CalendarDays size={18} />
          <span className="hidden sm:inline">{user?.name}</span>
        </div>
      </header>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total tasks", value: tasks.length, color: "text-primary" },
          { label: "With deadlines", value: withDueDate, color: "text-indigo-500" },
          { label: "Completed", value: completedCount, color: "text-emerald-500" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-2xl border border-border p-3 md:p-4 text-center">
            <p className={`text-2xl md:text-3xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        {/* Month nav */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft size={18} />
          </button>
          <h2 className="font-semibold text-base md:text-lg">
            {MONTHS[month]} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronRight size={18} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-3 md:p-4">
            {/* Day names */}
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[10px] md:text-xs font-semibold text-muted-foreground py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (!day) return <div key={`blank-${i}`} />;
                const dayTasks = getTasksForDay(day);
                const hasTasks = dayTasks.length > 0;
                const todayCell = isToday(day);
                const pastCell = isPast(day) && !todayCell;
                const isSelected = selectedDay === day;

                return (
                  <motion.button
                    key={day}
                    whileHover={{ scale: 1.08 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedDay(isSelected ? null : day)}
                    className={`
                      relative flex flex-col items-center rounded-xl p-1 md:p-2 min-h-[48px] md:min-h-[64px] transition-all cursor-pointer
                      ${todayCell ? "bg-primary text-primary-foreground shadow-md shadow-primary/30" : ""}
                      ${isSelected && !todayCell ? "bg-primary/15 ring-2 ring-primary/40" : ""}
                      ${!todayCell && !isSelected ? "hover:bg-muted" : ""}
                      ${pastCell && !hasTasks ? "opacity-40" : ""}
                    `}
                  >
                    <span className={`text-xs md:text-sm font-semibold ${todayCell ? "text-primary-foreground" : pastCell ? "text-muted-foreground" : "text-foreground"}`}>
                      {day}
                    </span>

                    {hasTasks && (
                      <div className="flex flex-wrap justify-center gap-0.5 mt-1">
                        {dayTasks.slice(0, 3).map((t, ti) => (
                          <span
                            key={ti}
                            className={`w-1.5 h-1.5 rounded-full ${todayCell ? "bg-white" : priorityDotColors[t.priority] || "bg-primary"}`}
                          />
                        ))}
                        {dayTasks.length > 3 && (
                          <span className={`text-[8px] font-bold ${todayCell ? "text-white/80" : "text-muted-foreground"}`}>+{dayTasks.length - 3}</span>
                        )}
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
              <p className="text-xs text-muted-foreground font-medium">Priority:</p>
              {Object.entries(priorityDotColors).map(([p, c]) => (
                <div key={p} className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${c}`} />
                  <span className="text-[10px] text-muted-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Selected day task panel */}
      <AnimatePresence>
        {selectedDay && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div>
                <h3 className="font-semibold text-sm">
                  {MONTHS[month]} {selectedDay}, {year}
                </h3>
                <p className="text-xs text-muted-foreground">{selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}</p>
              </div>
              <button onClick={() => setSelectedDay(null)} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
                <X size={16} />
              </button>
            </div>
            {selectedTasks.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground">
                <Clock size={28} className="mx-auto mb-2 opacity-40" />
                <p className="text-sm">No tasks due this day</p>
              </div>
            ) : (
              <div className="p-4 space-y-2">
                {selectedTasks.map(task => (
                  <motion.div
                    key={task._id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors"
                  >
                    <div className={`flex-shrink-0 ${task.status === "completed" ? "text-emerald-500" : "text-muted-foreground"}`}>
                      <CheckCircle size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{task.description}</p>}
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${priorityBadgeColors[task.priority]}`}>
                        {task.priority}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upcoming deadlines list */}
      <div className="bg-card rounded-2xl border border-border shadow-sm p-4 md:p-6">
        <h2 className="font-semibold mb-4 flex items-center gap-2 text-base">
          <Clock size={18} className="text-primary" /> Upcoming Deadlines
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (() => {
          const upcoming = tasks
            .filter(t => t.dueDate && new Date(t.dueDate) >= new Date(today.getFullYear(), today.getMonth(), today.getDate()))
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
            .slice(0, 8);

          if (upcoming.length === 0) return (
            <div className="text-center py-10 text-muted-foreground">
              <CalendarDays size={32} className="mx-auto mb-3 opacity-40" />
              <p className="font-medium text-sm">No upcoming deadlines</p>
              <p className="text-xs mt-1 opacity-70">Create tasks with due dates to see them here</p>
            </div>
          );

          return (
            <div className="space-y-2">
              {upcoming.map(task => {
                const due = new Date(task.dueDate);
                const isToday2 = due.toDateString() === today.toDateString();
                const isTomorrow = due.toDateString() === new Date(today.getTime() + 86400000).toDateString();
                const label = isToday2 ? "Today" : isTomorrow ? "Tomorrow" : due.toLocaleDateString("en-US", { month: "short", day: "numeric" });

                return (
                  <div key={task._id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background hover:border-primary/30 transition-colors group">
                    <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center text-center flex-shrink-0 ${isToday2 ? "bg-primary text-primary-foreground" : isTomorrow ? "bg-amber-500/10 text-amber-500" : "bg-muted text-muted-foreground"}`}>
                      <span className="text-[10px] font-medium leading-none">{due.toLocaleDateString("en-US", { month: "short" })}</span>
                      <span className="text-sm font-bold leading-tight">{due.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${task.status === "completed" ? "line-through text-muted-foreground" : ""}`}>
                        {task.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{label} · {task.category}</p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${priorityBadgeColors[task.priority]}`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default Calendar;
