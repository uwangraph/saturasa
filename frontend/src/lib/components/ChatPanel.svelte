<script>
  import { onMount, tick } from 'svelte';
  import { chats, roomState } from '../stores/room.js';
  import { formatTime } from '../utils/helpers.js';

  export let onSendMessage = () => {};

  let messageInput = '';
  let chatContainer;

  function send() {
    const text = messageInput.trim();
    if (!text) return;
    onSendMessage(text, 'text');
    messageInput = '';
  }

  function handleKeydown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  // Auto-scroll on new messages
  $: if ($chats && chatContainer) {
    tick().then(() => {
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    });
  }

  function formatTimestamp(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
  }
</script>

<div class="flex flex-col h-full">
  <div class="px-4 py-3 border-b border-dark-700/50">
    <h3 class="font-semibold text-white text-sm flex items-center gap-2">
      💬 Chat
      <span class="text-xs text-dark-400 font-normal">({$chats.length})</span>
    </h3>
  </div>

  <!-- Messages -->
  <div bind:this={chatContainer} class="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
    {#if $chats.length === 0}
      <div class="text-center text-dark-500 text-sm py-8">
        Belum ada pesan. Mulai ngobrol! 👋
      </div>
    {/if}
    {#each $chats as msg (msg.id)}
      {#if msg.type === 'system'}
        <div class="text-center text-xs text-dark-500 py-1">
          {msg.text}
        </div>
      {:else}
        <div class="group">
          <div class="flex items-baseline gap-2">
            <span class="text-xs font-semibold text-primary-400">{msg.userName}</span>
            <span class="text-[10px] text-dark-600">{formatTimestamp(msg.timestamp)}</span>
          </div>
          <p class="text-sm text-dark-200 break-words">{msg.text}</p>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Input -->
  <div class="p-3 border-t border-dark-700/50">
    <div class="flex gap-2">
      <input
        type="text"
        bind:value={messageInput}
        onkeydown={handleKeydown}
        placeholder="Ketik pesan..."
        class="flex-1 px-3 py-2 bg-dark-800 border border-dark-600 rounded-lg text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 transition-colors"
        maxlength="500"
      />
      <button
        onclick={send}
        disabled={!messageInput.trim()}
        aria-label="Kirim pesan"
        class="px-3 py-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
        </svg>
      </button>
    </div>
  </div>
</div>
