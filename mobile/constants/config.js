import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getExpoDevelopmentHost() {
  const hostUri = Constants.expoConfig?.hostUri || Constants.expoGoConfig?.debuggerHost;
  if (!hostUri) return null;

  try {
    return new URL(hostUri.includes('://') ? hostUri : `http://${hostUri}`).hostname;
  } catch {
    return String(hostUri).split(':')[0] || null;
  }
}

const developmentHost = getExpoDevelopmentHost();
const platformDefault = Platform.OS === 'web'
  ? 'http://localhost:3001'
  : developmentHost
    ? `http://${developmentHost}:3001`
    : Platform.OS === 'android'
      ? 'http://10.0.2.2:3001'
      : 'http://localhost:3001';

export const DEFAULT_SERVER_URL = process.env.EXPO_PUBLIC_SERVER_URL || platformDefault;

export function getInitialServerUrl(storedServerUrl) {
  if (!storedServerUrl) return DEFAULT_SERVER_URL;

  const storedUsesLoopback = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(storedServerUrl);
  const defaultUsesLoopback = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/?$/i.test(DEFAULT_SERVER_URL);

  if (Platform.OS !== 'web' && storedUsesLoopback && !defaultUsesLoopback) {
    return DEFAULT_SERVER_URL;
  }

  return storedServerUrl;
}

export const ACTION_TIMEOUT_MS = 8_000;
export const SESSION_STORAGE_KEY = '@arabic-codenames/session';
export const SERVER_STORAGE_KEY = '@arabic-codenames/server-url';
export const MUTE_STORAGE_KEY = '@arabic-codenames/muted';
export const LAST_NAME_STORAGE_KEY = '@arabic-codenames/last-name';
