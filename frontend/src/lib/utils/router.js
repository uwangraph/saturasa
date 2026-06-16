import { writable } from 'svelte/store';

function createRouter() {
  const { subscribe, set } = writable(getCurrentRoute());

  function getCurrentRoute() {
    const path = window.location.pathname;
    if (path === '/') return { page: 'home' };
    if (path === '/tentang') return { page: 'about' };
    
    // Everything else is treated as a room code
    const code = path.startsWith('/') ? path.substring(1) : path;
    if (code) {
      return { page: 'room', id: code };
    }
    
    return { page: 'home' };
  }

  function navigate(path) {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }

  window.addEventListener('popstate', () => {
    set(getCurrentRoute());
  });

  return {
    subscribe,
    navigate,
    current: getCurrentRoute
  };
}

export const router = createRouter();
export const currentPage = router;
