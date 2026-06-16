<script>
  import { fade, scale } from 'svelte/transition';
  export let open = false;
  export let title = '';
  export let onClose = () => {};

  function handleKeydown(e) {
    if (e.key === 'Escape') onClose();
  }
</script>

{#if open}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div
    transition:fade={{ duration: 150 }}
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    role="dialog"
    aria-modal="true"
    aria-label={title}
    tabindex="-1"
    onkeydown={handleKeydown}
    onclick={(e) => { if (e.target === e.currentTarget) onClose(); }}
  >
    <div
      transition:scale={{ duration: 200, start: 0.95 }}
      class="card w-full max-w-md p-6 shadow-2xl"
    >
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-display font-bold text-white">{title}</h3>
        <button onclick={onClose} class="btn-ghost p-2 text-dark-400 hover:text-white" aria-label="Tutup">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <slot />
    </div>
  </div>
{/if}
