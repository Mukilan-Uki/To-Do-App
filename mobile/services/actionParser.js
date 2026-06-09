const ACTIONS_REGEX = /<actions>([\s\S]*?)<\/actions>/gi;

export const DESTRUCTIVE_ACTIONS = ['DELETE_TASK'];

import { BASIC_DAILY_ROUTINE_ITEMS } from './routineDefaults';

export const CANONICAL_ACTIONS = [
  'CREATE_TASK',
  'CREATE_PROJECT',
  'ADD_SUBTASK',
  'UPDATE_TASK_PROGRESS',
  'DELETE_TASK',
  'MOVE_TASK',
  'CREATE_DAILY_ROUTINE',
  'SET_DAILY_ROUTINE',
  'UPDATE_ROUTINE_TIME',
  'GET_TODAY_SCHEDULE',
  'SUGGEST_IMPROVEMENTS',
];

/**
 * Fix LLM output like "_SUBTASK", "ADD SUBTASK", "add_subtask" → ADD_SUBTASK
 */
export function normalizeActionType(raw) {
  if (raw == null || raw === '') return null;

  let s = String(raw)
    .trim()
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .toUpperCase()
    .replace(/[\s\u00A0-]+/g, '_')
    .replace(/_+/g, '_');

  while (s.startsWith('_')) s = s.slice(1);
  while (s.endsWith('_')) s = s.slice(0, -1);

  const compact = s.replace(/_/g, '');

  const compactMap = {
    CREATETASK: 'CREATE_TASK',
    CREATEPROJECT: 'CREATE_PROJECT',
    ADDSUBTASK: 'ADD_SUBTASK',
    SUBTASK: 'ADD_SUBTASK',
    UPDATETASKPROGRESS: 'UPDATE_TASK_PROGRESS',
    UPDATEPROGRESS: 'UPDATE_TASK_PROGRESS',
    SETPROGRESS: 'UPDATE_TASK_PROGRESS',
    DELETETASK: 'DELETE_TASK',
    REMOVETASK: 'DELETE_TASK',
    MOVETASK: 'MOVE_TASK',
    REORDERTASK: 'MOVE_TASK',
    CREATEDAILYROUTINE: 'CREATE_DAILY_ROUTINE',
    CREATEROUTINE: 'CREATE_DAILY_ROUTINE',
    ADDROUTINE: 'CREATE_DAILY_ROUTINE',
    SETDAILYROUTINE: 'SET_DAILY_ROUTINE',
    SETROUTINE: 'SET_DAILY_ROUTINE',
    REPLACEROUTINE: 'SET_DAILY_ROUTINE',
    UPDATEROUTINETIME: 'UPDATE_ROUTINE_TIME',
    UPDATEROUTINE: 'UPDATE_ROUTINE_TIME',
    MOVEROUTINE: 'UPDATE_ROUTINE_TIME',
    GETTODAYSCHEDULE: 'GET_TODAY_SCHEDULE',
    TODAYSCHEDULE: 'GET_TODAY_SCHEDULE',
    SUGGESTIMPROVEMENTS: 'SUGGEST_IMPROVEMENTS',
  };

  if (CANONICAL_ACTIONS.includes(s)) return s;
  if (compactMap[compact]) return compactMap[compact];

  if (s.includes('SUBTASK') && !s.startsWith('ADD')) return 'ADD_SUBTASK';
  if (s === 'SUBTASK' || s.endsWith('_SUBTASK')) return 'ADD_SUBTASK';
  if (s.includes('ROUTINE') && (s.includes('UPDATE') || s.includes('MOVE') || s.includes('TIME'))) {
    return 'UPDATE_ROUTINE_TIME';
  }
  if (s.includes('ROUTINE') && (s.includes('SET') || s.includes('REPLACE') || s.includes('BULK'))) {
    return 'SET_DAILY_ROUTINE';
  }
  if (s.includes('ROUTINE') && (s.includes('CREATE') || s.includes('ADD'))) {
    return s.includes('ITEMS') || s.includes('MULTIPLE') ? 'SET_DAILY_ROUTINE' : 'CREATE_DAILY_ROUTINE';
  }
  if (s.includes('DELETE') || s.includes('REMOVE')) return 'DELETE_TASK';
  if (s.includes('PROGRESS') || s.includes('PERCENT') || s.includes('COMPLETE')) {
    return 'UPDATE_TASK_PROGRESS';
  }
  if (s.includes('PROJECT') && s.includes('CREATE')) return 'CREATE_PROJECT';
  if (s.includes('TASK') && s.includes('CREATE')) return 'CREATE_TASK';
  if (s.includes('SCHEDULE') || s.includes('TODAY')) return 'GET_TODAY_SCHEDULE';
  if (s.includes('SUGGEST')) return 'SUGGEST_IMPROVEMENTS';

  return s;
}

export function normalizeActionObject(obj) {
  if (!obj || typeof obj !== 'object') return null;

  const rawAction = obj.action ?? obj.type ?? obj.command ?? obj.name ?? obj.operation;
  const action = normalizeActionType(rawAction);
  const isSubtask = action === 'ADD_SUBTASK';

  const items = Array.isArray(obj.items)
    ? obj.items
    : Array.isArray(obj.routineItems)
      ? obj.routineItems
      : Array.isArray(obj.routines)
        ? obj.routines
        : null;

  return {
    ...obj,
    action: items?.length && action === 'CREATE_DAILY_ROUTINE' ? 'SET_DAILY_ROUTINE' : action,
    items,
    append: obj.append === true || obj.mode === 'append',
    projectTitle:
      obj.projectTitle ?? obj.project ?? obj.projectName ?? obj.parentProject ?? obj.parent,
    subtaskTitle:
      obj.subtaskTitle ??
      obj.subtask ??
      obj.subTask ??
      obj.sub_task ??
      (isSubtask ? obj.task : null) ??
      obj.taskName,
    taskTitle: obj.taskTitle ?? obj.task_name ?? (!isSubtask ? obj.task : null) ?? obj.taskName,
    title: obj.title ?? obj.routineTitle ?? obj.routine_title,
    routineTitle: obj.routineTitle ?? obj.routine ?? obj.routineName,
    time: obj.time ?? obj.newTime ?? obj.new_time,
    progress: obj.progress ?? obj.percent ?? obj.percentage ?? obj.completion,
    position: obj.position ?? obj.order ?? obj.index,
  };
}

function parseActionsJson(raw) {
  if (!raw?.trim()) return [];

  let text = raw.trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();

  const tryParse = (str) => {
    try {
      return JSON.parse(str);
    } catch {
      return null;
    }
  };

  let parsed = tryParse(text);
  if (!parsed) {
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) parsed = tryParse(arrayMatch[0]);
  }
  if (!parsed) {
    const objectMatch = text.match(/\{[\s\S]*\}/);
    if (objectMatch) parsed = tryParse(objectMatch[0]);
  }

  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.actions)) return parsed.actions;
  if (parsed.action) return [parsed];
  return [parsed];
}

export function parseActionsFromResponse(text) {
  if (!text) return { cleanText: '', actions: [] };

  const blocks = [...text.matchAll(ACTIONS_REGEX)];
  let actions = [];

  if (blocks.length > 0) {
    for (const match of blocks) {
      const chunk = parseActionsJson(match[1]);
      actions.push(...chunk);
    }
  } else {
    const inline = text.match(/\[[\s\S]*?"action"[\s\S]*?\]/i);
    if (inline) actions = parseActionsJson(inline[0]);
  }

  const normalized = actions.map(normalizeActionObject).filter(Boolean);
  const valid = normalized.filter((a) => a.action && CANONICAL_ACTIONS.includes(a.action));
  const invalid = normalized.filter((a) => a.action && !CANONICAL_ACTIONS.includes(a.action));

  actions = valid;

  const cleanText = text
    .replace(ACTIONS_REGEX, '')
    .replace(/<task>[\s\S]*?<\/task>/gi, '')
    .replace(/<suggestions>[\s\S]*?<\/suggestions>/gi, '')
    .replace(/\[[\s\S]*?"action"[\s\S]*?\]/g, '')
    .trim();

  return { cleanText, actions, invalid };
}

/**
 * AI often says "your routine now includes..." without <actions> JSON — infer a safe default.
 */
export function inferRoutineActionsIfMissing(actions, userMessage = '', aiText = '') {
  if (actions?.length) return actions;

  const user = (userMessage || '').toLowerCase();
  const ai = (aiText || '').toLowerCase();
  const userWantsRoutine =
    /routine|schedule|wake\s*up|breakfast|lunch|dinner|sleep|daily\s*plan/.test(user);
  const aiClaimsCreated =
    /routine now includes|added.*routine|created.*routine|your daily routine|includes these activities|set up your routine/.test(
      ai,
    );

  if (userWantsRoutine && (aiClaimsCreated || /create.*routine|build.*routine|set up.*routine/.test(user))) {
    return [
      {
        action: 'SET_DAILY_ROUTINE',
        items: BASIC_DAILY_ROUTINE_ITEMS,
      },
    ];
  }

  return [];
}

export function formatActionSummary(action) {
  const label = (action.action || 'Action').replace(/_/g, ' ');
  const target =
    action.subtaskTitle ||
    action.taskTitle ||
    action.projectTitle ||
    action.title ||
    action.routineTitle ||
    '';
  return target ? `${label}: ${target}` : label;
}
