/**
 * Storage that never throws.
 *
 * Mobile browsers (especially iOS Safari) block localStorage inside
 * cross-site iframes/previews. A bare localStorage access would throw a
 * SecurityError and blank the whole app, so we fall back to memory.
 */
const memory = new Map();
let available = null;

function probe() {
  if (available !== null) return available;
  try {
    const key = '__zayka_probe__';
    window.localStorage.setItem(key, '1');
    window.localStorage.removeItem(key);
    available = true;
  } catch {
    available = false;
  }
  return available;
}

export const storage = {
  get(key) {
    try {
      if (probe() && typeof window !== 'undefined') {
        const v = window.localStorage.getItem(key);
        if (v !== null) return v;
      }
    } catch { /* ignore */ }
    return memory.has(key) ? memory.get(key) : null;
  },
  set(key, value) {
    memory.set(key, value);
    try {
      if (probe() && typeof window !== 'undefined') window.localStorage.setItem(key, value);
    } catch { /* ignore */ }
  },
  remove(key) {
    memory.delete(key);
    try {
      if (probe() && typeof window !== 'undefined') window.localStorage.removeItem(key);
    } catch { /* ignore */ }
  },
  getJSON(key, fallback = null) {
    const raw = storage.get(key);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch { return fallback; }
  },
  setJSON(key, value) {
    storage.set(key, JSON.stringify(value));
  },
};
