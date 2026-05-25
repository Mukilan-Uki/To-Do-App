import api from './api';
import { API_URL } from '../config/constants';

/**
 * Unified AI API — chat with full app context.
 */
export async function sendUnifiedMessage({ messages, context }) {
  const { data } = await api.post('/ai/unified', { messages, context });
  return data;
}

/**
 * Stream unified AI response via SSE (falls back handled by caller).
 */
export async function streamUnifiedMessage({ messages, context, onChunk, onDone, onError }) {
  const userInfo = localStorage.getItem('userInfo');
  const token = userInfo ? JSON.parse(userInfo).token : null;

  const response = await fetch(`${API_URL}/ai/unified/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, context }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'AI stream failed');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const payload = line.slice(6).trim();
      if (payload === '[DONE]') {
        onDone?.(fullText);
        return fullText;
      }
      try {
        const { content } = JSON.parse(payload);
        if (content) {
          fullText += content;
          onChunk?.(fullText, content);
        }
      } catch {
        /* skip malformed */
      }
    }
  }
  onDone?.(fullText);
  return fullText;
}

export async function fetchAppContext() {
  const [tasksRes, routineRes] = await Promise.allSettled([
    api.get('/tasks'),
    api.get('/routines'),
  ]);
  return {
    tasks: tasksRes.status === 'fulfilled' ? tasksRes.value.data : [],
    routine: routineRes.status === 'fulfilled' ? routineRes.value.data : null,
  };
}
