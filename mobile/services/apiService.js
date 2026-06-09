import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';

// Native fetch-based API client — no axios, no DOMException, no browser deps
async function getToken() {
  try {
    const raw = await AsyncStorage.getItem('userInfo');
    if (raw) {
      const { token } = JSON.parse(raw);
      return token || null;
    }
  } catch {}
  return null;
}

async function request(method, path, body) {
  const token = await getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${API_URL}${path}`, opts);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { message: text }; }

  if (!res.ok) {
    const err = new Error(json?.message || `HTTP ${res.status}`);
    err.response = { status: res.status, data: json };
    throw err;
  }
  return { data: json, status: res.status };
}

export const getApiErrorMessage = (error) => {
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
    return `Cannot reach server at ${API_URL}. Check your Wi-Fi and API URL in .env`;
  }
  return error?.message || 'Request failed';
};

export const authAPI = {
  login:      (data) => request('POST', '/auth/login', data),
  register:   (data) => request('POST', '/auth/register', data),
  getProfile: ()     => request('GET',  '/auth/profile'),
};

export const taskAPI = {
  getTasks:   ()          => request('GET',    '/tasks'),
  getTask:    (id)        => request('GET',    `/tasks/${id}`),
  createTask: (data)      => request('POST',   '/tasks', data),
  updateTask: (id, data)  => request('PUT',    `/tasks/${id}`, data),
  deleteTask: (id)        => request('DELETE', `/tasks/${id}`),
  reorder:    (items)     => request('PUT',    '/tasks/reorder', { items }),
  addCollaborator:    (id, invite)   => request('POST',   `/tasks/${id}/collaborators`, { invite }),
  removeCollaborator: (id, collabId) => request('DELETE', `/tasks/${id}/collaborators/${collabId}`),
  // Subtask endpoints
  addSubtask:    (taskId, data)            => request('POST',   `/tasks/${taskId}/subtasks`, data),
  updateSubtask: (taskId, subtaskId, data) => request('PUT',    `/tasks/${taskId}/subtasks/${subtaskId}`, data),
  deleteSubtask: (taskId, subtaskId)       => request('DELETE', `/tasks/${taskId}/subtasks/${subtaskId}`),
};

// Correct invitation endpoints — matches /api/invitations routes on server
export const invitationAPI = {
  getMyInvitations: ()            => request('GET', '/invitations'),
  accept:           (id)          => request('PUT', `/invitations/${id}/accept`),
  reject:           (id)          => request('PUT', `/invitations/${id}/reject`),
};

// Projects — dedicated /api/projects endpoints
export const projectAPI = {
  getProjects:   ()           => request('GET',  '/projects'),
  createProject: (data)       => request('POST', '/projects', data),
  inviteToProject: (id, invite) => request('POST', `/projects/${id}/invite`, { invite }),
};

// Routine endpoints
export const routineAPI = {
  getRoutine:        ()              => request('GET',    '/routines'),
  updateRoutine:     (data)          => request('PUT',    '/routines', data),
  addItem:           (data)          => request('POST',   '/routines/items', data),
  toggleItem:        (itemId)        => request('PUT',    `/routines/items/${itemId}/toggle`),
  deleteItem:        (itemId)        => request('DELETE', `/routines/items/${itemId}`),
};

export { request };
export default { request };
