import { Platform } from 'react-native';
import Constants from 'expo-constants';

/** Production API — same as web client .env default */
const PRODUCTION_API = 'https://to-do-app-nvr3.onrender.com/api';

/**
 * Resolve API base URL for emulator, physical device (Expo Go), or production.
 */
export function getApiUrl() {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && envUrl.trim()) {
    return envUrl.replace(/\/$/, '');
  }

  if (!__DEV__) {
    return PRODUCTION_API;
  }

  const debuggerHost =
    Constants.expoConfig?.hostUri?.split(':')[0] ||
    Constants.expoGoConfig?.debuggerHost?.split(':')[0] ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost?.split(':')[0];

  if (debuggerHost && debuggerHost !== 'localhost' && debuggerHost !== '127.0.0.1') {
    return `http://${debuggerHost}:5000/api`;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return 'http://localhost:5000/api';
}

export const API_URL = getApiUrl();
export const APP_NAME = 'DoNow';
