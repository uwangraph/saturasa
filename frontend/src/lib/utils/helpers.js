/** Generate a random 6-char room code (uppercase + digits) */
export function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** Format seconds to mm:ss */
export function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/** Extract YouTube video ID from URL or return the ID directly */
export function extractYouTubeId(input) {
  if (!input) return null;
  // Already an ID (11 chars, no special URL chars)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input)) return input;
  // Full URL patterns
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];
  for (const p of patterns) {
    const m = input.match(p);
    if (m) return m[1];
  }
  return null;
}

/** Generate invite message */
export function inviteMessage(roomCode) {
  return `🎵 Ayo dengerin musik bareng di SatuRasa!\n\nKode ruang: ${roomCode}\nLink: ${window.location.origin}/${roomCode}`;
}

/** Copy text to clipboard */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    return true;
  }
}

/** Get API Base URL */
export function getApiBase() {
  const apiBase = import.meta.env.VITE_API_BASE || '';
  return apiBase.endsWith('/') ? apiBase.slice(0, -1) : apiBase;
}

/** Get WebSocket Base URL */
export function getWsBase() {
  const apiBase = getApiBase();
  if (apiBase.startsWith('http')) {
    // If API base is absolute, convert to ws/wss
    return apiBase.replace(/^http/, 'ws');
  }
  
  // If no API base is set, use current host
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}`;
}

/** Get stored username */
export function getStoredName() {
  try {
    return localStorage.getItem('saturasa_name') || '';
  } catch {
    return '';
  }
}

/** Store username */
export function storeName(name) {
  try {
    localStorage.setItem('saturasa_name', name);
  } catch {
    // ignore
  }
}

/** Get room URL */
export function getRoomUrl(roomCode) {
  return `${window.location.origin}/${roomCode}`;
}
