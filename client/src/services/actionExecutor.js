import api from './api';
import { normalizeActionType, normalizeActionObject, CANONICAL_ACTIONS } from './actionParser';

function normalize(str) {
  return (str || '').toLowerCase().trim();
}

export function findTaskByRef(tasks, ref = {}) {
  if (!tasks?.length) return null;
  if (ref.taskId) return tasks.find((t) => t._id === ref.taskId) || null;
  const title = normalize(ref.projectTitle || ref.taskTitle || ref.title);
  if (!title) return null;
  const projectFirst = ref.projectTitle
    ? tasks.filter((t) => t.type === 'project')
    : tasks;
  return (
    projectFirst.find((t) => normalize(t.title) === title) ||
    projectFirst.find((t) => normalize(t.title).includes(title)) ||
    tasks.find((t) => normalize(t.title).includes(title))
  );
}

export function findRoutineItem(routine, ref = {}) {
  if (!routine?.items?.length) return null;
  if (ref.itemId) return routine.items.find((i) => i._id === ref.itemId) || null;
  const title = normalize(ref.routineTitle || ref.title);
  return routine.items.find((i) => normalize(i.title).includes(title));
}

function applyProjectProgress(task, percent) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  const total = task.subtasks?.length || 0;
  if (total === 0) return task.subtasks;
  const targetDone = Math.round((p / 100) * total);
  return task.subtasks.map((s, i) => ({
    ...s,
    completed: i < targetDone,
  }));
}

/**
 * Execute a single AI action against the API.
 */
export async function executeAction(rawAction, { tasks = [], routine = null } = {}) {
  const action = normalizeActionObject(rawAction) || rawAction;
  const type = normalizeActionType(action.action);

  if (!type || !CANONICAL_ACTIONS.includes(type)) {
    throw new Error(
      `Unknown action: ${rawAction?.action ?? rawAction?.type ?? 'missing'}. Use names like ADD_SUBTASK, CREATE_TASK.`,
    );
  }

  switch (type) {
    case 'CREATE_TASK': {
      const { data } = await api.post('/tasks', {
        title: action.title || action.taskTitle,
        description: action.description || '',
        priority: action.priority || 'Medium',
        category: action.category || 'General',
        type: 'simple',
        dueDate: action.dueDate || undefined,
      });
      return { success: true, message: `Created task "${data.title}"`, data };
    }

    case 'CREATE_PROJECT': {
      const subtasks = (action.subtasks || []).map((s, i) => ({
        title: typeof s === 'string' ? s : s.title,
        completed: false,
        order: i,
      }));
      const { data } = await api.post('/tasks', {
        title: action.title || action.projectTitle || action.taskTitle,
        description: action.description || '',
        priority: action.priority || 'Medium',
        category: action.category || 'General',
        type: 'project',
        subtasks,
      });
      return { success: true, message: `Created project "${data.title}"`, data };
    }

    case 'ADD_SUBTASK': {
      const project = findTaskByRef(tasks, {
        projectTitle: action.projectTitle || action.project,
        taskId: action.projectId,
      });
      if (!project) throw new Error(`Project not found: ${action.projectTitle || action.project}`);
      if (project.type !== 'project') throw new Error(`"${project.title}" is not a project`);
      const { data } = await api.post(`/tasks/${project._id}/subtasks`, {
        title: action.subtaskTitle || action.task || action.title,
      });
      return {
        success: true,
        message: `Added subtask to "${project.title}"`,
        data,
      };
    }

    case 'UPDATE_TASK_PROGRESS': {
      const task = findTaskByRef(tasks, action);
      if (!task) throw new Error(`Task not found: ${action.taskTitle || action.projectTitle}`);
      if (task.type === 'project') {
        const subtasks = applyProjectProgress(task, action.progress ?? action.percent);
        const { data } = await api.put(`/tasks/${task._id}`, { subtasks });
        return {
          success: true,
          message: `Updated "${task.title}" to ${action.progress ?? action.percent}%`,
          data,
        };
      }
      const status = (action.progress ?? action.percent) >= 100 ? 'completed' : 'pending';
      const { data } = await api.put(`/tasks/${task._id}`, { status });
      return { success: true, message: `Updated "${task.title}"`, data };
    }

    case 'DELETE_TASK': {
      const task = findTaskByRef(tasks, action);
      if (!task) throw new Error(`Task not found: ${action.taskTitle}`);
      await api.delete(`/tasks/${task._id}`);
      return { success: true, message: `Deleted "${task.title}"` };
    }

    case 'MOVE_TASK': {
      const task = findTaskByRef(tasks, action);
      if (!task) throw new Error('Task not found for move');
      const sorted = [...tasks].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const filtered = sorted.filter((t) => t._id !== task._id);
      const position = Math.max(0, Math.min(action.position ?? 0, filtered.length));
      filtered.splice(position, 0, task);
      const items = filtered.map((t, i) => ({ _id: t._id, order: i }));
      await api.put('/tasks/reorder', { items });
      return { success: true, message: `Moved "${task.title}"` };
    }

    case 'CREATE_DAILY_ROUTINE': {
      const { data } = await api.post('/routines/items', {
        title: action.title || action.routineTitle,
        time: action.time || '07:00',
        duration: action.duration || 15,
        category: action.category || 'general',
        reminder: action.reminder !== false,
      });
      return {
        success: true,
        message: `Added routine "${action.title || action.routineTitle}" at ${action.time}`,
        data,
      };
    }

    case 'UPDATE_ROUTINE_TIME': {
      const routineRes = await api.get('/routines');
      const routine = routineRes.data;
      const item = findRoutineItem(routine, action);
      if (!item) throw new Error(`Routine item not found: ${action.routineTitle || action.title}`);
      const items = routine.items.map((i) =>
        i._id === item._id
          ? {
              ...i,
              time: action.time || action.newTime || i.time,
              title: action.title || i.title,
              duration: action.duration ?? i.duration,
            }
          : i
      );
      const { data } = await api.put('/routines', { items });
      return {
        success: true,
        message: `Updated routine "${item.title}" to ${action.time || action.newTime}`,
        data,
      };
    }

    case 'GET_TODAY_SCHEDULE':
    case 'SUGGEST_IMPROVEMENTS':
      return {
        success: true,
        message: 'Answered in chat',
        skipExecution: true,
      };

    default:
      throw new Error(`Unhandled action: ${type}`);
  }
}

export async function executeActions(actions, ctx) {
  const results = [];
  for (const action of actions) {
    if (['GET_TODAY_SCHEDULE', 'SUGGEST_IMPROVEMENTS'].includes(action.action)) {
      results.push({ action: action.action, skipped: true });
      continue;
    }
    try {
      const result = await executeAction(action, ctx);
      results.push({ action: action.action, ...result });
    } catch (err) {
      results.push({
        action: action.action,
        success: false,
        message: err.response?.data?.message || err.message,
      });
    }
  }
  return results;
}
