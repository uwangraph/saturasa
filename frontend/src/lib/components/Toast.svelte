<script>
  import { toast } from '../stores/toast.js';
  import { fly, fade } from 'svelte/transition';

  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warn: '⚠'
  };

  const colors = {
    success: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
    error: 'bg-red-500/20 border-red-500/40 text-red-300',
    info: 'bg-primary-500/20 border-primary-500/40 text-primary-300',
    warn: 'bg-amber-500/20 border-amber-500/40 text-amber-300'
  };
</script>

<div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
  {#each $toast as t (t.id)}
    <div
      in:fly={{ x: 100, duration: 300 }}
      out:fade={{ duration: 200 }}
      class="flex items-center gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-lg {colors[t.type]}"
    >
      <span class="text-lg font-bold">{icons[t.type]}</span>
      <span class="text-sm font-medium flex-1">{t.message}</span>
      <button
        onclick={() => toast.remove(t.id)}
        class="text-current/50 hover:text-current transition-colors"
      >
        ✕
      </button>
    </div>
  {/each}
</div>
