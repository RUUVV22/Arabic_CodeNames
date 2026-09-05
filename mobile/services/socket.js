import { io } from 'socket.io-client';

export function normalizeServerUrl(value) {
  const normalized = String(value || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(normalized)) return null;
  return normalized;
}

export function createGameSocket(serverUrl) {
  return io(serverUrl, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 600,
    reconnectionDelayMax: 4_000,
    timeout: 8_000,
    transports: ['websocket', 'polling'],
  });
}
