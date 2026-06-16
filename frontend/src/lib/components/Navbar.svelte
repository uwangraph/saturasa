<script>
  import { currentPage } from '../utils/router.js';

  function goHome() {
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
</script>

<nav class="fixed top-0 left-0 right-0 z-40 glass">
  <div class="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
    <button onclick={goHome} class="flex items-center gap-3 group">
      <div class="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/25 group-hover:shadow-primary-500/40 transition-shadow">
        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </div>
      <span class="font-display font-bold text-xl text-white">
        Satu<span class="text-primary-400">Rasa</span>
      </span>
    </button>

    <div class="flex items-center gap-2">
      <a
        href="/tentang"
        onclick={(e) => {
          e.preventDefault();
          window.history.pushState({}, '', '/tentang');
          window.dispatchEvent(new PopStateEvent('popstate'));
        }}
        class="btn-ghost text-sm"
        class:text-primary-400={$currentPage.page === 'about'}
      >
        Tentang
      </a>
    </div>
  </div>
</nav>
