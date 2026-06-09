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
  getInvitations:              () => request('GET', '/tasks/invitations'),
  respondToInvitation: (taskId, accept) => request('POST', `/tasks/${taskId}/invitations/respond`, { accept }),
  addCollaborator:    (id, invite)      => request('POST',   `/tasks/${id}/collaborators`, { invite }),
  removeCollaborator: (id, collabId)    => request('DELETE', `/tasks/${id}/collaborators/${collabId}`),
};

export default { request };
