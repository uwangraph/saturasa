<script>
  import { onMount, onDestroy } from 'svelte';
  import { currentPage } from '../lib/utils/router.js';
  import { roomState, currentSong, queue, isPlaying, participants, chats, connected, myRole, isHost } from '../lib/stores/room.js';
  import { getStoredName, storeName, getRoomUrl, getWsBase, getApiBase } from '../lib/utils/helpers.js';
  import { toast } from '../lib/stores/toast.js';

  import YouTubePlayer from '../lib/components/YouTubePlayer.svelte';
  import PlayerControls from '../lib/components/PlayerControls.svelte';
  import ChatPanel from '../lib/components/ChatPanel.svelte';
  import QueuePanel from '../lib/components/QueuePanel.svelte';
  import ParticipantsPanel from '../lib/components/ParticipantsPanel.svelte';
  import YouTubeSearch from '../lib/components/YouTubeSearch.svelte';
  import SharePanel from '../lib/components/SharePanel.svelte';
  import Modal from '../lib/components/Modal.svelte';

  export let roomCode = '';

  let ws = null;
  let playerComponent;
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let activeTab = 'queue'; // 'queue' | 'search' | 'chat' | 'participants'
  let showShare = false;
  let myId = '';

  onMount(async () => {
    // Check if room exists first
    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/rooms/${roomCode}/state`);
      if (res.status === 404) {
        toast.error('Ruang tidak ditemukan!');
        window.history.pushState({}, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        return;
      }
    } catch (e) {
      console.error('Failed to check room existence:', e);
    }
    
    connectWebSocket();
  });

  onDestroy(() => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (ws) {
      ws.close();
      ws = null;
    }
  });

  function connectWebSocket() {
    const wsBase = getWsBase();
    const wsUrl = `${wsBase}/api/ws/${roomCode}`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      reconnectAttempts = 0;
      roomState.update((s) => ({ ...s, connected: true, error: null }));

      // Send join
      const name = getStoredName() || 'Anonymous';
      send({ type: 'JOIN', name });
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        handleMessage(data);
      } catch (e) {
        console.error('Failed to parse WS message:', e);
      }
    };

    ws.onclose = () => {
      roomState.update((s) => ({ ...s, connected: false }));
      // Auto-reconnect
      const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000);
      reconnectAttempts++;
      reconnectTimer = setTimeout(connectWebSocket, delay);
    };

    ws.onerror = () => {
      // onclose will fire after this
    };
  }

  function send(payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
      return true;
    }
    toast.error('Koneksi terputus. Mencoba menghubungkan kembali...');
    return false;
  }

  function handleMessage(data) {
    switch (data.type) {
      case 'STATE': {
        const p = data.payload;
        roomState.update((s) => ({
          ...s,
          roomCode: roomCode,
          currentSong: p.currentSong || null,
          queue: p.queue || [],
          isPlaying: p.isPlaying || false,
          currentTime: p.currentTime || 0,
          participants: p.participants || [],
          chats: p.chats || [],
          myRole: p.myRole || 'member',
          chatMode: p.chatMode || 'free'
        }));
        if (p.myId) myId = p.myId;
        break;
      }

      case 'PLAY':
        roomState.update((s) => ({ ...s, isPlaying: true }));
        break;

      case 'PAUSE':
        roomState.update((s) => ({ ...s, isPlaying: false }));
        break;

      case 'NEXT':
        roomState.update((s) => ({
          ...s,
          currentSong: data.currentSong || null,
          queue: data.queue || [],
          currentTime: 0
        }));
        break;

      case 'SEEK': {
        const t = data.time || 0;
        roomState.update((s) => ({ ...s, currentTime: t }));
        if (playerComponent) {
          playerComponent.seekTo(t);
        }
        break;
      }

      case 'ADD_SONG':
        roomState.update((s) => ({ ...s, queue: data.queue || [] }));
        break;

      case 'NEW_MESSAGE':
        roomState.update((s) => ({
          ...s,
          chats: [...(s.chats || []).slice(-199), data.message]
        }));
        break;

      case 'VOLUME':
        roomState.update((s) => ({ ...s, volume: data.volume ?? s.volume }));
        break;

      case 'SYNC':
        roomState.update((s) => {
          // Latency compensation
          const now = Date.now();
          const latency = (now - (data.serverTime || now)) / 1000;
          const adjustedTime = (data.currentTime || 0) + (data.isPlaying ? latency : 0);
          
          const diff = Math.abs((s.currentTime || 0) - adjustedTime);
          
          // Tighter threshold (0.8s) for better real-time feel
          if (diff > 0.8 || s.isPlaying !== data.isPlaying) {
            return {
              ...s,
              isPlaying: data.isPlaying ?? s.isPlaying,
              currentTime: adjustedTime
            };
          }
          return s;
        });
        break;

      case 'PARTICIPANTS':
        roomState.update((s) => ({
          ...s,
          participants: data.participants || [],
          myRole: data.myRole || s.myRole
        }));
        break;

      case 'QUEUE_UPDATE':
        roomState.update((s) => ({ ...s, queue: data.queue || [] }));
        break;

      case 'SET_ROLE':
        if (data.myRole) {
          roomState.update((s) => ({ ...s, myRole: data.myRole }));
        }
        roomState.update((s) => ({
          ...s,
          participants: (s.participants || []).map((p) =>
            p.id === data.userId ? { ...p, role: data.newRole } : p
          )
        }));
        break;

      case 'ERROR':
        toast.error(data.message || 'Terjadi kesalahan');
        break;
    }
  }

  // Player event handlers
  function handlePlay() {
    send({ type: 'PLAY' });
  }

  function handlePause() {
    send({ type: 'PAUSE' });
  }

  function handleNext() {
    send({ type: 'NEXT' });
  }

  function handleSeek(time) {
    send({ type: 'SEEK', time });
  }

  function handleVolume(vol) {
    send({ type: 'VOLUME', volume: vol });
  }

  function handleTimeUpdate(time) {
    roomState.update((s) => ({ ...s, currentTime: time }));
  }

  function handleAddSong(song) {
    send({
      type: 'ADD_SONG',
      youtubeId: song.youtubeId,
      title: song.title,
      thumbnail: song.thumbnail
    });
  }

  function handleRemoveSong(index) {
    send({ type: 'REMOVE_SONG', index });
  }

  function handleReorderSong(from, to) {
    send({ type: 'REORDER_SONG', from, to });
  }

  function handleSendMessage(text, type = 'text') {
    send({ type: 'SEND_MESSAGE', text, type });
  }

  function handleSetRole(userId, newRole) {
    send({ type: 'SET_ROLE', userId, newRole });
  }

  function handleLeave() {
    send({ type: 'LEAVE' });
    if (ws) ws.close();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  // Tab items for mobile
  const tabs = [
    { id: 'queue', label: '📋', title: 'Antrean' },
    { id: 'search', label: '🔍', title: 'Cari' },
    { id: 'chat', label: '💬', title: 'Chat' },
    { id: 'participants', label: '👥', title: 'Peserta' }
  ];
</script>

<div class="min-h-screen pt-16">
  <!-- Connection status -->
  {#if !$connected}
    <div class="fixed top-16 left-0 right-0 z-30 bg-amber-500/20 border-b border-amber-500/30 text-amber-300 text-center py-2 text-sm">
      <span class="inline-block w-2 h-2 rounded-full bg-amber-400 animate-pulse mr-2"></span>
      Menghubungkan kembali...
    </div>
  {/if}

  <!-- Room header -->
  <div class="glass border-b border-dark-700/30">
    <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <button
          onclick={handleLeave}
          class="btn-ghost text-sm text-dark-400 hover:text-white"
        >
          ← Kembali
        </button>
        <div class="h-4 w-px bg-dark-700"></div>
        <div>
          <span class="text-xs text-dark-400">Ruang</span>
          <span class="font-mono font-bold text-white tracking-wider ml-2">{roomCode}</span>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs text-dark-400">{$participants.length} online</span>
        <button onclick={() => showShare = true} class="btn-ghost text-sm">
          📤 Share
        </button>
      </div>
    </div>
  </div>

  <!-- Main layout -->
  <div class="max-w-7xl mx-auto px-4 py-4">
    <div class="grid lg:grid-cols-[1fr_340px] gap-4">
      <!-- Left: Player + Controls -->
      <div class="space-y-4">
        <!-- YouTube Player -->
        <YouTubePlayer
          bind:this={playerComponent}
          videoId={$currentSong?.youtubeId || ''}
          isPlaying={$isPlaying}
          currentTime={$roomState.currentTime}
          volume={$roomState.volume}
          onTimeUpdate={handleTimeUpdate}
        />

        <!-- Player Controls -->
        <PlayerControls
          onPlay={handlePlay}
          onPause={handlePause}
          onNext={handleNext}
          onSeek={handleSeek}
          onVolume={handleVolume}
          seekTo={(t) => playerComponent && playerComponent.seekTo(t)}
        />

        <!-- Mobile tabs -->
        <div class="lg:hidden">
          <div class="flex border-b border-dark-700/50 mb-4">
            {#each tabs as tab}
              <button
                onclick={() => activeTab = tab.id}
                class="flex-1 py-3 text-center text-sm transition-colors {activeTab === tab.id ? 'text-primary-400 border-b-2 border-primary-400' : 'text-dark-400'}"
              >
                {tab.label} {tab.title}
              </button>
            {/each}
          </div>

          <div class="card" style="height: 400px;">
            {#if activeTab === 'queue'}
              <QueuePanel
                onRemoveSong={handleRemoveSong}
                onReorderSong={handleReorderSong}
              />
            {:else if activeTab === 'search'}
              <YouTubeSearch onAddSong={handleAddSong} />
            {:else if activeTab === 'chat'}
              <ChatPanel onSendMessage={handleSendMessage} />
            {:else if activeTab === 'participants'}
              <ParticipantsPanel onSetRole={handleSetRole} />
            {/if}
          </div>
        </div>
      </div>

      <!-- Right: Desktop panels -->
      <div class="hidden lg:flex flex-col gap-4">
        <!-- Tab switcher -->
        <div class="flex border-b border-dark-700/50">
          {#each tabs as tab}
            <button
              onclick={() => activeTab = tab.id}
              class="px-4 py-2 text-sm transition-colors {activeTab === tab.id ? 'text-primary-400 border-b-2 border-primary-400' : 'text-dark-400 hover:text-dark-200'}"
            >
              {tab.label} {tab.title}
            </button>
          {/each}
        </div>

        <div class="card flex-1 min-h-0" style="height: 500px;">
          {#if activeTab === 'queue'}
            <QueuePanel
              onRemoveSong={handleRemoveSong}
              onReorderSong={handleReorderSong}
            />
          {:else if activeTab === 'search'}
            <YouTubeSearch onAddSong={handleAddSong} />
          {:else if activeTab === 'chat'}
            <ChatPanel onSendMessage={handleSendMessage} />
          {:else if activeTab === 'participants'}
            <ParticipantsPanel onSetRole={handleSetRole} />
          {/if}
        </div>
      </div>
    </div>
  </div>
</div>

<!-- Share Modal -->
<Modal open={showShare} title="📤 Bagikan Ruang" onClose={() => showShare = false}>
  <SharePanel {roomCode} />
</Modal>
