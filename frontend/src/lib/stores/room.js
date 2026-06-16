import { writable, derived } from 'svelte/store';

export const roomState = writable({
  connected: false,
  roomCode: '',
  currentSong: null, // { youtubeId, title, thumbnail, addedBy }
  queue: [],
  isPlaying: false,
  currentTime: 0,
  volume: 80,
  participants: [],
  chats: [],
  myRole: 'member',
  chatMode: 'free',
  error: null
});

export const currentSong = derived(roomState, ($s) => $s.currentSong);
export const queue = derived(roomState, ($s) => $s.queue);
export const isPlaying = derived(roomState, ($s) => $s.isPlaying);
export const participants = derived(roomState, ($s) => $s.participants);
export const chats = derived(roomState, ($s) => $s.chats);
export const connected = derived(roomState, ($s) => $s.connected);
export const myRole = derived(roomState, ($s) => $s.myRole);
export const isHost = derived(roomState, ($s) => $s.myRole === 'host');

/** Check if participant can control music */
export function canControl(role) {
  return role === 'host' || role === 'co-host' || role === 'member';
}

/** Check if participant can moderate */
export function canModerate(role) {
  return role === 'host' || role === 'co-host';
}
