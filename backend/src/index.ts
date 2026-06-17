import { RoomDurableObject } from './RoomDO';
import type { Env } from './types';

export { RoomDurableObject };

const handler: ExportedHandler<Env> = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const origin = request.headers.get('Origin');
    const corsHeaders = {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Credentials': 'true',
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ── API Routes ──

    // Create room
    if (path === '/api/rooms' && request.method === 'POST') {
      return createRoom(request, env, corsHeaders);
    }

    // Get room state (REST fallback)
    if (path.match(/^\/api\/rooms\/[a-zA-Z0-9-_]+\/state$/) && request.method === 'GET') {
      const roomId = path.split('/')[3];
      return getRoomState(roomId, env, corsHeaders);
    }

    // List public rooms
    if (path === '/api/rooms/public' && request.method === 'GET') {
      return listPublicRooms(env, corsHeaders);
    }

    // YouTube search
    if (path === '/api/youtube/search' && request.method === 'GET') {
      return youtubeSearch(request, env, corsHeaders);
    }

    // WebSocket upgrade
    if (path.match(/^\/api\/ws\/[a-zA-Z0-9-_]+$/)) {
      console.log('WebSocket Upgrade Request:', path);
      return handleWebSocket(path, request, env);
    }

    // Serve static files (SPA fallback)
    return env.ASSETS.fetch(request);
  }
};

function sanitizeRoomCode(input: string): string {
  // Allow alphanumeric, dash, underscore; max 20 chars
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
}

async function createRoom(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  try {
    const body = await request.json() as any;
    let roomCode: string;

    if (body.roomName) {
      // Custom room name
      roomCode = sanitizeRoomCode(body.roomName);
      if (roomCode.length < 3) {
        return Response.json({ error: 'Nama ruang minimal 3 karakter' }, { status: 400, headers });
      }
      // Check if already exists
      const existing = await env.DB.prepare('SELECT id FROM rooms WHERE id = ?').bind(roomCode).first();
      if (existing) {
        return Response.json({ error: 'Nama ruang sudah dipakai, coba nama lain' }, { status: 409, headers });
      }
    } else {
      // Random code
      roomCode = generateRoomCode();
    }

    // Store room metadata in D1 (is_public is always 0 now)
    await env.DB.prepare(
      'INSERT INTO rooms (id, host_id, created_at, is_public, participant_count, chat_mode) VALUES (?, ?, ?, 0, 0, ?)'
    ).bind(roomCode, 'pending', Date.now(), 'free').run();

    return Response.json({ roomCode }, { headers });
  } catch (e) {
    return Response.json({ error: 'Failed to create room' }, { status: 500, headers });
  }
}

async function getRoomState(roomId: string, env: Env, headers: Record<string, string>): Promise<Response> {
  try {
    // Check if room exists in D1 first
    const room = await env.DB.prepare('SELECT id FROM rooms WHERE id = ?').bind(roomId).first();
    if (!room) {
      return Response.json({ error: 'Room not found' }, { status: 404, headers });
    }

    const id = env.ROOM_DO.idFromName(roomId);
    const stub = env.ROOM_DO.get(id);
    const res = await stub.fetch(`https://dummy/state`);
    return new Response(res.body, { headers: { ...headers, 'Content-Type': 'application/json' } });
  } catch (e) {
    return Response.json({ error: 'Internal server error' }, { status: 500, headers });
  }
}

async function listPublicRooms(env: Env, headers: Record<string, string>): Promise<Response> {
  try {
    const rooms = await env.DB.prepare(
      'SELECT id, participant_count, created_at FROM rooms WHERE is_public = 1 ORDER BY created_at DESC LIMIT 50'
    ).all();
    return Response.json(rooms.results || [], { headers });
  } catch (e) {
    return Response.json({ error: 'Failed to list rooms' }, { status: 500, headers });
  }
}

async function youtubeSearch(request: Request, env: Env, headers: Record<string, string>): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return Response.json({ error: 'Query required' }, { status: 400, headers });
  }

  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: 'YouTube API key not configured' }, { status: 500, headers });
  }

  try {
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`;
    const res = await fetch(ytUrl);
    const data = await res.json() as any;

    const results = (data.items || []).map((item: any) => ({
      youtubeId: item.id?.videoId,
      title: item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle
    })).filter((r: any) => r.youtubeId);

    return Response.json(results, { headers });
  } catch (e) {
    return Response.json({ error: 'Search failed' }, { status: 500, headers });
  }
}

async function handleWebSocket(path: string, request: Request, env: Env): Promise<Response> {
  const roomCode = path.split('/').pop()!;
  
  // Check if room exists in D1
  const room = await env.DB.prepare('SELECT id FROM rooms WHERE id = ?').bind(roomCode).first();
  if (!room) {
    return new Response('Room not found', { status: 404 });
  }

  const id = env.ROOM_DO.idFromName(roomCode);
  const stub = env.ROOM_DO.get(id);

  // Forward the request to the Durable Object
  return stub.fetch(request);
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default handler;
