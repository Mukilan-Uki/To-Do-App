import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/constants';
import { taskAPI } from './apiService';

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

export async function sendUnifiedMessage({ messages, context }) {
  const token = await getToken();
  const response = await fetch(`${API_URL}/ai/unified`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ messages, context }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || 'AI request failed');
  return data;
}

export async function streamUnifiedMessage({ messages, context, onChunk, onDone, onError }) {
  const token = await getToken();

  // Note: Streaming via fetch in React Native is notoriously buggy depending on the engine.
  // Using a polyfill or falling back to a non-streaming endpoint is often required.
  // We'll attempt to use React Native's fetch streaming if supported.
  try {
    const response = await fetch(`${API_URL}/ai/unified/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ messages, context }),
      reactNative: { textStreaming: true }, // attempt to use streaming in RN
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'AI stream failed');
    }

    // fallback for RN if response.body.getReader isn't there
    // If not supported, we just do a normal response
    if (!response.body || !response.body.getReader) {
      const text = await response.text();
      const lines = text.split('\n');
      let fullText = '';
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6).trim();
        if (payload === '[DONE]') break;
        try {
          const { content } = JSON.parse(payload);
          if (content) fullText += content;
        } catch {}
      }
      onChunk?.(fullText, fullText);
      onDone?.(fullText);
      return fullText;
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
        } catch {}
      }
    }
    onDone?.(fullText);
    return fullText;
  } catch (error) {
    onError?.(error);
    throw error;
  }
}

export async function fetchAppContext() {
  try {
    const tasksRes = await taskAPI.getTasks().catch(() => ({ data: [] }));
    
    // mobile doesn't currently have routines mapped in apiService, but we can add it later
    // const routineRes = await fetch(`${API_URL}/routines`)...

    return {
      tasks: tasksRes.data || [],
      routine: null,
    };
  } catch {
    return { tasks: [], routine: null };
  }
}
