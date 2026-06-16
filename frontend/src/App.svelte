<script>
  import { currentPage } from './lib/utils/router.js';
  import Navbar from './lib/components/Navbar.svelte';
  import Toast from './lib/components/Toast.svelte';
  import Home from './routes/Home.svelte';
  import Room from './routes/Room.svelte';
  import About from './routes/About.svelte';
</script>

<Navbar />
<Toast />

<main>
  {#if $currentPage.page === 'home'}
    <Home />
  {:else if $currentPage.page === 'room'}
    <Room roomCode={$currentPage.id} />
  {:else if $currentPage.page === 'about'}
    <About />
  {/if}
</main>
