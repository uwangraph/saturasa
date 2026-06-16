import type { RoomState, Participant, Song, ChatMessage, ServerEvent, ClientEvent } from './types';

const MAX_CHATS = 200;
const SYNC_INTERVAL = 5000; // 5 seconds

export class RoomDurableObject {
  private state: DurableObjectState;
  private env: any;
  private participants: Map<string, { ws: WebSocket; participant: Participant }> = new Map();
  private roomState: RoomState;
  private lastUpdate: number = Date.now();
  private syncTimer: ReturnType<typeof setInterval> | null = null;

  constructor(state: DurableObjectState, env: any) {
    this.state = state;
    this.env = env;

    // Initialize default state
    this.roomState = {
      currentSong: null,
      queue: [],
      isPlaying: false,
      currentTime: 0,
      participants: [],
      chats: [],
      chatMode: 'free',
      volume: 80,
      hostId: '',
      createdAt: Date.now(),
      isPublic: true
    };

    // Restore persisted state
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get<RoomState>('roomState');
      if (stored) {
        this.roomState = { ...this.roomState, ...stored };
      }
    });

    // Start tick timer for time tracking
    setInterval(() => this.tick(), 1000);
  }

  private tick() {
    const now = Date.now();
    const dt = (now - this.lastUpdate) / 1000;
    this.lastUpdate = now;

    if (this.roomState.isPlaying && this.roomState.currentSong) {
      this.roomState.currentTime += dt;
      
      // Auto-next if we have duration (optional enhancement)
      // For now, we just keep incrementing and rely on NEXT event
    }
  }

  private async persistState() {
    await this.state.storage.put('roomState', this.roomState);
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (url.pathname.includes('/ws')) {
      return this.handleWebSocket(request);
    }

    // REST fallback for state
    if (url.pathname.endsWith('/state')) {
      return Response.json(this.roomState);
    }

    return new Response('Not found', { status: 404 });
  }

  private async handleWebSocket(request: Request): Promise<Response> {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);

    server.accept();

    const participantId = crypto.randomUUID();
    let participant: Participant | null = null;

    server.addEventListener('message', (event: MessageEvent) => {
      try {
        const data: ClientEvent = JSON.parse(event.data as string);
        this.handleClientMessage(participantId, data, server);
      } catch (e) {
        this.sendToSocket(server, { type: 'ERROR', message: 'Invalid message format' });
      }
    });

    server.addEventListener('close', () => {
      this.handleDisconnect(participantId);
    });

    server.addEventListener('error', () => {
      this.handleDisconnect(participantId);
    });

    // Store the WS temporarily — will be updated on JOIN
    this.participants.set(participantId, {
      ws: server,
      participant: {
        id: participantId,
        name: '',
        role: 'member',
        joinedAt: Date.now()
      }
    });

    return new Response(null, { status: 101, webSocket: client });
  }

  private handleClientMessage(senderId: string, event: ClientEvent, ws: WebSocket) {
    switch (event.type) {
      case 'JOIN':
        this.handleJoin(senderId, event.name, ws);
        break;
      case 'PLAY':
        this.handlePlay(senderId);
        break;
      case 'PAUSE':
        this.handlePause(senderId);
        break;
      case 'NEXT':
        this.handleNext(senderId);
        break;
      case 'SEEK':
        this.handleSeek(senderId, event.time);
        break;
      case 'ADD_SONG':
        this.handleAddSong(senderId, event);
        break;
      case 'REMOVE_SONG':
        this.handleRemoveSong(senderId, event.index);
        break;
      case 'REORDER_SONG':
        this.handleReorderSong(senderId, event.from, event.to);
        break;
      case 'SEND_MESSAGE':
        this.handleSendMessage(senderId, event.text);
        break;
      case 'VOLUME':
        this.handleVolume(senderId, event.volume);
        break;
      case 'SET_ROLE':
        this.handleSetRole(senderId, event.userId, event.newRole);
        break;
      case 'LEAVE':
        this.handleDisconnect(senderId);
        break;
    }
  }

  private handleJoin(id: string, name: string, ws: WebSocket) {
    const existing = this.participants.get(id);
    const isFirst = this.participants.size <= 1 && !this.roomState.hostId;
    const role = isFirst ? 'host' : 'member';

    const participant: Participant = {
      id,
      name: name || 'Anonymous',
      role,
      joinedAt: Date.now()
    };

    this.participants.set(id, { ws, participant });

    if (isFirst) {
      this.roomState.hostId = id;
    }

    // Send state to the new participant
    this.sendToSocket(ws, {
      type: 'STATE',
      payload: {
        ...this.roomState,
        participants: this.getParticipantList(),
        myId: id,
        myRole: role
      }
    } satisfies ServerEvent);

    this.persistState();

    // Broadcast join to others
    this.broadcast({
      type: 'PARTICIPANTS',
      participants: this.getParticipantList()
    }, id);

    // System message
    this.addSystemMessage(`${participant.name} bergabung`);

    // Start sync timer if not running
    if (!this.syncTimer) {
      this.syncTimer = setInterval(() => this.broadcastSync(), SYNC_INTERVAL);
    }
  }

  private handlePlay(senderId: string) {
    if (!this.canControl(senderId)) return;
    this.roomState.isPlaying = true;
    this.broadcast({ type: 'PLAY' });
    this.persistState();
  }

  private handlePause(senderId: string) {
    if (!this.canControl(senderId)) return;
    this.roomState.isPlaying = false;
    this.broadcast({ type: 'PAUSE' });
    this.persistState();
  }

  private handleNext(senderId: string) {
    if (!this.canControl(senderId)) return;

    if (this.roomState.queue.length > 0) {
      this.roomState.currentSong = this.roomState.queue.shift()!;
      this.roomState.currentTime = 0;
      this.roomState.isPlaying = true;
    } else {
      this.roomState.currentSong = null;
      this.roomState.isPlaying = false;
      this.roomState.currentTime = 0;
    }

    this.broadcast({
      type: 'NEXT',
      currentSong: this.roomState.currentSong,
      queue: this.roomState.queue
    });
    this.persistState();
  }

  private handleSeek(senderId: string, time: number) {
    if (!this.canControl(senderId)) return;
    this.roomState.currentTime = time;
    this.broadcast({ type: 'SEEK', time });
    this.persistState();
  }

  private handleAddSong(senderId: string, event: { youtubeId: string; title: string; thumbnail: string }) {
    const p = this.participants.get(senderId);
    if (!p) return;

    const song: Song = {
      id: crypto.randomUUID(),
      youtubeId: event.youtubeId,
      title: event.title,
      thumbnail: event.thumbnail,
      addedBy: p.participant.name
    };

    // If no current song, play it immediately
    if (!this.roomState.currentSong) {
      this.roomState.currentSong = song;
      this.roomState.isPlaying = true;
      this.roomState.currentTime = 0;
      this.broadcast({
        type: 'NEXT',
        currentSong: song,
        queue: this.roomState.queue
      });
    } else {
      this.roomState.queue.push(song);
      this.broadcast({ type: 'ADD_SONG', queue: this.roomState.queue });
    }
    this.persistState();
  }

  private handleRemoveSong(senderId: string, index: number) {
    if (!this.canControl(senderId)) return;
    if (index >= 0 && index < this.roomState.queue.length) {
      this.roomState.queue.splice(index, 1);
      this.broadcast({ type: 'QUEUE_UPDATE', queue: this.roomState.queue });
      this.persistState();
    }
  }

  private handleReorderSong(senderId: string, from: number, to: number) {
    if (!this.canControl(senderId)) return;
    if (from < 0 || from >= this.roomState.queue.length) return;
    if (to < 0 || to >= this.roomState.queue.length) return;

    const [item] = this.roomState.queue.splice(from, 1);
    this.roomState.queue.splice(to, 0, item);
    this.broadcast({ type: 'QUEUE_UPDATE', queue: this.roomState.queue });
    this.persistState();
  }

  private handleSendMessage(senderId: string, text: string) {
    const p = this.participants.get(senderId);
    if (!p || !text.trim()) return;

    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userName: p.participant.name,
      text: text.trim().slice(0, 500),
      timestamp: Date.now(),
      type: 'text'
    };

    this.roomState.chats.push(msg);
    if (this.roomState.chats.length > MAX_CHATS) {
      this.roomState.chats = this.roomState.chats.slice(-MAX_CHATS);
    }

    this.broadcast({ type: 'NEW_MESSAGE', message: msg });
  }

  private handleVolume(senderId: string, volume: number) {
    if (!this.canControl(senderId)) return;
    this.roomState.volume = Math.max(0, Math.min(100, volume));
    this.broadcast({ type: 'VOLUME', volume: this.roomState.volume });
    this.persistState();
  }

  private handleSetRole(senderId: string, targetId: string, newRole: string) {
    const sender = this.participants.get(senderId);
    if (!sender || sender.participant.role !== 'host') return;

    const target = this.participants.get(targetId);
    if (!target) return;

    const validRoles = ['member', 'co-host', 'listener-only'];
    if (!validRoles.includes(newRole)) return;

    target.participant.role = newRole as Participant['role'];

    // Notify target of role change
    this.sendToSocket(target.ws, {
      type: 'SET_ROLE',
      userId: targetId,
      newRole,
      myRole: newRole
    });

    // Broadcast updated participants
    this.broadcast({
      type: 'PARTICIPANTS',
      participants: this.getParticipantList()
    });

    this.addSystemMessage(`${target.participant.name} sekarang ${newRole}`);
    this.persistState();
  }

  private handleDisconnect(id: string) {
    const p = this.participants.get(id);
    if (!p) return;

    this.participants.delete(id);

    // If host left, transfer to next participant
    if (id === this.roomState.hostId && this.participants.size > 0) {
      const next = this.participants.values().next().value;
      if (next) {
        next.participant.role = 'host';
        this.roomState.hostId = next.participant.id;
        this.sendToSocket(next.ws, {
          type: 'SET_ROLE',
          userId: next.participant.id,
          newRole: 'host',
          myRole: 'host'
        });
        this.addSystemMessage(`${next.participant.name} menjadi host baru`);
      }
    }

    // Notify others
    this.broadcast({
      type: 'PARTICIPANTS',
      participants: this.getParticipantList()
    });

    this.addSystemMessage(`${p.participant.name} keluar`);
    this.persistState();

    // Stop sync timer if empty
    if (this.participants.size === 0 && this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  // ── Helpers ──

  private canControl(id: string): boolean {
    const p = this.participants.get(id);
    if (!p) return false;
    return ['host', 'co-host', 'member'].includes(p.participant.role);
  }

  private getParticipantList(): Participant[] {
    return Array.from(this.participants.values()).map((p) => p.participant);
  }

  private sendToSocket(ws: WebSocket, event: ServerEvent) {
    try {
      ws.send(JSON.stringify(event));
    } catch (e) {
      // Socket might be closed
    }
  }

  private broadcast(event: ServerEvent, excludeId?: string) {
    const data = JSON.stringify(event);
    for (const [id, { ws }] of this.participants) {
      if (id !== excludeId) {
        try {
          ws.send(data);
        } catch (e) {
          // Socket closed
        }
      }
    }
  }

  private broadcastSync() {
    this.broadcast({
      type: 'SYNC',
      isPlaying: this.roomState.isPlaying,
      currentTime: this.roomState.currentTime,
      serverTime: Date.now()
    });
  }

  private addSystemMessage(text: string) {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      userName: 'System',
      text,
      timestamp: Date.now(),
      type: 'system'
    };
    this.roomState.chats.push(msg);
    if (this.roomState.chats.length > MAX_CHATS) {
      this.roomState.chats = this.roomState.chats.slice(-MAX_CHATS);
    }
    this.broadcast({ type: 'NEW_MESSAGE', message: msg });
  }
}
