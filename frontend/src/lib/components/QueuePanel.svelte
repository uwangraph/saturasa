<script>
  import { queue, currentSong, isHost, myRole } from '../stores/room.js';
  import { canControl } from '../stores/room.js';
  import { formatTime } from '../utils/helpers.js';

  export let onRemoveSong = () => {};
  export let onReorderSong = () => {};

  $: canCtrl = canControl($myRole);
</script>

<div class="flex flex-col h-full">
  <div class="px-4 py-3 border-b border-dark-700/50 flex items-center justify-between">
    <h3 class="font-semibold text-white text-sm flex items-center gap-2">
      📋 Antrean
      <span class="text-xs text-dark-400 font-normal">({$queue.length})</span>
    </h3>
  </div>

  <div class="flex-1 overflow-y-auto min-h-0">
    <!-- Current song -->
    {#if $currentSong}
      <div class="p-3 border-b border-dark-700/30">
        <div class="text-xs text-dark-400 mb-2 font-medium">🎵 Sedang Diputar</div>
        <div class="flex gap-3">
          {#if $currentSong.thumbnail}
            <img
              src={$currentSong.thumbnail}
              alt={$currentSong.title}
              class="w-16 h-12 rounded-lg object-cover shrink-0"
            />
          {/if}
          <div class="min-w-0">
            <p class="text-sm font-medium text-white truncate">{$currentSong.title}</p>
            <p class="text-xs text-dark-400">oleh {$currentSong.addedBy || 'Unknown'}</p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Queue -->
    {#if $queue.length === 0}
      <div class="text-center text-dark-500 text-sm py-8">
        <div class="text-2xl mb-2">📭</div>
        Antrean kosong
      </div>
    {:else}
      <div class="p-2 space-y-1">
        {#each $queue as song, i (song.id || i)}
          <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800/50 group transition-colors">
            <span class="text-xs text-dark-500 w-5 text-right">{i + 1}</span>
            {#if song.thumbnail}
              <img
                src={song.thumbnail}
                alt={song.title}
                class="w-12 h-9 rounded object-cover shrink-0"
              />
            {/if}
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white truncate">{song.title}</p>
              <p class="text-xs text-dark-400">{song.addedBy || 'Unknown'}</p>
            </div>
            {#if canCtrl}
              <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {#if i > 0}
                  <button
                    onclick={() => onReorderSong(i, i - 1)}
                    class="p-1 text-dark-400 hover:text-white transition-colors"
                    title="Pindah ke atas"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/>
                    </svg>
                  </button>
                {/if}
                {#if i < $queue.length - 1}
                  <button
                    onclick={() => onReorderSong(i, i + 1)}
                    class="p-1 text-dark-400 hover:text-white transition-colors"
                    title="Pindah ke bawah"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                    </svg>
                  </button>
                {/if}
                <button
                  onclick={() => onRemoveSong(i)}
                  class="p-1 text-dark-400 hover:text-red-400 transition-colors"
                  title="Hapus"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
