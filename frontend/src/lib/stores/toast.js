import { writable } from 'svelte/store';

function createToastStore() {
  const { subscribe, update } = writable([]);

  function add(message, type = 'info', duration = 3000) {
    const id = Date.now() + Math.random();
    update((toasts) => [...toasts, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => remove(id), duration);
    }
    return id;
  }

  function remove(id) {
    update((toasts) => toasts.filter((t) => t.id !== id));
  }

  return {
    subscribe,
    success: (msg) => add(msg, 'success'),
    error: (msg) => add(msg, 'error'),
    info: (msg) => add(msg, 'info'),
    warn: (msg) => add(msg, 'warn'),
    remove,
    add
  };
}

export const toast = createToastStore();
