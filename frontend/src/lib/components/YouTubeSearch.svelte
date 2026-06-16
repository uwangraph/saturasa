<script>
  import { onMount } from 'svelte';
  import { extractYouTubeId, getApiBase } from '../utils/helpers.js';
  import { toast } from '../stores/toast.js';

  export let onAddSong = () => {};

  let query = '';
  let results = [];
  let searching = false;
  let showResults = false;

  async function search() {
    if (!query.trim()) return;
    searching = true;
    showResults = true;
    results = [];

    try {
      const apiBase = getApiBase();
      const res = await fetch(`${apiBase}/api/youtube/search?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        results = await res.json();
      } else {
        toast.error('Gagal mencari lagu');
      }
    } catch (e) {
      toast.error('Gagal terhubung ke server');
    } finally {
      searching = false;
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      search();
    }
  }

  function addSong(song) {
    onAddSong(song);
    toast.success(`"${song.title}" ditambahkan ke antrean`);
  }
</script>

<div class="flex flex-col h-full">
  <div class="px-4 py-3 border-b border-dark-700/50">
    <h3 class="font-semibold text-white text-sm flex items-center gap-2">
      🔍 Cari Lagu
    </h3>
  </div>

  <div class="p-3">
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={query}
        onkeydown={handleKeydown}
        placeholder="Cari di YouTube..."
        class="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
      />
      <button
        onclick={search}
        disabled={searching || !query.trim()}
        class="px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-30 text-white rounded-lg transition-colors"
      >
        {#if searching}
          <svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        {:else}
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        {/if}
      </button>
    </div>
  </div>

  {#if showResults}
    <div class="flex-1 overflow-y-auto px-3 pb-3 min-h-0">
      {#if searching}
        <div class="flex items-center justify-center py-8">
          <div class="text-dark-400 text-sm">Mencari...</div>
        </div>
      {:else if results.length === 0}
        <div class="text-center text-dark-500 text-sm py-8">
          Tidak ada hasil ditemukan
        </div>
      {:else}
        <div class="space-y-2">
          {#each results as song}
            <button
              onclick={() => addSong(song)}
              class="w-full flex gap-3 p-2 rounded-lg hover:bg-dark-800/50 transition-colors text-left group"
            >
              {#if song.thumbnail}
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  class="w-20 h-14 rounded object-cover shrink-0"
                />
              {/if}
              <div class="flex-1 min-w-0">
                <p class="text-sm text-white truncate group-hover:text-primary-400 transition-colors">{song.title}</p>
                <p class="text-xs text-dark-400 truncate">{song.channelTitle || ''}</p>
              </div>
              <div class="flex items-center">
                <span class="text-primary-400 opacity-0 group-hover:opacity-100 transition-opacity text-sm">+</span>
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
  {/if}
</div>
