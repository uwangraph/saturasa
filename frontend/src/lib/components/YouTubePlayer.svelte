<script>
  import { onMount, onDestroy } from 'svelte';
  import { formatTime } from '../utils/helpers.js';

  export let videoId = '';
  export let isPlaying = false;
  export let currentTime = 0;
  export let volume = 80;
  export let onReady = () => {};
  export let onStateChange = () => {};
  export let onTimeUpdate = () => {};

  let player = null;
  let containerId = 'yt-player-' + Math.random().toString(36).slice(2, 8);
  let timeUpdateInterval = null;
  let ready = false;

  // YouTube IFrame API callback
  window.onYouTubeIframeAPIReady = function () {
    initPlayer();
  };

  function initPlayer() {
    if (!window.YT || !window.YT.Player) {
      // API not loaded yet, retry
      setTimeout(initPlayer, 500);
      return;
    }

    player = new window.YT.Player(containerId, {
      height: '100%',
      width: '100%',
      videoId: videoId || '',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
        origin: window.location.origin
      },
      events: {
        onReady: (e) => {
          ready = true;
          player.setVolume(volume);
          onReady(e);
        },
        onStateChange: (e) => {
          onStateChange(e);
        }
      }
    });
  }

  // React to videoId changes
  $: if (player && ready && videoId) {
    player.loadVideoById(videoId);
    if (isPlaying) {
      player.playVideo();
    }
  }

  // React to play/pause
  $: if (player && ready) {
    if (isPlaying && player.getPlayerState() !== 1) {
      player.playVideo();
    } else if (!isPlaying && player.getPlayerState() !== 2) {
      player.pauseVideo();
    }
  }

  // React to currentTime changes (for sync/seek from server)
  $: if (player && ready && typeof currentTime === 'number') {
    const diff = Math.abs(player.getCurrentTime() - currentTime);
    if (diff > 2) {
      player.seekTo(currentTime, true);
    }
  }

  // React to volume
  $: if (player && ready) {
    player.setVolume(volume);
  }

  // Time tracking
  onMount(() => {
    // Try init if API already loaded
    if (window.YT && window.YT.Player) {
      initPlayer();
    }

    timeUpdateInterval = setInterval(() => {
      if (player && ready && typeof player.getCurrentTime === 'function') {
        const t = player.getCurrentTime();
        onTimeUpdate(t);
      }
    }, 1000);
  });

  onDestroy(() => {
    if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    if (player) {
      try { player.destroy(); } catch (e) { /* ignore */ }
    }
  });

  // Expose seek function
  export function seekTo(seconds) {
    if (player && ready) {
      player.seekTo(seconds, true);
    }
  }
</script>

<div class="yt-player-wrapper bg-dark-900 rounded-xl overflow-hidden">
  <div id={containerId} class="absolute inset-0"></div>
  {#if !videoId}
    <div class="absolute inset-0 flex items-center justify-center bg-dark-900">
      <div class="text-center">
        <div class="text-4xl mb-3">🎵</div>
        <p class="text-dark-400 text-sm">Belum ada lagu</p>
        <p class="text-dark-500 text-xs mt-1">Cari dan tambahkan lagu dari YouTube</p>
      </div>
    </div>
  {/if}
</div>
