<script>
  import { participants, myRole, isHost } from '../stores/room.js';

  export let onSetRole = () => {};

  const roleLabels = {
    host: '👑 Host',
    'co-host': '🛡️ Co-host',
    member: '🎵 Member',
    'listener-only': '👂 Listener'
  };

  const roleColors = {
    host: 'text-amber-400',
    'co-host': 'text-blue-400',
    member: 'text-dark-300',
    'listener-only': 'text-dark-400'
  };
</script>

<div class="flex flex-col h-full">
  <div class="px-4 py-3 border-b border-dark-700/50">
    <h3 class="font-semibold text-white text-sm flex items-center gap-2">
      👥 Peserta
      <span class="text-xs text-dark-400 font-normal">({$participants.length})</span>
    </h3>
  </div>

  <div class="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
    {#each $participants as p (p.id)}
      <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-800/50 transition-colors">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {(p.name || '?').charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-sm text-white truncate">
            {p.name}
            {#if p.id === 'me'}
              <span class="text-dark-500 text-xs">(kamu)</span>
            {/if}
          </p>
          <p class="text-xs {roleColors[p.role] || 'text-dark-400'}">
            {roleLabels[p.role] || p.role}
          </p>
        </div>
        {#if $isHost && p.role !== 'host'}
          <div class="relative group">
            <button class="p-1 text-dark-500 hover:text-white transition-colors" aria-label="Ubah role {p.name}">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"/>
              </svg>
            </button>
            <div class="absolute right-0 top-full mt-1 bg-dark-800 border border-dark-600 rounded-lg shadow-xl py-1 z-10 hidden group-hover:block min-w-[140px]">
              {#each ['member', 'listener-only'] as role}
                <button
                  onclick={() => onSetRole(p.id, role)}
                  class="w-full text-left px-3 py-1.5 text-sm text-dark-200 hover:bg-dark-700 hover:text-white transition-colors"
                  class:text-primary-400={p.role === role}
                >
                  {roleLabels[role] || role}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/each}
  </div>
</div>
