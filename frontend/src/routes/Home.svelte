<script>
  import { onMount } from 'svelte';
  import { currentPage } from '../lib/utils/router.js';
  import { generateRoomCode, getStoredName, storeName, getApiBase } from '../lib/utils/helpers.js';
  import { toast } from '../lib/stores/toast.js';

  let userName = $state('');
  let joinCode = $state('');
  let roomName = $state('');
  let creating = $state(false);
  let useCustomName = $state(false);

  onMount(() => {
    userName = getStoredName();
  });

  async function createRoom() {
    if (!userName.trim()) {
      toast.error('Masukkan namamu dulu!');
      return;
    }
    storeName(userName.trim());

    creating = true;

    try {
      const body = {};
      if (useCustomName && roomName.trim()) {
        body.roomName = roomName.trim();
      }

      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (data.roomCode) {
        window.history.pushState({}, '', `/${data.roomCode}`);
        window.dispatchEvent(new PopStateEvent('popstate'));
      } else if (data.error) {
        toast.error(data.error);
      } else {
        toast.error('Gagal membuat ruang');
      }
    } catch (e) {
      // Fallback: generate client-side
      const code = generateRoomCode();
      window.history.pushState({}, '', `/${code}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    } finally {
      creating = false;
    }
  }

  function joinRoom() {
    if (!userName.trim()) {
      toast.error('Masukkan namamu dulu!');
      return;
    }
    if (!joinCode.trim()) {
      toast.error('Masukkan kode atau nama ruang!');
      return;
    }
    storeName(userName.trim());
    const code = joinCode.trim().toLowerCase().replace(/\s+/g, '-');
    window.history.pushState({}, '', `/${code}`);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
</script>

<div class="min-h-screen flex flex-col">
  <!-- Hero -->
  <section class="flex-1 flex items-center justify-center px-4 pt-20 pb-12">
    <div class="max-w-3xl mx-auto text-center">
      <!-- Decorative elements -->
      <div class="relative inline-block mb-8">
        <div class="absolute inset-0 bg-primary-500/20 blur-3xl rounded-full"></div>
        <div class="relative w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-2xl shadow-primary-500/30 animate-bounce-slow">
          <svg class="w-14 h-14 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
          </svg>
        </div>
      </div>

      <h1 class="font-display text-5xl md:text-7xl font-bold text-white mb-4 leading-tight">
        Satu <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-500">Rasa</span>,
        <br />
        Satu Lagu
      </h1>
      <p class="text-xl md:text-2xl text-dark-300 mb-3 font-light">
        Dengarkan musik bareng teman, kapan aja, di mana aja.
      </p>
      <p class="text-sm text-dark-500 mb-10">
        Tanpa akun. Tanpa ribet. Cukup masukkan nama dan mulai mendengarkan.
      </p>

      <!-- Name input -->
      <div class="card p-6 max-w-lg mx-auto mb-6">
        <label for="home-username" class="block text-sm font-medium text-dark-300 mb-2 text-left">Siapa namamu?</label>
        <input
          id="home-username"
          type="text"
          bind:value={userName}
          placeholder="Masukkan nama panggilan..."
          class="input text-center text-lg"
          maxlength="20"
          onkeydown={(e) => e.key === 'Enter' && createRoom()}
        />
      </div>

      <!-- Room name input -->
      <div class="card p-6 max-w-lg mx-auto mb-6">
        <div class="flex items-center justify-between mb-3">
          <label for="room-name" class="block text-sm font-medium text-dark-300 text-left">Nama ruang (opsional)</label>
          <button
            onclick={() => useCustomName = !useCustomName}
            class="text-xs px-3 py-1 rounded-full transition-all {useCustomName ? 'bg-primary-500 text-white' : 'bg-dark-700 text-dark-400 hover:text-white'}"
          >
            {useCustomName ? '✓ Custom' : 'Random'}
          </button>
        </div>

        {#if useCustomName}
          <input
            id="room-name"
            type="text"
            bind:value={roomName}
            placeholder="Misalnya: chill-vibes, ngobrol-santai..."
            class="input text-center"
            maxlength="20"
            onkeydown={(e) => e.key === 'Enter' && createRoom()}
          />
          <p class="text-xs text-dark-500 mt-2 text-left">
            Hanya huruf, angka, dash (-), dan underscore (_). Min 3 karakter.
          </p>
        {:else}
          <div class="input text-center text-dark-400 bg-dark-800/50">
            🔀 Kode random akan dibuat otomatis
          </div>
        {/if}
      </div>

      <!-- Action buttons -->
      <div class="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
        <button
          onclick={createRoom}
          disabled={creating}
          class="btn-primary text-lg px-8 py-4 min-w-[200px]"
        >
          {#if creating}
            <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
            Membuat...
          {:else}
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Buat Ruang
          {/if}
        </button>
      </div>

      <!-- Join with code -->
      <div class="max-w-sm mx-auto">
        <p id="join-label" class="text-dark-400 text-sm mb-3">Atau gabung ruang yang sudah ada</p>
        <div class="flex gap-2">
          <input
            id="join-code"
            type="text"
            bind:value={joinCode}
            placeholder="Kode atau nama ruang..."
            class="input text-center font-mono"
            onkeydown={(e) => e.key === 'Enter' && joinRoom()}
          />
          <button onclick={joinRoom} class="btn-secondary whitespace-nowrap">
            Gabung
          </button>
        </div>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="py-6 text-center text-dark-600 text-sm mt-auto">
    SatuRasa v1.0 — Satu Rasa, Satu Lagu, Dimana Saja
  </footer>
</div>
