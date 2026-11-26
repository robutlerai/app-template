/*
 * The app: a counter kept per person in host.kv.
 *
 * An app runs in user space and its bridge is untrusted in both directions: a stored value and a command's
 * arguments are checked before they are used, and a handler returns plain data. Opened on its own, with no
 * host, the counter still works and lasts for the session.
 */

const KEY = 'count';
const MAX = 1e9;

const host = typeof window !== 'undefined' ? window.host : undefined;
const out = document.getElementById('count');
const add = document.getElementById('add');

let count = 0;
let saved = false; // true once the host's store answered

// A stored or incoming value is hostile until proven a small non-negative integer.
const toCount = (v) => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= MAX ? Math.floor(v) : 0);

function show() {
  out.textContent = String(count);
}

async function start() {
  show();
  if (!host || typeof host.ready !== 'function') return;
  try {
    await host.ready();
  } catch {
    return;
  }
  saved = !!(host.kv && typeof host.kv.get === 'function');
  if (saved) {
    try {
      count = Math.max(count, toCount(await host.kv.get(KEY, { scope: 'private' })));
    } catch {
      // No stored value yet: keep what is on screen.
    }
    show();
  }
  if (host.commands && typeof host.commands.handle === 'function') {
    host.commands.handle('getState', () => ({ count }));
  }
}

add.addEventListener('click', async () => {
  count = toCount(count + 1);
  show();
  if (!saved) return;
  try {
    await host.kv.set(KEY, count, { scope: 'private' });
  } catch {
    // The count stays on screen; the next click saves it.
  }
});

start();
