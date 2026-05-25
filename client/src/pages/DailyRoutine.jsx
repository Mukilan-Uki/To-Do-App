import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun, Plus, Clock, Bell, Trash2, Check, Sparkles,
  ChevronRight, Activity, Coffee, Dumbbell
} from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';
import { useAIAssistant } from '../context/AIAssistantContext';
import {
  todayKey,
  formatTime12,
  parseTime,
  getCurrentMinutes,
  getActiveRoutineItem,
  isHealthCategory,
  isItemCompletedToday,
  getRoutineProgress,
} from '../utils/routineUtils';

const CATEGORY_ICONS = {
  general: Coffee,
  health: Activity,
  workout: Dumbbell,
  wellness: Sun,
  other: Clock,
};

const DEFAULT_ITEMS = [
  { title: 'Wake up', time: '05:00', duration: 15, category: 'general' },
  { title: 'Morning walk', time: '05:15', duration: 30, category: 'health' },
  { title: 'Tea & breakfast', time: '06:00', duration: 20, category: 'general' },
];

const DailyRoutine = () => {
  const [routine, setRoutine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const { openAssistant, dataVersion } = useAIAssistant();
  const [nowTick, setNowTick] = useState(Date.now());
  const [newItem, setNewItem] = useState({
    title: '',
    time: '07:00',
    duration: 15,
    category: 'general',
    reminder: true,
  });

  const fetchRoutine = useCallback(async () => {
    try {
      const { data } = await api.get('/routines');
      setRoutine(data);
    } catch {
      toast.error('Failed to load routine');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoutine();
  }, [fetchRoutine, dataVersion]);

  useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!routine?.items?.length) return;
    const withReminder = routine.items.filter((i) => i.reminder);
    if (!withReminder.length || !('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    const check = () => {
      const now = getCurrentMinutes();
      withReminder.forEach((item) => {
        const start = parseTime(item.time);
        if (now === start && !isItemCompletedToday(item)) {
          const key = `reminder-${item._id}-${todayKey()}`;
          if (!sessionStorage.getItem(key)) {
            sessionStorage.setItem(key, '1');
            if (Notification.permission === 'granted') {
              new Notification('DoNow Routine', {
                body: `Time for: ${item.title}`,
                icon: '/vite.svg',
              });
            } else {
              toast(`⏰ ${item.title}`, { icon: '🔔' });
            }
          }
        }
      });
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [routine, nowTick]);

  const items = useMemo(
    () => [...(routine?.items || [])].sort((a, b) => parseTime(a.time) - parseTime(b.time)),
    [routine?.items]
  );

  const activeItem = useMemo(() => getActiveRoutineItem(items), [items, nowTick]);
  const progress = getRoutineProgress(items);
  const hasHealthItems = items.some((i) => isHealthCategory(i.category));

  const saveRoutine = async (payload) => {
    const { data } = await api.put('/routines', payload);
    setRoutine(data);
    return data;
  };

  const handleToggle = async (itemId) => {
    try {
      const { data } = await api.put(`/routines/items/${itemId}/toggle`);
      setRoutine(data);
    } catch {
      toast.error('Could not update item');
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newItem.title.trim()) return;
    try {
      const { data } = await api.post('/routines/items', {
        ...newItem,
        order: items.length,
      });
      setRoutine(data);
      setShowAdd(false);
      setNewItem({ title: '', time: '07:00', duration: 15, category: 'general', reminder: true });
      toast.success('Routine step added');
      if (isHealthCategory(newItem.category)) {
        openAssistant();
      }
    } catch {
      toast.error('Failed to add item');
    }
  };

  const handleDelete = async (itemId) => {
    try {
      const { data } = await api.delete(`/routines/items/${itemId}`);
      setRoutine(data);
      toast.success('Removed from routine');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const seedDefaults = async () => {
    try {
      await saveRoutine({ items: DEFAULT_ITEMS.map((d, i) => ({ ...d, order: i })) });
      toast.success('Sample routine added — customize it!');
    } catch {
      toast.error('Could not add samples');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground">Daily Routine</h1>
          <p className="text-sm text-muted-foreground mt-1">Your recurring schedule, every day</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasHealthItems && (
            <button
              onClick={openAssistant}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-sm font-bold shadow-lg shadow-rose-500/25 hover:opacity-95 transition-opacity"
            >
              <Sparkles size={16} /> AI Coach
            </button>
          )}
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-[var(--donow-blue)] text-white text-sm font-bold shadow-md hover:opacity-95 transition-opacity"
          >
            <Plus size={16} /> Add Step
          </button>
        </div>
      </motion.div>

      {/* What should you do now */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-primary rounded-3xl p-5 md:p-6 shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2">What should you do now?</p>
        {activeItem ? (
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              {(() => {
                const Icon = CATEGORY_ICONS[activeItem.category] || Clock;
                return <Icon size={28} className="text-white" />;
              })()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-2xl md:text-3xl font-black text-white truncate">{activeItem.title}</p>
              <p className="text-white/80 text-sm mt-0.5">
                {formatTime12(activeItem.time)} · {activeItem.duration || 15} min
              </p>
            </div>
            {!isItemCompletedToday(activeItem) && (
              <button
                onClick={() => handleToggle(activeItem._id)}
                className="flex-shrink-0 px-4 py-2.5 bg-white text-[var(--donow-blue)] rounded-2xl text-sm font-bold hover:bg-white/90 transition-colors"
              >
                Done
              </button>
            )}
          </div>
        ) : (
          <p className="text-white/90 text-lg font-semibold">Add your first routine step to get started.</p>
        )}
      </motion.div>

      {/* Progress */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl border border-border p-4 shadow-sm col-span-2 sm:col-span-1">
          <p className="text-xs text-muted-foreground font-semibold">Today&apos;s progress</p>
          <p className="text-3xl font-black text-foreground mt-1">{progress}%</p>
          <div className="h-2 rounded-full bg-muted mt-2 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600"
            />
          </div>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <p className="text-xs text-muted-foreground font-semibold">Steps</p>
          <p className="text-3xl font-black text-foreground mt-1">{items.length}</p>
        </motion.div>
        <motion.div whileHover={{ y: -2 }} className="bg-card rounded-2xl border border-border p-4 shadow-sm hidden sm:block">
          <p className="text-xs text-muted-foreground font-semibold">Recurring</p>
          <p className="text-lg font-black text-emerald-600 mt-2">{routine?.isRecurring ? 'Daily' : 'Once'}</p>
        </motion.div>
      </div>

      {/* Timeline */}
      <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="p-4 md:p-5 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Clock size={18} className="text-primary" />
            Timeline
          </h2>
          {items.length === 0 && (
            <button onClick={seedDefaults} className="text-xs font-bold text-primary hover:underline">
              Load sample routine
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="p-12 text-center">
            <Sun size={40} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-sm">No routine steps yet</p>
          </div>
        ) : (
          <div className="p-4 md:p-6 space-y-0 max-h-[60vh] overflow-y-auto">
            {items.map((item, index) => {
              const isActive = activeItem?._id === item._id;
              const done = isItemCompletedToday(item);
              const Icon = CATEGORY_ICONS[item.category] || Clock;
              return (
                <motion.div
                  key={item._id}
                  layout
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className={`relative flex gap-4 pb-6 last:pb-0 group ${isActive ? 'z-10' : ''}`}
                >
                  {index < items.length - 1 && (
                    <div className="absolute left-[19px] top-10 bottom-0 w-0.5 bg-border" />
                  )}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 transition-all ${
                      isActive
                        ? 'bg-[var(--donow-blue)] text-white ring-4 ring-blue-500/30 scale-110'
                        : done
                          ? 'bg-emerald-500/15 text-emerald-600'
                          : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {done ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <div
                    className={`flex-1 min-w-0 rounded-2xl border p-4 transition-all card-hover ${
                      isActive
                        ? 'border-blue-400 bg-blue-500/5 shadow-md'
                        : 'border-border bg-background/50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`font-bold text-sm truncate ${done ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTime12(item.time)} · {item.duration || 15} min
                          {item.reminder && (
                            <span className="inline-flex items-center gap-0.5 ml-2 text-amber-600">
                              <Bell size={10} /> reminder
                            </span>
                          )}
                        </p>
                        {isActive && !done && (
                          <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-600">
                            Active now
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleToggle(item._id)}
                          className={`p-2 rounded-xl transition-colors ${
                            done ? 'bg-emerald-500/15 text-emerald-600' : 'hover:bg-muted text-muted-foreground'
                          }`}
                          aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 rounded-xl hover:bg-destructive/10 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 sm:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => setShowAdd(false)}
          >
            <motion.form
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              onSubmit={handleAdd}
              className="w-full sm:max-w-md bg-card rounded-t-3xl sm:rounded-3xl border border-border p-6 shadow-2xl safe-area-pb"
            >
              <h3 className="font-bold text-lg mb-4">Add routine step</h3>
              <div className="space-y-4">
                <input
                  required
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g. Morning walk"
                  className="w-full px-4 py-3 rounded-2xl bg-muted text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Time</label>
                    <input
                      type="time"
                      value={newItem.time}
                      onChange={(e) => setNewItem({ ...newItem, time: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-muted text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-muted-foreground mb-1 block">Duration (min)</label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={newItem.duration}
                      onChange={(e) => setNewItem({ ...newItem, duration: Number(e.target.value) })}
                      className="w-full px-4 py-3 rounded-2xl bg-muted text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-muted-foreground mb-1 block">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-2xl bg-muted text-sm"
                  >
                    <option value="general">General</option>
                    <option value="health">Health</option>
                    <option value="workout">Workout</option>
                    <option value="wellness">Wellness</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newItem.reminder}
                    onChange={(e) => setNewItem({ ...newItem, reminder: e.target.checked })}
                    className="rounded"
                  />
                  Enable reminder
                </label>
              </div>
              <button
                type="submit"
                className="w-full mt-6 py-3.5 rounded-2xl bg-[var(--donow-blue)] text-white font-bold flex items-center justify-center gap-2"
              >
                Add to routine <ChevronRight size={16} />
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default DailyRoutine;
