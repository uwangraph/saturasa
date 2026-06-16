// Shared types between frontend and backend

export interface Song {
  id: string;
  youtubeId: string;
  title: string;
  thumbnail: string;
  addedBy: string;
  duration?: number;
}

export interface Participant {
  id: string;
  name: string;
  role: 'host' | 'co-host' | 'member' | 'listener-only';
  joinedAt: number;
}

export interface ChatMessage {
  id: string;
  userName: string;
  text: string;
  timestamp: number;
  type: 'text' | 'system';
}

export interface RoomState {
  currentSong: Song | null;
  queue: Song[];
  isPlaying: boolean;
  currentTime: number;
  participants: Participant[];
  chats: ChatMessage[];
  chatMode: 'free' | 'emoji-only';
  volume: number;
  hostId: string;
  createdAt: number;
  isPublic: boolean;
  skipVotes: string[];
}

export type ServerEvent =
  | { type: 'STATE'; payload: RoomState & { myId: string; myRole: string } }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT'; currentSong: Song | null; queue: Song[] }
  | { type: 'SEEK'; time: number }
  | { type: 'ADD_SONG'; queue: Song[] }
  | { type: 'NEW_MESSAGE'; message: ChatMessage }
  | { type: 'VOLUME'; volume: number }
  | { type: 'VOTE_SKIP'; skipVotes: string[] }
  | { type: 'SYNC'; isPlaying: boolean; currentTime: number; serverTime: number }
  | { type: 'PARTICIPANTS'; participants: Participant[]; myRole?: string }
  | { type: 'QUEUE_UPDATE'; queue: Song[] }
  | { type: 'SET_ROLE'; userId: string; newRole: string; myRole?: string }
  | { type: 'ERROR'; message: string };

export type ClientEvent =
  | { type: 'JOIN'; name: string; role?: string }
  | { type: 'PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'SEEK'; time: number }
  | { type: 'ADD_SONG'; youtubeId: string; title: string; thumbnail: string }
  | { type: 'REMOVE_SONG'; index: number }
  | { type: 'REORDER_SONG'; from: number; to: number }
  | { type: 'SEND_MESSAGE'; text: string; messageType?: string }
  | { type: 'VOLUME'; volume: number }
  | { type: 'VOTE_SKIP' }
  | { type: 'SET_ROLE'; userId: string; newRole: string }
  | { type: 'LEAVE' };
