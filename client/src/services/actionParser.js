const ACTIONS_REGEX = /<actions>([\s\S]*?)<\/actions>/i;

export const DESTRUCTIVE_ACTIONS = ['DELETE_TASK'];

export function parseActionsFromResponse(text) {
  if (!text) return { cleanText: '', actions: [] };
  const match = text.match(ACTIONS_REGEX);
  if (!match) {
    return { cleanText: stripLegacyBlocks(text).trim(), actions: [] };
  }
  let actions = [];
  try {
    const parsed = JSON.parse(match[1].trim());
    actions = Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    actions = [];
  }
  const cleanText = text
    .replace(ACTIONS_REGEX, '')
    .replace(/<task>[\s\S]*?<\/task>/gi, '')
    .replace(/<suggestions>[\s\S]*?<\/suggestions>/gi, '')
    .trim();
  return { cleanText, actions: actions.filter((a) => a?.action) };
}

function stripLegacyBlocks(text) {
  return text
    .replace(/<task>[\s\S]*?<\/task>/gi, '')
    .replace(/<suggestions>[\s\S]*?<\/suggestions>/gi, '');
}

export function formatActionSummary(action) {
  const label = action.action?.replace(/_/g, ' ') || 'Action';
  const target =
    action.taskTitle ||
    action.projectTitle ||
    action.title ||
    action.routineTitle ||
    '';
  return target ? `${label}: ${target}` : label;
}
