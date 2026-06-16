// Re-export all shared types for backend use
export type {
  Song,
  Participant,
  ChatMessage,
  RoomState,
  ServerEvent,
  ClientEvent
} from '../shared/types';

export interface Env {
  ROOM_DO: DurableObjectNamespace;
  DB: D1Database;
  YOUTUBE_API_KEY: string;
  ASSETS: any;
}
