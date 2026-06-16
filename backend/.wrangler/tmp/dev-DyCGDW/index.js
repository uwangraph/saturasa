var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-UfbMgD/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// .wrangler/tmp/bundle-UfbMgD/strip-cf-connecting-ip-header.js
function stripCfConnectingIPHeader(input, init) {
  const request = new Request(input, init);
  request.headers.delete("CF-Connecting-IP");
  return request;
}
__name(stripCfConnectingIPHeader, "stripCfConnectingIPHeader");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    return Reflect.apply(target, thisArg, [
      stripCfConnectingIPHeader.apply(null, argArray)
    ]);
  }
});

// src/RoomDO.ts
var MAX_CHATS = 200;
var SYNC_INTERVAL = 5e3;
var RoomDurableObject = class {
  state;
  env;
  participants = /* @__PURE__ */ new Map();
  roomState;
  lastUpdate = Date.now();
  syncTimer = null;
  constructor(state, env) {
    this.state = state;
    this.env = env;
    this.roomState = {
      currentSong: null,
      queue: [],
      isPlaying: false,
      currentTime: 0,
      participants: [],
      chats: [],
      chatMode: "free",
      volume: 80,
      hostId: "",
      createdAt: Date.now(),
      isPublic: true,
      skipVotes: []
    };
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("roomState");
      if (stored) {
        this.roomState = { ...this.roomState, ...stored };
      }
    });
    setInterval(() => this.tick(), 1e3);
  }
  tick() {
    const now = Date.now();
    const dt = (now - this.lastUpdate) / 1e3;
    this.lastUpdate = now;
    if (this.roomState.isPlaying && this.roomState.currentSong) {
      this.roomState.currentTime += dt;
    }
  }
  async persistState() {
    await this.state.storage.put("roomState", this.roomState);
  }
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.includes("/ws")) {
      return this.handleWebSocket(request);
    }
    if (url.pathname.endsWith("/state")) {
      return Response.json(this.roomState);
    }
    return new Response("Not found", { status: 404 });
  }
  async handleWebSocket(request) {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    server.accept();
    const participantId = crypto.randomUUID();
    let participant = null;
    server.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleClientMessage(participantId, data, server);
      } catch (e) {
        this.sendToSocket(server, { type: "ERROR", message: "Invalid message format" });
      }
    });
    server.addEventListener("close", () => {
      this.handleDisconnect(participantId);
    });
    server.addEventListener("error", () => {
      this.handleDisconnect(participantId);
    });
    this.participants.set(participantId, {
      ws: server,
      participant: {
        id: participantId,
        name: "",
        role: "member",
        joinedAt: Date.now()
      }
    });
    return new Response(null, { status: 101, webSocket: client });
  }
  handleClientMessage(senderId, event, ws) {
    switch (event.type) {
      case "JOIN":
        this.handleJoin(senderId, event.name, ws);
        break;
      case "PLAY":
        this.handlePlay(senderId);
        break;
      case "PAUSE":
        this.handlePause(senderId);
        break;
      case "NEXT":
        this.handleNext(senderId);
        break;
      case "SEEK":
        this.handleSeek(senderId, event.time);
        break;
      case "ADD_SONG":
        this.handleAddSong(senderId, event);
        break;
      case "REMOVE_SONG":
        this.handleRemoveSong(senderId, event.index);
        break;
      case "REORDER_SONG":
        this.handleReorderSong(senderId, event.from, event.to);
        break;
      case "SEND_MESSAGE":
        this.handleSendMessage(senderId, event.text);
        break;
      case "VOLUME":
        this.handleVolume(senderId, event.volume);
        break;
      case "VOTE_SKIP":
        this.handleVoteSkip(senderId);
        break;
      case "SET_ROLE":
        this.handleSetRole(senderId, event.userId, event.newRole);
        break;
      case "LEAVE":
        this.handleDisconnect(senderId);
        break;
    }
  }
  handleJoin(id, name, ws) {
    const existing = this.participants.get(id);
    const isFirst = this.participants.size <= 1 && !this.roomState.hostId;
    const role = isFirst ? "host" : "member";
    const participant = {
      id,
      name: name || "Anonymous",
      role,
      joinedAt: Date.now()
    };
    this.participants.set(id, { ws, participant });
    if (isFirst) {
      this.roomState.hostId = id;
    }
    this.sendToSocket(ws, {
      type: "STATE",
      payload: {
        ...this.roomState,
        participants: this.getParticipantList(),
        myId: id,
        myRole: role
      }
    });
    this.persistState();
    this.broadcast({
      type: "PARTICIPANTS",
      participants: this.getParticipantList()
    }, id);
    this.addSystemMessage(`${participant.name} bergabung`);
    if (!this.syncTimer) {
      this.syncTimer = setInterval(() => this.broadcastSync(), SYNC_INTERVAL);
    }
  }
  handlePlay(senderId) {
    if (!this.canControl(senderId))
      return;
    this.roomState.isPlaying = true;
    this.broadcast({ type: "PLAY" });
    this.persistState();
  }
  handlePause(senderId) {
    if (!this.canControl(senderId))
      return;
    this.roomState.isPlaying = false;
    this.broadcast({ type: "PAUSE" });
    this.persistState();
  }
  handleNext(senderId) {
    if (!this.canControl(senderId))
      return;
    this.roomState.skipVotes = [];
    if (this.roomState.queue.length > 0) {
      this.roomState.currentSong = this.roomState.queue.shift();
      this.roomState.currentTime = 0;
      this.roomState.isPlaying = true;
    } else {
      this.roomState.currentSong = null;
      this.roomState.isPlaying = false;
      this.roomState.currentTime = 0;
    }
    this.broadcast({
      type: "NEXT",
      currentSong: this.roomState.currentSong,
      queue: this.roomState.queue
    });
    this.persistState();
  }
  handleVoteSkip(senderId) {
    if (!this.roomState.skipVotes.includes(senderId)) {
      this.roomState.skipVotes.push(senderId);
      const threshold = Math.max(1, Math.floor(this.participants.size * 0.3));
      if (this.roomState.skipVotes.length >= threshold) {
        this.addSystemMessage("Ambang batas vote tercapai. Lagu dilewati!");
        this.handleNext(this.roomState.hostId);
      } else {
        this.broadcast({ type: "VOTE_SKIP", skipVotes: this.roomState.skipVotes });
        this.persistState();
      }
    }
  }
  handleSeek(senderId, time) {
    if (!this.canControl(senderId))
      return;
    this.roomState.currentTime = time;
    this.broadcast({ type: "SEEK", time });
    this.persistState();
  }
  handleAddSong(senderId, event) {
    const p = this.participants.get(senderId);
    if (!p)
      return;
    const song = {
      id: crypto.randomUUID(),
      youtubeId: event.youtubeId,
      title: event.title,
      thumbnail: event.thumbnail,
      addedBy: p.participant.name
    };
    if (!this.roomState.currentSong) {
      this.roomState.currentSong = song;
      this.roomState.isPlaying = true;
      this.roomState.currentTime = 0;
      this.broadcast({
        type: "NEXT",
        currentSong: song,
        queue: this.roomState.queue
      });
    } else {
      this.roomState.queue.push(song);
      this.broadcast({ type: "ADD_SONG", queue: this.roomState.queue });
    }
    this.persistState();
  }
  handleRemoveSong(senderId, index) {
    if (!this.canControl(senderId))
      return;
    if (index >= 0 && index < this.roomState.queue.length) {
      this.roomState.queue.splice(index, 1);
      this.broadcast({ type: "QUEUE_UPDATE", queue: this.roomState.queue });
      this.persistState();
    }
  }
  handleReorderSong(senderId, from, to) {
    if (!this.canControl(senderId))
      return;
    if (from < 0 || from >= this.roomState.queue.length)
      return;
    if (to < 0 || to >= this.roomState.queue.length)
      return;
    const [item] = this.roomState.queue.splice(from, 1);
    this.roomState.queue.splice(to, 0, item);
    this.broadcast({ type: "QUEUE_UPDATE", queue: this.roomState.queue });
    this.persistState();
  }
  handleSendMessage(senderId, text) {
    const p = this.participants.get(senderId);
    if (!p || !text.trim())
      return;
    const msg = {
      id: crypto.randomUUID(),
      userName: p.participant.name,
      text: text.trim().slice(0, 500),
      timestamp: Date.now(),
      type: "text"
    };
    this.roomState.chats.push(msg);
    if (this.roomState.chats.length > MAX_CHATS) {
      this.roomState.chats = this.roomState.chats.slice(-MAX_CHATS);
    }
    this.broadcast({ type: "NEW_MESSAGE", message: msg });
  }
  handleVolume(senderId, volume) {
    if (!this.canControl(senderId))
      return;
    this.roomState.volume = Math.max(0, Math.min(100, volume));
    this.broadcast({ type: "VOLUME", volume: this.roomState.volume });
    this.persistState();
  }
  handleSetRole(senderId, targetId, newRole) {
    const sender = this.participants.get(senderId);
    if (!sender || sender.participant.role !== "host")
      return;
    const target = this.participants.get(targetId);
    if (!target)
      return;
    const validRoles = ["member", "co-host", "listener-only"];
    if (!validRoles.includes(newRole))
      return;
    target.participant.role = newRole;
    this.sendToSocket(target.ws, {
      type: "SET_ROLE",
      userId: targetId,
      newRole,
      myRole: newRole
    });
    this.broadcast({
      type: "PARTICIPANTS",
      participants: this.getParticipantList()
    });
    this.addSystemMessage(`${target.participant.name} sekarang ${newRole}`);
    this.persistState();
  }
  handleDisconnect(id) {
    const p = this.participants.get(id);
    if (!p)
      return;
    this.participants.delete(id);
    if (id === this.roomState.hostId && this.participants.size > 0) {
      const next = this.participants.values().next().value;
      if (next) {
        next.participant.role = "host";
        this.roomState.hostId = next.participant.id;
        this.sendToSocket(next.ws, {
          type: "SET_ROLE",
          userId: next.participant.id,
          newRole: "host",
          myRole: "host"
        });
        this.addSystemMessage(`${next.participant.name} menjadi host baru`);
      }
    }
    this.broadcast({
      type: "PARTICIPANTS",
      participants: this.getParticipantList()
    });
    this.addSystemMessage(`${p.participant.name} keluar`);
    this.persistState();
    if (this.participants.size === 0 && this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }
  // ── Helpers ──
  canControl(id) {
    const p = this.participants.get(id);
    if (!p)
      return false;
    return ["host", "co-host", "member"].includes(p.participant.role);
  }
  getParticipantList() {
    return Array.from(this.participants.values()).map((p) => p.participant);
  }
  sendToSocket(ws, event) {
    try {
      ws.send(JSON.stringify(event));
    } catch (e) {
    }
  }
  broadcast(event, excludeId) {
    const data = JSON.stringify(event);
    for (const [id, { ws }] of this.participants) {
      if (id !== excludeId) {
        try {
          ws.send(data);
        } catch (e) {
        }
      }
    }
  }
  broadcastSync() {
    this.broadcast({
      type: "SYNC",
      isPlaying: this.roomState.isPlaying,
      currentTime: this.roomState.currentTime,
      serverTime: Date.now()
    });
  }
  addSystemMessage(text) {
    const msg = {
      id: crypto.randomUUID(),
      userName: "System",
      text,
      timestamp: Date.now(),
      type: "system"
    };
    this.roomState.chats.push(msg);
    if (this.roomState.chats.length > MAX_CHATS) {
      this.roomState.chats = this.roomState.chats.slice(-MAX_CHATS);
    }
    this.broadcast({ type: "NEW_MESSAGE", message: msg });
  }
};
__name(RoomDurableObject, "RoomDurableObject");

// src/index.ts
var handler = {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const origin = request.headers.get("Origin");
    const corsHeaders = {
      "Access-Control-Allow-Origin": origin || "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Credentials": "true"
    };
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    if (path === "/api/rooms" && request.method === "POST") {
      return createRoom(request, env, corsHeaders);
    }
    if (path.match(/^\/api\/rooms\/[a-zA-Z0-9-_]+\/state$/) && request.method === "GET") {
      const roomId = path.split("/")[3];
      return getRoomState(roomId, env, corsHeaders);
    }
    if (path === "/api/youtube/search" && request.method === "GET") {
      return youtubeSearch(request, env, corsHeaders);
    }
    if (path.match(/^\/api\/ws\/[a-zA-Z0-9-_]+$/)) {
      console.log("WebSocket Upgrade Request:", path);
      return handleWebSocket(path, request, env);
    }
    return env.ASSETS.fetch(request);
  }
};
function sanitizeRoomCode(input) {
  return input.trim().toLowerCase().replace(/[^a-z0-9-_]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 20);
}
__name(sanitizeRoomCode, "sanitizeRoomCode");
async function createRoom(request, env, headers) {
  try {
    const body = await request.json();
    let roomCode;
    if (body.roomName) {
      roomCode = sanitizeRoomCode(body.roomName);
      if (roomCode.length < 3) {
        return Response.json({ error: "Nama ruang minimal 3 karakter" }, { status: 400, headers });
      }
      const existing = await env.DB.prepare("SELECT id FROM rooms WHERE id = ?").bind(roomCode).first();
      if (existing) {
        return Response.json({ error: "Nama ruang sudah dipakai, coba nama lain" }, { status: 409, headers });
      }
    } else {
      roomCode = generateRoomCode();
    }
    await env.DB.prepare(
      "INSERT INTO rooms (id, host_id, created_at, is_public, participant_count, chat_mode) VALUES (?, ?, ?, 0, 0, ?)"
    ).bind(roomCode, "pending", Date.now(), "free").run();
    return Response.json({ roomCode }, { headers });
  } catch (e) {
    return Response.json({ error: "Failed to create room" }, { status: 500, headers });
  }
}
__name(createRoom, "createRoom");
async function getRoomState(roomId, env, headers) {
  try {
    const room = await env.DB.prepare("SELECT id FROM rooms WHERE id = ?").bind(roomId).first();
    if (!room) {
      return Response.json({ error: "Room not found" }, { status: 404, headers });
    }
    const id = env.ROOM_DO.idFromName(roomId);
    const stub = env.ROOM_DO.get(id);
    const res = await stub.fetch(`https://dummy/state`);
    return new Response(res.body, { headers: { ...headers, "Content-Type": "application/json" } });
  } catch (e) {
    return Response.json({ error: "Internal server error" }, { status: 500, headers });
  }
}
__name(getRoomState, "getRoomState");
async function youtubeSearch(request, env, headers) {
  const url = new URL(request.url);
  const query = url.searchParams.get("q");
  if (!query) {
    return Response.json({ error: "Query required" }, { status: 400, headers });
  }
  const apiKey = env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "YouTube API key not configured" }, { status: 500, headers });
  }
  try {
    const ytUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${apiKey}`;
    const res = await fetch(ytUrl);
    const data = await res.json();
    const results = (data.items || []).map((item) => ({
      youtubeId: item.id?.videoId,
      title: item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle
    })).filter((r) => r.youtubeId);
    return Response.json(results, { headers });
  } catch (e) {
    return Response.json({ error: "Search failed" }, { status: 500, headers });
  }
}
__name(youtubeSearch, "youtubeSearch");
async function handleWebSocket(path, request, env) {
  const roomCode = path.split("/").pop();
  const room = await env.DB.prepare("SELECT id FROM rooms WHERE id = ?").bind(roomCode).first();
  if (!room) {
    return new Response("Room not found", { status: 404 });
  }
  const id = env.ROOM_DO.idFromName(roomCode);
  const stub = env.ROOM_DO.get(id);
  return stub.fetch(request);
}
__name(handleWebSocket, "handleWebSocket");
function generateRoomCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
__name(generateRoomCode, "generateRoomCode");
var src_default = handler;

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-UfbMgD/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-UfbMgD/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  RoomDurableObject,
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
