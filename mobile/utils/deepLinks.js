export function parseRoomCode(value) {
  if (!value) return null;
  let decoded;
  try {
    decoded = decodeURIComponent(String(value)).trim().toUpperCase();
  } catch {
    return null;
  }

  if (/^[A-Z2-9]{5}$/.test(decoded)) return decoded;
  const match = decoded.match(/^CODENAMES:\/\/JOIN\/([A-Z2-9]{5})(?:[/?#].*)?$/);
  return match?.[1] || null;
}

export function roomDeepLink(roomCode) {
  return `codenames://join/${String(roomCode || '').toUpperCase()}`;
}
