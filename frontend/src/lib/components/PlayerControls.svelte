<script>
  import { isPlaying, currentSong, roomState, myRole } from '../stores/room.js';
  import { canControl } from '../stores/room.js';
  import { formatTime } from '../utils/helpers.js';

  export let onPlay = () => {};
  export let onPause = () => {};
  export let onNext = () => {};
  export let onSeek = () => {};
  export let onVolume = () => {};
  export let seekTo = () => {};
  export let onVoteSkip = () => {};
  export let skipVotes = [];
  export let totalParticipants = 0;
  export let myId = '';

  $: canCtrl = canControl($myRole);
  $: vol = $roomState.volume;
  $: hasVoted = skipVotes.includes(myId);
  $: votePercentage = totalParticipants > 0 ? Math.round((skipVotes.length / totalParticipants) * 100) : 0;

  let seekPercent = 0;
  let isSeeking = false;

  $: if ($currentSong && !isSeeking && $currentSong.duration) {
    seekPercent = ($roomState.currentTime / $currentSong.duration) * 100;
  }

  function handleSeekStart() {
    isSeeking = true;
  }

  function handleSeekMove(e) {
    if (!isSeeking) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    seekPercent = Math.max(0, Math.min(100, (x / rect.width) * 100));
  }

  function handleSeekEnd(e) {
    if (!isSeeking || !canCtrl) return;
    isSeeking = false;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    if ($currentSong?.duration) {
      const time = (percent / 100) * $currentSong.duration;
      onSeek(time);
      seekTo(time);
    }
  }

  function handleVolume(e) {
    if (!canCtrl) return;
    const v = parseInt(e.target.value);
    onVolume(v);
  }

  function togglePlay() {
    if (!canCtrl) return;
    if ($isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  }
</script>

<div class="card p-4">
  <!-- Song info -->
  {#if $currentSong}
    <div class="flex items-center gap-3 mb-4">
      {#if $currentSong.thumbnail}
        <img
          src={$currentSong.thumbnail}
          alt={$currentSong.title}
          class="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      {/if}
      <div class="min-w-0">
        <p class="text-sm font-semibold text-white truncate">{$currentSong.title}</p>
        <p class="text-xs text-dark-400">{$currentSong.addedBy || 'Unknown'}</p>
      </div>
    </div>
  {/if}

  <!-- Seek bar -->
  <div
    role="slider"
    tabindex="0"
    aria-label="Seek"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={Math.round(seekPercent)}
    class="mb-3"
    onmousedown={handleSeekStart}
    onmousemove={handleSeekMove}
    onmouseup={handleSeekEnd}
    onmouseleave={() => isSeeking = false}
    onkeydown={(e) => {
      if (!canCtrl || !$currentSong?.duration) return;
      if (e.key === 'ArrowRight') { onSeek(Math.min($currentSong.duration, $roomState.currentTime + 5)); }
      if (e.key === 'ArrowLeft') { onSeek(Math.max(0, $roomState.currentTime - 5)); }
    }}
  >
    <div class="h-1.5 bg-dark-700 rounded-full cursor-pointer group relative">
      <div
        class="h-full bg-gradient-to-r from-primary-400 to-primary-500 rounded-full relative"
        style="width: {seekPercent}%"
      >
        <div class="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </div>
    </div>
    <div class="flex justify-between mt-1 text-[10px] text-dark-500">
      <span>{formatTime($roomState.currentTime)}</span>
      <span>{formatTime($currentSong?.duration || 0)}</span>
    </div>
  </div>

  <!-- Controls -->
  <div class="flex items-center justify-center gap-4">
    <!-- Volume -->
    <div class="flex items-center gap-2 mr-auto">
      <button
        onclick={() => canCtrl && onVolume(vol > 0 ? 0 : 80)}
        class="text-dark-400 hover:text-white transition-colors"
      >
        {#if vol === 0}
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
          </svg>
        {:else}
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
          </svg>
        {/if}
      </button>
      <input
        type="range"
        min="0"
        max="100"
        value={vol}
        oninput={handleVolume}
        disabled={!canCtrl}
        class="w-16 h-1 accent-primary-500 disabled:opacity-30"
      />
    </div>

    <!-- Play controls -->
    <div class="flex items-center gap-2">
      <button
        onclick={onVoteSkip}
        disabled={hasVoted || !$currentSong}
        class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all {hasVoted ? 'bg-primary-500/20 text-primary-400' : 'bg-dark-700 text-dark-300 hover:bg-dark-600'}"
      >
        <span>🗳️</span>
        <span>{skipVotes.length}</span>
        <span>({votePercentage}%)</span>
      </button>

      <button
        onclick={togglePlay}
        disabled={!canCtrl || !$currentSong}
        class="w-12 h-12 rounded-full bg-primary-500 hover:bg-primary-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center shadow-lg shadow-primary-500/25 transition-all active:scale-95"
      >
        {#if $isPlaying}
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        {:else}
          <svg class="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z"/>
          </svg>
        {/if}
      </button>

      <button
        onclick={() => canCtrl && onNext()}
        disabled={!canCtrl}
        aria-label="Skip ke lagu berikutnya"
        class="w-10 h-10 rounded-full bg-dark-700 hover:bg-dark-600 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all active:scale-95"
      >
        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
        </svg>
      </button>
    </div>
  </div>

  {#if !canCtrl}
    <p class="text-center text-xs text-dark-500 mt-3">
      👂 Mode Listener — Hanya host yang bisa mengontrol musik
    </p>
  {/if}
</div>
